#!/usr/bin/env bash
# Created by AI.
# Gera um backup lógico do PostgreSQL cifrado com AES-256 (RNF-SEC-05/15).
#
# Fluxo: pg_dump (formato custom) -> gpg --symmetric --cipher-algo AES256.
# O dump em texto puro nunca é gravado em disco.
#
# Variáveis de ambiente:
#   DATABASE_URL       (obrigatória) banco de origem. Aceita a URL do Prisma.
#   BACKUP_PASSPHRASE  (obrigatória) passphrase de cifragem (mín. 20 caracteres).
#   BACKUP_DIR         (opcional)    diretório de saída. Padrão: ./backups
#
# Saída:
#   <BACKUP_DIR>/fiscalize-<AAAAMMDDTHHMMSSZ>.dump.gpg
#   <BACKUP_DIR>/fiscalize-<AAAAMMDDTHHMMSSZ>.dump.gpg.sha256
#   stdout: caminho do arquivo .dump.gpg gerado.
#
# Requisito: a versão do pg_dump deve ser igual ou maior que a do servidor.
# O pg_dump recusa servidores mais novos ("server version mismatch").
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

# Created by AI.
cleanup() {
  [ -n "${PARTIAL_FILE:-}" ] && rm -f "$PARTIAL_FILE"
  [ -n "${GNUPGHOME:-}" ] && rm -rf "$GNUPGHOME"
  return 0
}
trap cleanup EXIT

require_env DATABASE_URL BACKUP_PASSPHRASE
require_cmd pg_dump gpg
require_strong_passphrase

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/fiscalize-$stamp.dump.gpg"
PARTIAL_FILE="$output.partial"

use_temp_gnupghome
use_pg_url "$DATABASE_URL"
log "Iniciando backup com $(pg_dump --version)."

# Com pipefail, uma falha do pg_dump derruba o pipeline e o arquivo parcial é
# removido pelo trap. O arquivo final só aparece se tudo der certo.
pg_dump --format=custom --no-password --dbname="$PG_URL" \
  | gpg "${GPG_BASE_OPTS[@]}" \
      --symmetric \
      --cipher-algo AES256 \
      --s2k-digest-algo SHA512 \
      --compress-algo none \
      --output "$PARTIAL_FILE" \
      3< <(printf '%s' "$BACKUP_PASSPHRASE")

mv "$PARTIAL_FILE" "$output"
PARTIAL_FILE=""

checksum="$(sha256_of "$output")"
printf '%s  %s\n' "$checksum" "$(basename "$output")" > "$output.sha256"

size="$(wc -c < "$output" | tr -d ' ')"
log "Backup cifrado gerado: $(basename "$output") ($size bytes, sha256 $checksum)."
printf '%s\n' "$output"
