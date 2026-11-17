<!-- Created by AI. -->

# Implementação — RNF-SEC-05, 13, 14, 15 e 16

## Status

| Requisito | Status | Resumo |
|---|---|---|
| RNF-SEC-05 — Criptografia no banco | **Parcial (backups atendidos)** | Backups cifrados com AES-256. Criptografia dos volumes é responsabilidade do provedor (TODO: evidência) |
| RNF-SEC-13 — SQL injection e validação | **Atendido nas rotas do app (admin e gestor como recomendação)** | SQL injection já atendido. Validação com Zod nas rotas de auth e denúncias; P2000 vira 400 |
| RNF-SEC-14 | **Lacuna no documento** | O número não existe na v1 nem na v2 dos requisitos |
| RNF-SEC-15 — Backup e SLA | **Parcial (backup pronto; produção depende de secrets e de decisões)** | Scripts, workflow, teste de restore e runbook prontos |
| RNF-SEC-16 — Logs de segurança | **Atendido no código (centralização e retenção dependem da plataforma)** | Logger com mascaramento, logs sem e-mail ou token, eventos de falha de login e bloqueio |

**Onde está o código:**

| Repositório | O que contém |
|---|---|
| `camilamta275/fiscalize-mobile` | Backup e restauração: `ops/backup/`, `.github/workflows/backup.yml` e esta documentação |
| `rapheto/fiscalize-backend` (submódulo `backend/`), branch `feature/rnf-sec-05-13-15-16` | Logs (RNF-SEC-16) e validação (RNF-SEC-13) |

Depois do merge no backend, o ponteiro do submódulo no repositório mobile
precisa ser atualizado.

**Testes no CI:** o `regressao.yml` do mobile já roda `npm test` do backend
(jobs `unit` e `regression`) na versão apontada pelo submódulo. O backend não
tinha CI próprio; foi adicionado `backend/.github/workflows/ci.yml`, que roda
`npm ci`, `npm run build` e `npm test` em cada push e PR do repositório do
backend.

Escopo deliberado: mudanças pequenas e pontuais. Quando uma parte do requisito
não faz sentido no código, ou não cabe ao time, ela não foi implementada e a
justificativa está registrada abaixo. Itens que dependem de informações que
ainda não temos estão marcados como **TODO**, com responsável sugerido.

---

## RNF-SEC-05 — Criptografia no banco de dados

> O banco de dados PostgreSQL deve utilizar criptografia em repouso (AES-256)
> tanto nos volumes do banco quanto nos arquivos de backup.

### O que já existia

Nada no repositório. O backend só consome a `DATABASE_URL`
(`backend/src/config/prisma.ts`). O banco de produção é gerenciado por um
provedor externo, ainda não confirmado (Railway ou Neon).

### O que foi implementado

**Backups cifrados com AES-256.**

| Arquivo | Função |
|---|---|
| `ops/backup/backup.sh` | `pg_dump --format=custom` enviado direto para `gpg --symmetric --cipher-algo AES256`. O dump em texto puro nunca é gravado em disco |
| `ops/backup/common.sh` | Opções do gpg, validação da passphrase (mínimo de 20 caracteres) e GnuPG em diretório temporário |
| `.github/workflows/backup.yml` | Passo **Conferir cifragem AES-256**: falha se o arquivo estiver em texto puro ou se o algoritmo não for AES-256 |

Detalhes:

- **Algoritmo:** OpenPGP simétrico, `cipher 9` (AES-256), derivação de chave
  S2K com SHA-512 e verificação de integridade (MDC), formato padrão do GnuPG.
  Foi usado gpg em vez de `age`, porque o `age` usa ChaCha20-Poly1305, não AES.
- **Chave:** a passphrase vem da variável `BACKUP_PASSPHRASE` (secret no
  GitHub Actions). Ela é passada ao gpg por descritor de arquivo, não pela linha
  de comando, para não aparecer em `ps` nem em log.
- **Isolamento:** cada execução usa um `GNUPGHOME` temporário. O chaveiro do
  usuário não é lido nem alterado.
- **Integridade:** cada backup tem um `.sha256`, conferido pelo `restore.sh`
  antes de decifrar.

### O que não foi implementado e por quê

**1. Criptografia dos volumes do banco.**
Num banco gerenciado, o disco pertence ao provedor. A aplicação não tem acesso
ao volume, e o PostgreSQL da comunidade não oferece criptografia transparente de
dados (TDE). Não existe implementação possível no código do Fiscalize. O papel
do time é **escolher um provedor que cifre os volumes e guardar a evidência**
(página de segurança ou documentação do provedor). Não afirmamos aqui que o
provedor atual cifra os volumes, porque o provedor ainda não foi confirmado.

**2. Criptografia de colunas (por exemplo, CPF).**
Desproporcional neste momento:

- `cidadao.cpf` tem índice único (`@unique` e `idx_cidadao_cpf`). Cifrar a
  coluna com AES (aleatório) quebra a unicidade e a busca. Manter as duas
  coisas exigiria um hash determinístico separado, ou seja, uma migration e
  mudanças no cadastro e no login.
