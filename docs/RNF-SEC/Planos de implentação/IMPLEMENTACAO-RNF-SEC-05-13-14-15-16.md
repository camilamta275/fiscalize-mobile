<!-- Created by AI. -->

# Implementação — RNF-SEC-05, 13, 14, 15 e 16

## Status

| Requisito | Status | Resumo |
|---|---|---|
| RNF-SEC-05 — Criptografia no banco | **Parcial (backups atendidos)** | Backups cifrados com AES-256. Criptografia dos volumes é responsabilidade do provedor (TODO: evidência) |
| RNF-SEC-13 — SQL injection e validação | **Em andamento (Prioridade 3)** | SQL injection já atendido pelo Prisma. Validação com Zod a implementar |
| RNF-SEC-14 | **Lacuna no documento** | O número não existe na v1 nem na v2 dos requisitos |
| RNF-SEC-15 — Backup e SLA | **Parcial (backup pronto; produção depende de secrets e de decisões)** | Scripts, workflow, teste de restore e runbook prontos |
| RNF-SEC-16 — Logs de segurança | **Em andamento (Prioridade 2)** | — |

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

> Em andamento. Esta seção será completada na Prioridade 3.

### O que já existia

- **SQL injection: atendido.** Todo o acesso ao PostgreSQL passa pelo Prisma,
  que usa consultas parametrizadas. As únicas consultas SQL escritas à mão são
  `prisma.$queryRaw\`SELECT 1\`` (`backend/src/config/prisma.ts` e
  `backend/src/config/health.ts`), em template tagged, que também é
  parametrizado. Não há `$queryRawUnsafe` nem `$executeRawUnsafe`.
  Para conferir:
  `grep -rnE "queryRawUnsafe|executeRawUnsafe" backend/src` não retorna nada.
- **Validação:** feita manualmente nos controllers. O pacote `zod` está nas
  dependências do backend, mas não é usado.
- Um texto maior que a coluna gera o erro `P2000` do Prisma, que hoje vira
  HTTP 500.
- Não há upload de imagem: a foto da denúncia fica só no aparelho.

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
A versão é configurável pela variável `BACKUP_PG_VERSION`, que define tanto o
cliente quanto o Postgres temporário do teste de restore. O padrão é 16.

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
- Lint: `actionlint` 1.7.7 e `shellcheck` 0.10.0 sem avisos.

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

> Em andamento. Esta seção será completada na Prioridade 2.

---

## Fornecedores e terceiros identificados no código

Insumo para o documento de **Gestão de fornecedores**. A lista registra apenas
o que aparece no código e na configuração. Plano, região, contrato e
certificações de cada fornecedor **não** foram verificados (TODO do responsável
pelo documento).

| Fornecedor | Uso no Fiscalize | Onde aparece | Dados que recebe |
|---|---|---|---|
| **Railway** | Hospedagem e deploy do backend | `backend/railway.toml`, `backend/README.md` | Todo o tráfego da API; variáveis de ambiente (segredos) |
| **Provedor do banco principal** (TODO: Railway ou Neon) | PostgreSQL de produção (`DATABASE_URL`) | `backend/src/config/prisma.ts` | Todos os dados pessoais e as denúncias |
| **Neon** | Banco do ETL (`ETL_DATABASE_URL`), lido pelo dashboard | `backend/.env.example`, `backend/src/services/etlDashboardService.ts` | Dados agregados do ETL (população, clima) |
| **Google (Gmail SMTP)** | Envio dos códigos OTP do 2FA | `backend/src/services/otpService.ts` (nodemailer), `GMAIL_USER` | E-mail do usuário e código OTP |
| **Expo** | Notificações push (`exp.host`) e build do app (EAS) | `backend/src/services/notificationService.ts`, `mobile/eas.json` | Token de push do aparelho e texto da notificação |
| **GitHub** | Código (repositórios públicos), CI, GitHub Pages dos relatórios e, provisoriamente, os backups cifrados | `.github/workflows/` | Código; backups cifrados; secrets do Actions |
| **Redis** (TODO: provedor) | Cache de métricas e rate limiting | `backend/src/config/redis.ts`, `REDIS_URL` | Contadores por IP e cache de métricas |

Outros terceiros encontrados durante o levantamento:

| Fornecedor | Uso | Onde aparece |
|---|---|---|
| ViaCEP | Consulta de endereço por CEP no cadastro do app | `mobile/src/services/address-service.ts` |
| Open-Meteo e IBGE | Fontes de dados públicos do ETL | `etl/src/` |
| unpkg (CDN) | Carrega o Swagger UI da página `/docs` | `backend/src/config/swagger.ts` |
| Docker Hub (imagem `postgres`) e registro npm | Dependências de build, CI e backup | Workflows e `package.json` |
