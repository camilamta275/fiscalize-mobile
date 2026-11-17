#!/usr/bin/env bash
# Created by AI.
# Restaura um backup cifrado gerado por backup.sh (RNF-SEC-15).
#
# Uso:
#   TARGET_DATABASE_URL=... BACKUP_PASSPHRASE=... RESTORE_CONFIRM=<nome do banco> \
#     restore.sh <arquivo.dump.gpg>
#
# Variáveis de ambiente:
#   TARGET_DATABASE_URL (obrigatória) banco de destino. Aceita a URL do Prisma.
#   BACKUP_PASSPHRASE   (obrigatória) a mesma passphrase usada no backup.
#   RESTORE_CONFIRM     (obrigatória) nome exato do banco de destino, como
#                       confirmação explícita de onde o restore vai acontecer.
#
# Proteções:
#   - confere o .sha256 ao lado do arquivo, se existir;
#   - só restaura em banco VAZIO (sem tabelas). Restaure sempre num banco novo
#     e só depois aponte a aplicação para ele (ver runbook);
#   - roda em transação única: em caso de erro, nada é gravado.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

# Created by AI.
cleanup() {
  [ -n "${GNUPGHOME:-}" ] && rm -rf "$GNUPGHOME"
  return 0
}
trap cleanup EXIT

[ "$#" -eq 1 ] || die "uso: restore.sh <arquivo.dump.gpg>"
backup_file="$1"
[ -f "$backup_file" ] || die "arquivo não encontrado: $backup_file"

require_env TARGET_DATABASE_URL BACKUP_PASSPHRASE RESTORE_CONFIRM
require_cmd gpg pg_restore psql

target_url="$(libpq_url "$TARGET_DATABASE_URL")"

if [ -f "$backup_file.sha256" ]; then
  expected="$(awk '{print $1}' "$backup_file.sha256")"
  actual="$(sha256_of "$backup_file")"
  [ "$expected" = "$actual" ] || die "checksum SHA-256 não confere; o arquivo pode estar corrompido."
  log "Checksum SHA-256 conferido."
else
  log "AVISO: arquivo .sha256 não encontrado; integridade não conferida."
fi

target_db="$(psql "$target_url" -XAtq -c 'SELECT current_database()')"
[ "$RESTORE_CONFIRM" = "$target_db" ] \
  || die "RESTORE_CONFIRM ('$RESTORE_CONFIRM') não corresponde ao banco de destino ('$target_db')."

table_count="$(psql "$target_url" -XAtq -c \
  "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')")"
[ "$table_count" = "0" ] \
  || die "o banco '$target_db' não está vazio ($table_count tabelas). Restaure num banco novo."

use_temp_gnupghome
log "Restaurando $(basename "$backup_file") no banco '$target_db' com $(pg_restore --version)."

gpg "${GPG_BASE_OPTS[@]}" --decrypt "$backup_file" 3< <(printf '%s' "$BACKUP_PASSPHRASE") \
  | pg_restore \
      --dbname="$target_url" \
      --no-owner \
      --no-privileges \
      --single-transaction \
      --exit-on-error

log "Restore concluído no banco '$target_db'."