- A chave teria de ficar no próprio backend, que já tem acesso ao banco. Isso
  protege pouco contra o cenário de quem compromete o servidor.
- A cifragem dos volumes (pelo provedor) e dos backups (implementada aqui)
  cobre o risco de cópia do disco ou do arquivo de backup.
- Os dados pessoais já contam com controle de acesso por perfil, omissão na
  exibição pública (RNF-SEC-06) e anonimização (RNF-SEC-08).

Recomendação: reavaliar se o sistema passar a guardar dados sensíveis
(RNF-SEC-10).

### Como verificar

1. **CI:** no workflow **Backup do banco**, job **Teste de backup e restore**,
   o passo **Conferir cifragem AES-256** deve passar.
2. **Manual**, com um arquivo de backup:

   ```bash
   head -c 5 backups/fiscalize-*.dump.gpg | xxd   # não pode começar com "PGDMP"
   docker run --rm -e HOME=/tmp -v "$PWD/backups:/b:ro" postgres:16 \
     gpg --batch --list-packets /b/<arquivo>.dump.gpg
   # Esperado: ":symkey enc packet: version 4, cipher 9, ..." (9 = AES-256)
   ```

3. Teste negativo: o restore com a passphrase errada falha com
   `decryption failed: Bad session key`. Isso também roda no CI.

### Pendências

| TODO | Responsável sugerido |
|---|---|
| Confirmar o provedor do banco de produção e anexar a evidência de criptografia dos volumes em repouso (algoritmo e quem gerencia a chave) | Quem administra a conta de produção (Railway) |
| Definir quem guarda a `BACKUP_PASSPHRASE` fora do GitHub e onde (cofre do grupo, com pelo menos duas pessoas com acesso) | Grupo, com registro no documento de Backup |
| Definir a rotação da passphrase. Backups antigos continuam exigindo a passphrase antiga até expirarem (30 dias) | Grupo |

---

## RNF-SEC-13 — Proteção contra SQL injection e validação de entradas

> O backend deve utilizar um ORM ou query builder com consultas parametrizadas
> em todas as interações com o PostgreSQL. Todas as entradas enviadas pelo app
> (textos, imagens e coordenadas) devem ser sanitizadas e validadas
> estritamente por esquemas no servidor (ex.: Zod ou Joi).

### O que já existia

- **SQL injection: atendido.**
  - O banco principal é acessado só pelo Prisma, que usa consultas
    parametrizadas.
  - As únicas consultas SQL escritas à mão nesse banco são
    ``prisma.$queryRaw`SELECT 1` `` (`backend/src/config/prisma.ts` e
    `backend/src/config/health.ts`). Elas usam template tagged, que também é
    parametrizado.
  - Não há `$queryRawUnsafe` nem `$executeRawUnsafe`. Para conferir,
    `grep -rnE "queryRawUnsafe|executeRawUnsafe" backend/src` não retorna nada.
  - **Exceção ao Prisma:** o `backend/src/services/etlDashboardService.ts`
    consulta o banco do ETL (Neon) com `pg.Pool`. As duas consultas são SQL
    fixo (`SELECT … FROM chamados_populacao` e `… chamados_clima_diario`), sem
    nenhum valor vindo da requisição. Não há vetor de injection. Se um dia
    receberem filtros, devem usar parâmetros (`$1`, `$2`).
- **Validação:** feita manualmente nos controllers (campos obrigatórios,
  formato de e-mail, política de senha, idade, coordenadas, status). O pacote
  `zod` estava nas dependências do backend, mas não era usado.
- Um texto maior que a coluna gerava o erro `P2000` do Prisma, que virava
  HTTP 500.
- Não há upload de imagem: a foto da denúncia fica só no aparelho.

### O que foi implementado

**Abordagem: validação aditiva.** Os schemas Zod rodam antes do controller e
rejeitam só o que a validação manual não tratava e virava erro 500 ou dado
corrompido:

- tipo errado: objeto, array ou booleano onde se espera texto ou número;
- texto maior que a coluna do banco.

Campos ausentes ou vazios passam para o controller, que continua respondendo
com as mesmas mensagens. O `validate()` **não altera `req.body`**, então
requisições válidas seguem exatamente o mesmo caminho de antes.

| Arquivo | Função |
|---|---|
| `backend/src/middlewares/validate.ts` (novo) | `validate(schema)`: em caso de falha, responde 400 no formato atual (`{ error, statusCode, timestamp }`) com a mensagem do primeiro problema. Corpo ausente ou em array é tratado como objeto vazio e segue para o controller |
| `backend/src/validators/fields.ts` (novo) | Blocos reutilizáveis: `text(campo, max)`, `freeText(campo)` (só tipo, sem limite), `stringOnly`, `integerId` e `coordinate` |
| `backend/src/validators/authSchemas.ts` (novo) | `registerSchema`, `loginSchema`, `refreshTokenSchema`, `updateMeSchema`, `changePasswordSchema` |
| `backend/src/validators/demandSchemas.ts` (novo) | `demandSchema` (criar e editar) e `demandStatusSchema` |
| `backend/src/routes/authRoutes.ts` e `demandRoutes.ts` | `validate()` depois do rate limiter, do `authenticate` e do `requireRole`. Sem token, a resposta continua 401. O logout ficou sem `validate()` (ver abaixo) |
| `backend/src/middlewares/errorMiddleware.ts` | `P2000` → 400 "Valor maior que o tamanho permitido para o campo." Cobre combinações que o Zod não vê, como o endereço composto da denúncia (`chamado.endereco`, 255 caracteres) |
| `backend/src/validators/schemas.test.ts` (novo) | Testes com os payloads reais do app (`mobile/src/services/`), campos vazios, números em campos de texto, tamanho, tipo e o middleware |

