<!-- Created by AI. -->

# Runbook — Restauração do banco de dados do Fiscalize

| Item | Valor |
|---|---|
| Requisitos atendidos | RNF-SEC-05 (backup cifrado com AES-256) e RNF-SEC-15 (backup e recuperação) |
| Escopo | Banco principal do backend (`DATABASE_URL`, PostgreSQL acessado pelo Prisma) |
| Fora do escopo | Banco do ETL no Neon (`ETL_DATABASE_URL`). Ver a seção 9 |
| Scripts | [`ops/backup/`](../../ops/backup/) |
| Workflow | [`.github/workflows/backup.yml`](../../.github/workflows/backup.yml) |
| Documento técnico | [IMPLEMENTACAO-RNF-SEC-05-13-14-15-16.md](Planos%20de%20implenta%C3%A7%C3%A3o/IMPLEMENTACAO-RNF-SEC-05-13-14-15-16.md) |

Itens marcados com **TODO** dependem de informações que ainda não temos, como
o provedor do banco de produção. Não preencha esses itens por suposição.

## 1. Quando usar

- Perda ou corrupção de dados no banco de produção (exclusão acidental,
  migration com defeito, incidente de segurança).
- Perda do banco ou do provedor.
- Exercício periódico de restauração (seção 8).

Para recuperar só alguns registros, restaure num banco separado e copie os
dados necessários. **Nunca restaure por cima do banco em uso.** O
`restore.sh` recusa bancos que não estejam vazios.

## 2. Metas de recuperação

| Meta | Valor | Origem |
|---|---|---|
| RPO (perda máxima de dados) | 24 horas | Backup diário às 06:47 UTC (03:47 em Recife) |
| RTO (tempo máximo para voltar) | **TODO** | Medir no primeiro exercício (seção 8) e registrar aqui |
| Retenção | 30 dias | `retention-days: 30` no artefato do workflow |

A redação atual da RNF-SEC-15 pede backups diários e recuperação "sem perda de
dados históricos". Com backup diário, a perda máxima é de até 24 horas de dados.
Recuperação sem nenhuma perda exige PITR (arquivamento contínuo de WAL), que
depende do provedor. Ver a proposta de redação no documento técnico.

## 3. Pré-requisitos

- Docker instalado. Os scripts rodam dentro da imagem oficial `postgres`, que
  já traz `pg_dump`, `pg_restore`, `psql` e `gpg`.
- GitHub CLI (`gh`) autenticado, com acesso ao repositório
  `camilamta275/fiscalize-mobile`.
- A **passphrase** do backup (secret `BACKUP_PASSPHRASE`). O GitHub não
  permite ler um secret depois de cadastrado, então a passphrase precisa estar
  guardada fora do GitHub. **TODO:** definir quem guarda a passphrase e onde
  (por exemplo, o cofre de senhas do grupo), com pelo menos duas pessoas com
  acesso.
- Um **banco novo e vazio** para receber o restore. **TODO:** documentar como
  criar um banco no provedor de produção (Railway ou outro, ainda não
  confirmado).
- A versão do Postgres de produção. Defina `PG_VERSION` com a mesma versão ou
  uma maior. **TODO:** confirmar a versão.

## 4. Obter o backup

Os backups de produção ficam como artefatos do workflow **Backup do banco**,
com o nome `backup-fiscalize-<run_id>`. Cada artefato contém o arquivo
`fiscalize-<AAAAMMDDTHHMMSSZ>.dump.gpg` e o `.sha256` correspondente.

```bash
# Lista as execuções do backup de produção (as agendadas aparecem como "schedule").
gh run list --repo camilamta275/fiscalize-mobile --workflow backup.yml --event schedule --limit 10

# Baixa o artefato da execução escolhida para ./backups
gh run download <run_id> --repo camilamta275/fiscalize-mobile \
  --name backup-fiscalize-<run_id> --dir backups
```

Escolha o backup mais recente **anterior** ao incidente. O nome do arquivo
traz a data e a hora em UTC.

Anote também as contagens de linhas mostradas no resumo (**Summary**) dessa
execução: a coluna "Restaurado" registra o resultado do teste de restore
daquele backup e serve de referência na seção 6.

## 5. Restaurar

```bash
export PG_VERSION=16                      # TODO: versão do Postgres de produção
export BACKUP_DIR=./backups
export BACKUP_PASSPHRASE='<passphrase>'   # nunca grave no histórico do shell
export TARGET_DATABASE_URL='postgresql://<usuario>:<senha>@<host>:<porta>/<banco_novo>?sslmode=require'
export RESTORE_CONFIRM='<banco_novo>'     # nome exato do banco de destino

ops/backup/docker-run.sh restore.sh backups/fiscalize-<data>.dump.gpg
```

Dica: para a passphrase não ficar no histórico, use
`read -rs BACKUP_PASSPHRASE && export BACKUP_PASSPHRASE`.

