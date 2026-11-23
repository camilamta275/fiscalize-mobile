#!/usr/bin/env bash
# Created by AI.
# Funções compartilhadas pelos scripts de backup do Fiscalize (RNF-SEC-05 e
# RNF-SEC-15). Este arquivo é carregado com `source` pelos demais scripts.
#
# Regra geral: nenhum script imprime URL de conexão, senha ou passphrase.
# Mensagens de progresso vão para stderr; stdout fica reservado para o
# resultado que outro programa pode consumir.

# Created by AI.
# Tamanho mínimo da passphrase de cifragem do backup.
MIN_PASSPHRASE_LENGTH=20

# Created by AI.
log() {
  printf '[backup %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
}

# Created by AI.
die() {
  log "ERRO: $*"
  exit 1
}

# Created by AI.
require_env() {
  local name
  for name in "$@"; do
    [ -n "${!name:-}" ] || die "variável de ambiente $name não definida."
  done
}

# Created by AI.
require_cmd() {
  local cmd
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null 2>&1 || die "comando '$cmd' não encontrado no PATH."
  done
}

# Created by AI.
require_strong_passphrase() {
  if [ "${#BACKUP_PASSPHRASE}" -lt "$MIN_PASSPHRASE_LENGTH" ]; then
    die "BACKUP_PASSPHRASE precisa ter pelo menos $MIN_PASSPHRASE_LENGTH caracteres."
  fi
}

# Created by AI.
# O Prisma usa o parâmetro `?schema=public` na DATABASE_URL, mas o libpq
# (pg_dump, pg_restore, psql) não o aceita. Remove só esse parâmetro e mantém
# os demais (por exemplo, sslmode=require).
libpq_url() {
  printf '%s' "$1" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/[?&]$//'
}

# Created by AI.
# Prepara a conexão sem expor a senha na linha de comando (visível em `ps`):
# define PG_URL com a URL sem senha e exporta a senha em PGPASSWORD, já
# decodificada do percent-encoding da URL (ex.: %40 -> @). Se a URL não tiver
# senha, mantém o PGPASSWORD que já estiver no ambiente.
# Use dentro de um subshell quando houver mais de um banco no mesmo script.
use_pg_url() {
  local url password
  url="$(libpq_url "$1")"
  password="$(printf '%s' "$url" | sed -nE 's#^[a-zA-Z]+://[^:/@]*:([^@]*)@.*#\1#p')"
  if [ -n "$password" ]; then
    PGPASSWORD="$(printf '%b' "${password//%/\\x}")"
    export PGPASSWORD
  fi
  # shellcheck disable=SC2034  # PG_URL é usado por quem chama a função.
  PG_URL="$(printf '%s' "$url" | sed -E 's#^([a-zA-Z]+://[^:/@]*):[^@]*@#\1@#')"
}

# Created by AI.
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

# Created by AI.
# Usa um diretório temporário do GnuPG para não ler nem alterar o chaveiro do
# usuário. A cifragem é simétrica: não há chaves públicas envolvidas.
use_temp_gnupghome() {
  GNUPGHOME="$(mktemp -d)"
  export GNUPGHOME
  chmod 700 "$GNUPGHOME"
}

# Created by AI.
# Opções comuns do gpg. A passphrase é lida do descritor 3, nunca da linha de
# comando (que fica visível em `ps`). Usado por backup.sh e restore.sh.
# shellcheck disable=SC2034
GPG_BASE_OPTS=(--batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3)