Rotas cobertas, todas usadas pelo app:

| Rota | Tela do app |
|---|---|
| `POST /auth/register` | Cadastro |
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Renovação automática de sessão (`api-client.ts`) |
| `PUT /auth/me` | Editar perfil |
| `PATCH /auth/me/password` | Trocar senha |
| `POST /demands` e `PUT /demands/:id` | Nova denúncia e editar denúncia |
| `PATCH /demands/:id/status` | Gestor atualiza o status |

Limites aplicados, iguais ao tamanho das colunas em `prisma/schema.prisma`:

| Campos | Limite |
|---|---|
| `nome` | 150 |
| `email` (cadastro e perfil) | 100 |
| `cpf` | 30 |
| `rua` | 150 |
| `numero` | 20 |
| `bairro` | 100 |
| `cidade` | 100 |
| `estado` | 2 |
| `cep` | 9 |
| `complemento` | 150 |
| `deviceName` | 120 |
| `title` (coluna `subcategoria`) | 100 |
| `location` | 255 |
| `status_id` | 30 |
| `description` | Sem limite: a coluna `descricao` é `text`. Só o tipo é checado |

Decisões para não mudar o comportamento atual:

- **Login:** sem limite de tamanho em `email` e `senha`, só a checagem de
  tipo. Nenhuma conta existente passa a ter outra resposta de login.
- **Números em campos de texto** (por exemplo, `numero: 123`) continuam
  aceitos, porque os controllers já convertem com `String()`.
- **`category_id`:** aceita qualquer inteiro, em número ou texto. `0` e
  negativos continuam chegando ao controller e ao service, com as mensagens
  atuais.
- **Mensagens reaproveitadas** quando o sentido é o mesmo:
  - coordenada inválida usa "Coordenadas inválidas. Use a localização obtida
    pelo CEP ou pelo GPS.";
  - status inválido usa "Status inválido.";
  - refresh token inválido usa "Refresh token obrigatório.";
  - na troca de senha, campos inválidos usam "Informe a senha atual, a nova
    senha e a confirmação.".
- **Mensagens novas**, só para casos que antes davam 500 ou passavam
  indevidamente:
  - "`<campo>` deve ser texto com até N caracteres.";
  - "email e senha devem ser texto.";
  - "Senha deve ser texto.";
  - "description deve ser texto.";
  - "category_id deve ser um número inteiro."

**Antes e depois**, com as mesmas requisições contra o código do `main` e o
desta branch:

| Requisição | Antes (`main`) | Depois |
|---|---|---|
| `POST /demands`, payload do app | 201 | 201 |
| `POST /demands` sem `title` | 400 "Campos obrigatórios: title, description, category_id" | igual |
| `POST /demands` com `title` de 101 caracteres | **500** "Erro ao processar dados." | 400 "title deve ser texto com até 100 caracteres." |
| `POST /demands` com `category_id: "abc"` | **500** "Erro interno do servidor." | 400 "category_id deve ser um número inteiro." |
| `POST /demands` com `latitude: true` | **201** (salvava a coordenada 1) | 400 "Coordenadas inválidas. …" |
| `POST /demands` com endereço composto maior que 255 caracteres | **500** | 400 "Valor maior que o tamanho permitido para o campo." (P2000) |
| `POST /auth/login` com `email` como objeto | **500** | 400 "email e senha devem ser texto." |
| `POST /auth/login` sem campos | 400 "Campos obrigatórios: email, senha" | igual |
| `POST /auth/register` com corpo em array | 400 "Campos obrigatórios: …" | igual |

**Mudanças de status HTTP aceitas (casos de borda).** Payloads que o app não
envia, porque os campos têm tipo fixo nos services do app, mas que mudaram de
resposta. Medido com as mesmas requisições contra o `main` e esta branch:

