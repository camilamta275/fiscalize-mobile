#!/usr/bin/env bash
# Created by AI.
# Verificação simples de um restore (RNF-SEC-15): compara as tabelas e a
# contagem de linhas de cada tabela entre o banco de origem e o restaurado.
#
# Variáveis de ambiente:
#   SOURCE_DATABASE_URL (obrigatória) banco de origem do backup.
#   TARGET_DATABASE_URL (obrigatória) banco restaurado.
#   VERIFY_MODE         (opcional)
#     exact  (padrão) mesmas tabelas e mesma contagem em todas. Use quando a
#            origem não muda durante o teste (CI).
#     schema mesmas tabelas e mesma contagem em _prisma_migrations (mesma
#            versão de schema). As demais contagens são só informativas, porque
#            a produção continua recebendo escrita depois do backup.
#
# Saída (stdout): tabela em Markdown, pronta para o resumo do GitHub Actions.
# Código de saída: 0 se a verificação passar, 1 caso contrário.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

require_env SOURCE_DATABASE_URL TARGET_DATABASE_URL
require_cmd psql

VERIFY_MODE="${VERIFY_MODE:-exact}"
case "$VERIFY_MODE" in
  exact | schema) ;;
  *) die "VERIFY_MODE inválido: '$VERIFY_MODE' (use exact ou schema)." ;;
esac

# Created by AI.
# Uma linha "schema.tabela|contagem" por tabela, em ordem. O nome da tabela vem
# do catálogo e é citado com format('%I'), sem concatenação de texto livre.
COUNT_SQL="
SELECT format('%s.%s|%s', table_schema, table_name,
  (xpath('/row/c/text()', query_to_xml(
    format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name),
    false, true, '')))[1]::text)
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;"

# Created by AI.
# O subshell isola o PGPASSWORD de cada banco.
table_counts() {
  (
    use_pg_url "$1"
    psql "$PG_URL" -XAtq -v ON_ERROR_STOP=1 -c "$COUNT_SQL"
  )
}

source_counts="$(table_counts "$SOURCE_DATABASE_URL")"
target_counts="$(table_counts "$TARGET_DATABASE_URL")"

[ -n "$source_counts" ] || die "nenhuma tabela encontrada no banco de origem."

log "Comparando bancos (modo $VERIFY_MODE)."

# Junta as duas listas por nome de tabela e decide o status de cada linha.
awk -F'|' -v mode="$VERIFY_MODE" '
  NR == FNR { src[$1] = $2; order[++n] = $1; next }
  { dst[$1] = $2; if (!($1 in src)) order[++n] = $1 }
  END {
    print "| Tabela | Origem | Restaurado | Status |"
    print "| --- | ---: | ---: | --- |"
    failed = 0
    for (i = 1; i <= n; i++) {
      t = order[i]
      s = (t in src) ? src[t] : "-"
      d = (t in dst) ? dst[t] : "-"
      if (!(t in src) || !(t in dst)) {
        status = "FALHA (tabela ausente)"; failed = 1
      } else if (s == d) {
        status = "ok"
      } else if (mode == "exact" || t ~ /\._prisma_migrations$/) {
        status = "FALHA (contagem diferente)"; failed = 1
      } else {
        status = "diferente (informativo)"
      }
      printf "| %s | %s | %s | %s |\n", t, s, d, status
    }
    exit failed
  }
' <(printf '%s\n' "$source_counts") <(printf '%s\n' "$target_counts") \
  && result=0 || result=$?

if [ "$result" -eq 0 ]; then
  log "Verificação OK."
else
  log "Verificação FALHOU."
fi
exit "$result"