Os scripts nunca passam a senha do banco na linha de comando: eles a extraem
da URL e a entregam aos clientes do PostgreSQL por `PGPASSWORD`. Também dá para
omitir a senha da URL e exportar `PGPASSWORD` diretamente.

O script, nesta ordem:

1. confere o SHA-256 do arquivo;
2. confere se `RESTORE_CONFIRM` é o nome do banco de destino;
3. confere se o banco de destino está vazio;
4. decifra e restaura numa transação única. Se houver qualquer erro, nada é
   gravado.

Se o banco local estiver num container, use
`DOCKER_NETWORK=container:<nome-do-container>` e `localhost` na URL.

## 6. Verificar

Se o banco original ainda estiver acessível, compare os dois:

```bash
export SOURCE_DATABASE_URL='<url do banco original>'
export VERIFY_MODE=schema   # mesmas tabelas e mesmas migrations
ops/backup/docker-run.sh verify.sh
```

Se o banco original não existir mais, compare as contagens do banco restaurado
com as anotadas na seção 4:

```sql
SELECT relname AS tabela, n_live_tup AS linhas_aprox
FROM pg_stat_user_tables ORDER BY relname;
```

Em todos os casos, confira se a tabela `_prisma_migrations` tem as mesmas
migrations do código em produção (`backend/prisma/migrations`).

## 7. Colocar a aplicação no banco restaurado

1. **TODO:** documentar como pausar o backend no provedor durante a troca,
   para evitar escrita no banco antigo.
2. Atualize a variável `DATABASE_URL` do serviço do backend na Railway com a
   URL do banco restaurado. **TODO:** confirmar o caminho na Railway (projeto,
   serviço e variável) e quem tem acesso.
3. Faça um novo deploy. O `startCommand` em `backend/railway.toml` roda
   `npm run migrate:deploy && npm run seed && npm run start`:
   - `migrate deploy` só aplica as migrations que faltarem;
   - o seed é idempotente: usa `upsert` com `update: {}`, `createMany` com
     `skipDuplicates` e verifica a existência antes de cada `create`. Não
     sobrescreve nem apaga dados restaurados.
4. Teste rápido:
   - `GET /health` deve responder 200, com `"database": "connected"`;
   - fazer login com uma conta de teste;
   - listar denúncias públicas (`GET /demands/public`).
5. Mantenha o banco antigo (sem uso) até concluir a análise do incidente.

## 8. Exercício periódico de restauração

- **Automático:** o job `producao` do workflow restaura todo dia o backup
  recém-gerado num Postgres temporário do CI e compara com a origem. Uma
  falha nesse job significa que o backup do dia não é confiável.
- **Atenção: hoje o job `producao` está inativo.** Ele só roda depois que os
  secrets `BACKUP_DATABASE_URL` e `BACKUP_PASSPHRASE` forem cadastrados no
  repositório. Até lá, **não existe backup automático de produção**: o
  workflow só registra o aviso "Backup de produção desativado". Antes de
  cadastrar os secrets, é preciso **confirmar a versão do Postgres de
  produção** e, se não for 16, criar a variável `BACKUP_PG_VERSION` com essa
  versão. Com um `pg_dump` mais antigo que o servidor, o backup falha
  (`server version mismatch`).
- **Manual (recomendado mensalmente):** executar as seções 4 a 6 num banco
  descartável, cronometrar o tempo total e registrar o resultado e o RTO
  medido na tabela abaixo.

| Data | Responsável | Backup usado | Tempo total | Resultado |
|---|---|---|---|---|
| — | — | — | — | — |

## 9. Fora do escopo: banco do ETL (Neon)

O backend também lê um segundo banco, no Neon (`ETL_DATABASE_URL`), com as
tabelas `chamados_populacao` e `chamados_clima_diario` geradas pelo ETL. Esse
banco não é coberto por este runbook. Ele contém dados derivados, que podem
ser regenerados rodando o ETL novamente. **TODO:** o responsável pelo ETL deve
confirmar se isso basta ou se o banco do ETL também precisa de backup.

## 10. Problemas comuns

| Mensagem | Causa | O que fazer |
|---|---|---|
| `server version mismatch` | `pg_dump` mais antigo que o servidor | Aumentar `PG_VERSION` |
| `decryption failed: Bad session key` | Passphrase errada | Conferir a passphrase do cofre |
| `checksum SHA-256 não confere` | Arquivo corrompido ou incompleto | Baixar de novo ou usar o backup do dia anterior |
| `o banco ... não está vazio` | Destino já tem tabelas | Criar um banco novo |
| `RESTORE_CONFIRM ... não corresponde` | Confirmação diferente do banco de destino | Conferir a URL e o nome do banco |

Depois de terminar, apague as cópias locais do backup:
`rm -rf backups/`.