| Requisição | Antes (`main`) | Depois | Por que a mudança é aceita |
|---|---|---|---|
| `POST /demands` com `category_id: "1.0"` | 201 | 400 "category_id deve ser um número inteiro." | O app envia o id como número inteiro. `"1.0"` só era aceito por acaso, via `Number()` |
| `POST /demands` com `category_id: 1.5` | 201 | 400 (mesma mensagem) | Id fracionário não é válido |
| `POST /demands` com `category_id: true` | 201 | 400 (mesma mensagem) | `Number(true)` virava a categoria 1 |
| `POST /demands` com `numero: true` | 201 | 400 "numero deve ser texto com até 20 caracteres." | Gravava o texto `"true"` |
| `PUT /auth/me` com `numero: true` | 200 | 400 (mesma mensagem) | Idem |
| `POST /auth/register` com `senha` numérica | 400 (política de senha) | 400 "Senha deve ser texto." | Continua 400; só a mensagem muda |
| `POST /auth/login` com `senha` numérica | **500** | 400 "email e senha devem ser texto." | Era erro não tratado |
| `POST /auth/login` com `email` numérico | **500** | 400 (mesma mensagem) | Era erro não tratado |
| `PATCH /auth/me/password` com `senhaAtual` numérica e sem MFA | 401 "Verificação adicional obrigatória ou expirada." | 400 "Informe a senha atual, a nova senha e a confirmação." | O Zod roda antes da checagem de MFA do controller. A senha não é trocada em nenhum dos casos |
| `POST /demands` com `title: 123` | 201 | 201 | Sem mudança: número em campo de texto continua aceito |
| `POST /demands` com `latitude: "abc"` | 400 | 400 | Sem mudança |
| `PATCH /demands/:id/status` com `status_id: 5` | 400 "Status inválido." | 400 | Sem mudança |

### O que não foi implementado e por quê

- **Validação de imagens:** não há upload. A foto da denúncia fica só no
  aparelho e não é enviada ao backend. Quando houver upload, validar tipo MIME
  real (assinatura do arquivo, não a extensão), tamanho máximo e dimensões, e
  remover metadados EXIF, que podem conter a localização do usuário.
- **Rotas de admin e gestor** (`/admin/*`, `/gestor/*`, `/categories`,
  `/metrics`): não são chamadas pelo app do cidadão e ficaram fora do escopo.
  **Recomendação:** aplicar o mesmo `validate()` nelas, começando pelas que
  gravam dados (órgãos, regras de roteamento, categorias).
- **Rotas de auth já validadas por tipo no controller** (`/auth/2fa/verify`,
  `/auth/2fa/request-critical`, `DELETE /auth/me`, `/auth/me/anonymization`,
  `/auth/me/export`): já checam tipo e valores permitidos e não gravam texto
  livre. Ficaram sem schema para não duplicar regras.
- **`POST /auth/logout`:** sem `validate()`. O logout precisa funcionar sempre,
  mesmo com um corpo inesperado. O `refreshToken` é opcional, e o controller só
  revoga o token quando ele é enviado.
- **Sanitização por transformação** (trim, remoção de HTML): o `validate()`
  não altera os dados, de propósito, para não mudar o comportamento atual. O
  risco de injeção de HTML não se aplica ao app nativo, que renderiza texto
  puro, e as consultas já são parametrizadas. Se surgir uma interface web que
  exiba esses textos, ela deve escapar o conteúdo na saída.
- **Remover campos desconhecidos do corpo** (`strict`): os schemas usam
  `looseObject`. Os controllers já pegam só os campos que conhecem e repassam
  valores explícitos aos services, então não há risco de atribuição em massa.

### Débito técnico

**Duplicação entre o Zod e a validação manual dos controllers.** A
obrigatoriedade dos campos, o formato do e-mail, a política de senha, a faixa
das coordenadas e outras regras continuam nos controllers, e o Zod cuida de
tipo e tamanho. A mesma entrada é validada em dois lugares, com dois estilos.
Isso foi deliberado, para manter as mensagens atuais e não refatorar os
controllers agora.

Consequência conhecida: numa requisição com dois problemas ao mesmo tempo (por
exemplo, `estado: "PER"` e `numero` ausente), a mensagem do Zod aparece
primeiro. Antes aparecia a do controller. O app não gera esse caso, porque
limita `estado` a 2 caracteres.

**Caminho para quitar:** mover gradualmente as regras dos controllers para os
schemas, usando mensagens personalizadas por campo, e remover as checagens
manuais rota a rota, com a suíte de API como rede de segurança.

### Como verificar

1. **Testes unitários:** `cd backend && npm test`. O arquivo
   `src/validators/schemas.test.ts` deve passar.
2. **Suíte de API** com a API em `NODE_ENV=test`, como no CI: 74 testes
   passaram e 2 foram pulados, o mesmo resultado de antes das mudanças.
3. **Manual:** repetir as requisições da tabela "Antes e depois".

### Pendências

| TODO | Responsável sugerido |
|---|---|
| Testar manualmente no app (Expo) os fluxos das rotas cobertas | Samuel Araújo |
| Adicionar `maxLength` (100) no título da denúncia no app, para o usuário ver o limite antes de enviar | Mobile |
| Aplicar `validate()` nas rotas de admin e gestor | Backend |
| Reduzir a duplicação entre o Zod e os controllers (ver Débito técnico) | Backend |
| Definir a validação de imagens quando houver upload | Grupo |

---

## RNF-SEC-14 — Lacuna na numeração

A numeração dos requisitos pula da RNF-SEC-13 para a RNF-SEC-15, tanto na v1
quanto na v2 (`docs/RNF-SEC/Requisitos de Segurança - v2.md`). Não há conteúdo
a implementar.

**TODO (autores do documento de requisitos):** decidir entre renumerar os
requisitos ou registrar a RNF-SEC-14 como removida ou reservada, para que
auditorias futuras não a tratem como esquecida.

---

## RNF-SEC-15 — Política de backup e meta de disponibilidade (SLA)

