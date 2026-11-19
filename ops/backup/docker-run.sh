#!/usr/bin/env bash
# Created by AI.
# Executa backup.sh, restore.sh ou verify.sh dentro da imagem oficial
# postgres:<PG_VERSION>, que já traz pg_dump, pg_restore, psql e gpg. Assim a
# versão do cliente acompanha a do servidor sem instalar nada na máquina.
#
# Uso:
#   PG_VERSION=16 [DOCKER_NETWORK=host] [BACKUP_DIR=./backups] \
#     docker-run.sh <backup.sh|restore.sh|verify.sh> [arquivo.dump.gpg]
#
#   PG_VERSION      versão da imagem postgres (padrão 16). Deve ser igual ou
#                   maior que a versão do servidor de origem.
#   DOCKER_NETWORK  rede do container (padrão host). Em ambiente local com o
#                   banco em container, use container:<nome-do-container>.
#   BACKUP_DIR      diretório local montado em /backups no container.
#
# As variáveis DATABASE_URL, BACKUP_PASSPHRASE, TARGET_DATABASE_URL,
# SOURCE_DATABASE_URL, RESTORE_CONFIRM e VERIFY_MODE são repassadas ao
# container pelo nome, sem aparecer na linha de comando.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[ "$#" -ge 1 ] || { echo "uso: docker-run.sh <backup.sh|restore.sh|verify.sh> [arquivo]" >&2; exit 1; }
script="$1"
shift

case "$script" in
  backup.sh | restore.sh | verify.sh) ;;
  *) echo "script inválido: $script" >&2; exit 1 ;;
esac

PG_VERSION="${PG_VERSION:-16}"
DOCKER_NETWORK="${DOCKER_NETWORK:-host}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
backup_dir_abs="$(cd "$BACKUP_DIR" && pwd)"

# Created by AI.
# O restore recebe um arquivo do BACKUP_DIR; dentro do container ele está em
# /backups/<nome>.
args=()
if [ "$script" = "restore.sh" ]; then
  [ "$#" -eq 1 ] || { echo "uso: docker-run.sh restore.sh <arquivo.dump.gpg>" >&2; exit 1; }
  file_abs="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  [ "$(dirname "$file_abs")" = "$backup_dir_abs" ] \
    || { echo "o arquivo precisa estar em BACKUP_DIR ($backup_dir_abs)." >&2; exit 1; }
  args=("/backups/$(basename "$1")")
fi

exec docker run --rm \
  --network "$DOCKER_NETWORK" \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e BACKUP_DIR=/backups \
  -e DATABASE_URL \
  -e BACKUP_PASSPHRASE \
  -e TARGET_DATABASE_URL \
  -e SOURCE_DATABASE_URL \
  -e RESTORE_CONFIRM \
  -e VERIFY_MODE \
  -v "$SCRIPT_DIR:/ops/backup:ro" \
  -v "$backup_dir_abs:/backups" \
  -w /backups \
  "postgres:$PG_VERSION" \
  bash "/ops/backup/$script" "${args[@]+"${args[@]}"}"