> O sistema deve garantir uma taxa de disponibilidade de no mínimo 99,5% ao
> mês (SLA). O banco de dados PostgreSQL deve possuir rotinas automatizadas de
> backups diários com retenção de 30 dias e armazenamento secundário
> geograficamente distinto (offsite), assegurando recuperação rápida (disaster
> recovery) sem perda de dados históricos.

### O que já existia

- `GET /health` (`backend/src/config/health.ts`): testa o banco
  (`SELECT 1`) e o Redis. Responde 200 (`ok`) ou 503 (`degraded`).
- `backend/railway.toml`: `restartPolicyType = "on_failure"`, com até 3
  tentativas de reinício.
- O CI (`.github/workflows/regressao.yml`) já sobe um `postgres:16` temporário.
- Nenhuma rotina de backup, de restore ou de verificação.

### O que foi implementado

| Arquivo | Função |
|---|---|
| `ops/backup/backup.sh` | Backup lógico cifrado (ver RNF-SEC-05). Gera `fiscalize-<AAAAMMDDTHHMMSSZ>.dump.gpg` e `.sha256` |
| `ops/backup/restore.sh` | Restore com quatro proteções: confere o SHA-256, exige `RESTORE_CONFIRM` igual ao nome do banco de destino, só aceita banco vazio e roda em transação única |
| `ops/backup/verify.sh` | Compara tabelas e contagem de linhas entre a origem e o restaurado. Modo `exact` (CI) ou `schema` (produção: mesmas tabelas e mesmas migrations) |
| `ops/backup/docker-run.sh` | Roda os scripts na imagem oficial `postgres:<PG_VERSION>`, que traz `pg_dump`, `pg_restore`, `psql` e `gpg` na versão certa |
| `ops/backup/common.sh` (`use_pg_url`) | A senha do banco nunca vai na linha de comando (visível em `ps`): os clientes recebem a URL sem senha, e a senha vai em `PGPASSWORD`, decodificada do percent-encoding da URL |
| `.github/workflows/backup.yml` | Job **teste**: backup, conferência do AES-256, restore com passphrase errada (deve falhar), restore e verificação contra um Postgres temporário. Jobs **verificar-producao** e **producao**: backup diário às 06:47 UTC, teste de restore do arquivo do dia e artefato com retenção de 30 dias |
| `docs/RNF-SEC/RUNBOOK-RESTAURACAO-BACKUP.md` | Procedimento de restauração, para incidentes e para o documento de Backup |
| `.gitignore` | Impede versionar `backups/` e arquivos de dump |

**Modo produção preparado, mas inativo.** O job `producao` só roda se os
secrets `BACKUP_DATABASE_URL` e `BACKUP_PASSPHRASE` estiverem cadastrados. Sem
eles, o job `verificar-producao` registra um aviso e o backup é pulado, sem
falhar o workflow. Para ativar:

1. cadastrar os dois secrets em *Settings > Secrets and variables > Actions*;
2. se o Postgres de produção não for a versão 16, criar a variável
   `BACKUP_PG_VERSION` com a versão de produção;
3. executar manualmente (*Run workflow*, com **producao** marcado) e conferir o
   resumo.

**Versão do pg_dump.** O `pg_dump` precisa ter versão igual ou maior que a do
servidor; com versão menor, ele recusa a conexão (`server version mismatch`).
A versão é configurável pela variável `BACKUP_PG_VERSION`, que define o
cliente e os Postgres temporários dos dois jobs (teste e produção). O padrão é
16.

**Destino provisório: artefato do GitHub Actions.** Escolhido porque não exige
nenhuma conta nova e o job só roda depois que os secrets forem cadastrados.
Riscos e limites:

- **O repositório é público.** Artefatos de repositório público podem ser
  baixados por qualquer usuário autenticado no GitHub. Por isso só sobe o
  arquivo cifrado. A proteção do conteúdo depende inteiramente da força e do
  sigilo da `BACKUP_PASSPHRASE`.
- O teste de restore do job `producao` decifra os dados num Postgres
  temporário do runner do GitHub, destruído ao fim do job. O resumo da
  execução mostra só nomes de tabelas e contagens, sem dados pessoais.
- **A escolha final depende de a produção ter ou não dados reais.**
  - Se só houver dados de teste ou de demonstração, o artefato cifrado é
    aceitável.
  - Se houver dados reais de cidadãos, recomenda-se um destino privado, como
    um bucket com acesso restrito, ou mover o workflow para um repositório
    privado.
- Não há garantia documentada aqui de que o armazenamento de artefatos do
  GitHub seja geograficamente distinto do banco de produção. O requisito de
  "offsite geograficamente distinto" **não** está comprovado.
- A retenção efetiva também depende do limite configurado no repositório
  (*Settings > Actions > General > Artifact and log retention*).
- O GitHub desativa workflows agendados de repositórios públicos após 60 dias
  sem atividade no repositório. Depois do fim da disciplina, o backup diário
  pode parar sem aviso.

### Testes realizados

No ambiente local, contra o Postgres do Docker, com 22 tabelas, seed aplicado e
pg_dump 16.15:

- backup gerado com `cipher 9` (AES-256), sem o cabeçalho `PGDMP`;
- restore e verificação `exact` com todas as 22 tabelas iguais;
- **cenários de falha:**
  - passphrase curta;
  - passphrase errada;
  - `RESTORE_CONFIRM` diferente do banco;
  - banco de destino não vazio;
  - SHA-256 adulterado;
  - contagem diferente (`exact`);
  - migration faltando (`schema`).

  Todos falharam com a mensagem esperada.
- Senha via `PGPASSWORD`: ciclo completo com um usuário de teste cuja senha
  tem caracteres especiais (`@`, `:`, `/`, `%`), escrita com percent-encoding
  na URL, conectando com autenticação `scram-sha-256`. A senha errada falhou
  com `password authentication failed` e não deixou arquivo parcial. (Conexões
  por `localhost` dentro do container da imagem oficial usam `trust` e não
  servem para esse teste.)
- Lint: `actionlint` 1.7.7 e `shellcheck` 0.10.0 sem avisos.
- No GitHub, o job **Teste de backup e restore** passou no push da branch.

### O que não foi implementado e por quê

**1. SLA de 99,5%.** Disponibilidade não se implementa no código: é uma meta
operacional que depende do provedor de hospedagem, do plano contratado e de
monitoramento. O que o time pode fazer é **medir**:

| Mês | Indisponibilidade máxima permitida (99,5%) |
|---|---|
| 30 dias | 3,6 h = **3 h 36 min** |
| 31 dias | 3,72 h = 3 h 43 min 12 s |

Como medir:

- **Indicador:** percentual de verificações bem-sucedidas no mês.
- **Recomendação:** um monitor externo de disponibilidade que consulte
  `GET /health` a cada 1 a 5 minutos e considere falha qualquer resposta
  diferente de 200 ou um tempo limite estourado. O `/health` já responde 503
  quando o banco cai.
- O monitor precisa rodar **fora** da Railway, para detectar a queda da
  própria Railway.
- A ferramenta (serviço gratuito de uptime ou um workflow agendado) fica a
  critério do grupo.
- Observação: o `/health` passa pelo `generalRateLimiter`. Um intervalo de
  1 minuto fica muito abaixo do limite de 100 requisições por minuto por IP.

**2. "Sem perda de dados históricos".** Com backup diário, essa frase não pode
ser cumprida: uma falha às 23h perde as escritas desde o último backup. Perda
zero exige PITR (arquivamento contínuo de WAL), que é um recurso do provedor e
não do código. **Proposta de redação** para a RNF-SEC-15:

> O banco de dados PostgreSQL deve possuir backups automatizados diários,
> cifrados com AES-256, com retenção de 30 dias e cópia em armazenamento
> secundário geograficamente distinto (offsite). A recuperação deve garantir
> RPO (perda máxima de dados) de 24 horas e RTO (tempo máximo de recuperação)
> de **[a definir após o primeiro exercício de restauração]**. O processo de
> restauração deve ser testado automaticamente a cada backup e manualmente ao
> menos uma vez por mês. O sistema deve ter disponibilidade mensal mínima de
> 99,5%, medida por monitoramento externo do endpoint `/health`.

**3. PITR e backup nativo do provedor.** Não configurados, porque dependem do
provedor e do plano (pendência abaixo). Se o provedor oferecer backup nativo,
ele complementa o backup lógico. Não o substitui, porque o backup lógico é o que
permite trocar de provedor e guardar a cópia em outro lugar.

**4. Banco do ETL (Neon).** Fora do escopo: contém dados derivados (população
e clima), que podem ser regenerados rodando o ETL novamente. Ver a pendência.

### Como verificar

1. Em qualquer PR que altere `ops/backup/`, o workflow ou o submódulo do
   backend, o job **Teste de backup e restore** deve passar. O resumo da
   execução mostra a tabela de contagens.
2. Execução manual: *Actions > Backup do banco > Run workflow*.
3. Localmente, com o banco em container (ver o runbook, seção 5):

   ```bash
   export DATABASE_URL=... SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=...
   export BACKUP_PASSPHRASE="$(openssl rand -base64 32)" RESTORE_CONFIRM=<banco_vazio>
   export DOCKER_NETWORK=container:fiscalize-db
   out=$(ops/backup/docker-run.sh backup.sh)
   ops/backup/docker-run.sh restore.sh "backups/$(basename "$out")"
   ops/backup/docker-run.sh verify.sh
   ```

4. Depois de ativado: conferir diariamente se o job **Backup de produção**
   passou. Uma falha também significa que o teste de restore do dia falhou.

### Pendências

| TODO | Responsável sugerido |
|---|---|
| Confirmar o provedor do banco de produção (Railway ou Neon), o plano e a versão do Postgres | Quem administra a conta de produção |
| Verificar se o provedor tem backup nativo ou PITR no plano atual, a retenção e a região; registrar no documento de Backup | Quem administra a conta de produção |
| Definir se a produção tem dados reais de cidadãos e, a partir disso, o destino offsite definitivo (artefato cifrado ou destino privado) | Grupo, com o responsável pelo documento de Backup |
| Criar um usuário somente leitura para o backup. Sugestão, se o provedor permitir (PG 14+): `CREATE ROLE fiscalize_backup LOGIN PASSWORD '<gerada>'; GRANT pg_read_all_data TO fiscalize_backup;` | Quem administra o banco de produção |
| Cadastrar `BACKUP_DATABASE_URL` (com o usuário somente leitura) e `BACKUP_PASSPHRASE`; criar `BACKUP_PG_VERSION` se a versão não for 16 | Administrador do repositório |
| Guarda da `BACKUP_PASSPHRASE` (ver RNF-SEC-05) | Grupo |
| Medir o RTO no primeiro exercício de restauração e registrá-lo no runbook | Responsável pelo documento de Backup |
| Conferir o limite de retenção de artefatos do repositório (no mínimo 30 dias) | Administrador do repositório |
| Configurar o monitor externo do `/health` e registrar a disponibilidade mensal | Grupo |
| Confirmar se o banco do ETL no Neon precisa de backup | Responsável pelo ETL |
| Aprovar a nova redação da RNF-SEC-15 | Autores do documento de requisitos |

---

## RNF-SEC-16 — Monitoramento e auditoria de logs de segurança

> O servidor deve registrar centralizadamente os logs de auditoria para eventos
> críticos (ex.: múltiplas tentativas malsucedidas de login, alterações de
> permissão e falhas de requisição). É estritamente proibido gravar dados
> pessoais (PII), senhas ou tokens completos em texto puro nesses arquivos de
> log.

### O que já existia

- **Alterações de permissão: atendido.** A tabela `audit_logs`
  (`backend/src/services/auditLogService.ts`) registra as ações de admin:
  mudança de perfil, ativação e desativação de usuário, órgãos e regras de
  roteamento. A consulta é restrita a admins.
- **Bloqueio de conta:** já implementado pela RNF-SEC-02 (5 tentativas,
  bloqueio de 15 minutos, campos `tentativas_login_falhas` e `bloqueado_ate`),
  mas sem nenhum registro de auditoria.
- **Logs com dados pessoais:**
  - `otpService.ts` registrava o e-mail do usuário junto com o código OTP fora
    de produção;
  - o `errorMiddleware.ts` registrava objetos de erro inteiros (`details`,
    `meta` do Prisma e o erro bruto);
  - as falhas de SMTP registravam a mensagem do servidor de e-mail, que pode
    conter o destinatário.
- O modelo `usuario_audit` existe no schema, mas nunca foi usado.
- Todos os logs eram `console.*` em texto livre.

### O que foi implementado

Todas as mudanças estão no backend. As respostas HTTP, as mensagens, os
contadores e o bloqueio do login e do OTP **não mudaram**.

| Arquivo | Mudança |
|---|---|
| `backend/src/utils/logger.ts` (novo) | Logger estruturado com **pino**: JSON em stdout, coletado pela plataforma de hospedagem. Mascara (`[REDACTED]`) os campos `senha`, `password`, `novaSenha`, `senhaAtual`, `token`, `accessToken`, `refreshToken`, `refresh_token`, `challengeToken`, `authorization`, `cookie`, `email`, `cpf`, `otp` e `codigo`, na raiz e um nível abaixo. Nível configurável por `LOG_LEVEL` |
| `backend/src/utils/logger.ts` | `logSecurityEvent()`: eventos com `category: "security"`, identificados só pelo id interno do usuário (UUID) |
| `backend/src/utils/logger.ts` | `safeErrorInfo()`, usado no log de erros inesperados. Para erros do Prisma (`PrismaClient*`): só nome, código e modelo, sem a mensagem, porque a mensagem do Prisma pode reproduzir os argumentos da consulta. Para os demais erros: nome e mensagem. Nunca inclui propriedades extras (`meta`, `detail`). A pilha só é registrada fora de produção, e, nos erros do Prisma, sem a primeira linha, que repete a mensagem |
| `backend/src/services/authService.ts` (`login` e `verifyOtp`) | Um `logSecurityEvent` antes de cada falha de login e de OTP (tabela abaixo) |
| `backend/src/services/otpService.ts` | O log de desenvolvimento passa a ser `[MFA DEV] OTP (<finalidade>): <código>`, sem o e-mail. O código continua visível em desenvolvimento, sem precisar de nenhuma variável. Em produção (`NODE_ENV=production`) o código nunca é registrado: sem Gmail configurado, a função lança 503 antes do log. As falhas de SMTP registram só `code` e `responseCode` |
| `backend/src/middlewares/errorMiddleware.ts` | Registra só método, rota, status e código Prisma ou modelo. Não registra mais `details`, `meta` nem o objeto de erro inteiro |
| `backend/src/utils/logger.test.ts` (novo) | Teste unitário: e-mail, senha, CPF, tokens e OTP mascarados; `safeErrorInfo` descarta `meta` e `detail`, não registra a mensagem de erros do Prisma e não registra a pilha em produção |

Eventos de segurança registrados:

| Evento | Quando | Campos |
|---|---|---|
| `login_falha` | Senha incorreta | `userId`, `tentativas` |
| `conta_bloqueada` | A 5ª falha bloqueia a conta | `userId`, `tentativas` |
| `login_conta_bloqueada` | Tentativa de login durante o bloqueio | `userId` |
| `login_usuario_inativo` | Login de usuário inativo | `userId` |
| `login_usuario_inexistente` | E-mail não cadastrado | Nenhum (nem o e-mail) |
| `otp_falha` | Código OTP errado (login em aparelho novo ou ação crítica) | `userId`, `tentativas`, `finalidade` |
| `otp_esgotado` | A 5ª tentativa errada invalida o desafio OTP | `userId`, `tentativas`, `finalidade` |

`finalidade` é `LOGIN_NEW_DEVICE` ou `CRITICAL_ACTION`.

Exemplo real, do teste local:

```json
{"level":40,"service":"fiscalize-backend","category":"security","event":"conta_bloqueada","userId":"3302db1a-…","tentativas":5,"msg":"Evento de segurança: conta_bloqueada"}
```

**Por que log e não banco.** O plano inicial era reaproveitar a `usuario_audit`
ou a `audit_logs`, mas as duas têm FK para `usuario` com `ON DELETE NO
ACTION`. A exclusão de conta (RNF-SEC-08, `deleteOrAnonymize`) faz
`prisma.usuario.delete`. Bastaria uma linha de auditoria para que a exclusão
da conta daquele usuário passasse a falhar, quebrando o direito ao
esquecimento. As alternativas exigiam uma migration (FK com `CASCADE`) ou uma
mudança no fluxo de exclusão. A decisão foi registrar os eventos no log
estruturado: sem migration, sem escrita no banco e sem mexer na exclusão. A
`audit_logs` continua sendo usada para as ações de admin.

**Endereço IP.** Não é registrado. O IP é dado pessoal pela LGPD, e o requisito
proíbe dados pessoais nesses logs. A proteção por IP continua sendo feita pelo
rate limiting (RNF-SEC-12).

### O que não foi implementado e por quê

- **Migrar os demais `console.*` do backend** (cerca de 30, em `server.ts`,
  `cron.ts`, `redis.ts`, `demandService.ts` e outros): fora do escopo de
  mudanças pontuais. Eles registram mensagens operacionais sem dados pessoais.
  Recomendação: migrar aos poucos para o `logger`.
- **Ferramenta de centralização dedicada** (por exemplo, um agregador externo
  de logs): os logs vão para stdout em JSON, que a plataforma de hospedagem
  coleta. Contratar uma ferramenta exige decisão de fornecedor (ver o documento
  de Gestão de fornecedores).
- **Alertas automáticos** (por exemplo, vários `conta_bloqueada` em poucos
  minutos): dependem da ferramenta de centralização.
- **Persistir os eventos no banco:** ver "Por que log e não banco" acima.

### Limitações conhecidas

- O mascaramento do pino funciona por **nome de campo**, na raiz e um nível
  abaixo. Um dado pessoal concatenado dentro de uma mensagem de texto não é
  mascarado. Por isso os pontos alterados não colocam dados pessoais na
  mensagem. As mensagens de `AppError`, que vão para o log, foram revisadas:
  só contêm IDs, status e textos fixos.
- Em desenvolvimento e teste, o código OTP aparece no log por decisão
  explícita, para permitir login local sem Gmail.

### Como verificar

1. **Teste unitário:** `cd backend && npm test`. O arquivo
   `src/utils/logger.test.ts` deve passar.
2. **Suíte de API** com a API em `NODE_ENV=test`, como no CI: 74 testes
   passaram e 2 foram pulados, igual a antes das mudanças.
3. **Inspeção do log** após rodar a suíte:

   ```bash
   grep -o '"event":"[a-z_]*"' api.log | sort | uniq -c   # eventos de segurança
   grep -cE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' api.log   # e-mails: 0
   grep -c 'eyJ\|Bearer' api.log                           # tokens: 0
   ```

   Resultado no teste local: `login_falha` 6, `conta_bloqueada` 1,
   `login_conta_bloqueada` 1, `login_usuario_inexistente` 21, `otp_falha` 5,
   `otp_esgotado` 1; nenhum e-mail e nenhum token.
4. **Em produção:** filtrar os logs do serviço na Railway por
   `"category":"security"`.

### Pendências

| TODO | Responsável sugerido |
|---|---|
| Confirmar a retenção dos logs no plano atual da Railway e se ela atende ao período de auditoria desejado | Quem administra a conta da Railway |
| Decidir se os eventos de segurança precisam ficar no banco. Se sim, criar uma migration com tabela própria ou FK `ON DELETE SET NULL`/`CASCADE`, preservando a RNF-SEC-08 | Grupo |
| Definir alertas para picos de `conta_bloqueada`, `otp_esgotado` e `login_usuario_inexistente` (possível ataque de força bruta ou de enumeração) | Grupo |
| Migrar gradualmente os demais `console.*` para o `logger` | Backend |

---

## Fornecedores e terceiros

O levantamento dos fornecedores e terceiros identificados no código está em
[FORNECEDORES-E-TERCEIROS.md](../FORNECEDORES-E-TERCEIROS.md), como insumo
para as RNFs derivadas do documento de Gestão de fornecedores.
