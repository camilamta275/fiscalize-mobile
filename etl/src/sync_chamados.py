# Created by AI.
from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import pandas as pd
from sqlalchemy import create_engine, text

from src.config import BACKEND_DATABASE_URL
from src.load import Load
from src.normalize import normalize_bairro

STATUS_DISPLAY = {
    "Aberto": "Aberto",
    "Em_An_lise": "Em Análise",
    "Em_Andamento": "Em Andamento",
    "Aguardando": "Aguardando",
    "Resolvido": "Resolvido",
    "Fechado": "Fechado",
}

# Created by AI.
# Updated by AI.
CHAMADOS_QUERY = """
SELECT
  c.id::text       AS id,
  c.protocolo,
  cat.nome         AS categoria,
  c.subcategoria,
  COALESCE(
    NULLIF(TRIM(c.bairro), ''),
    NULLIF(TRIM(cid.bairro), '')
  )                AS bairro_original,
  c.cep,
  c.rua,
  c.numero,
  c.complemento,
  c.cidade,
  c.estado,
  c.latitude,
  c.longitude,
  c.criadoem,
  c.atualizadoem,
  c.status,
  c.prioridade
FROM chamado c
JOIN categoria cat ON cat.id = c.categoriaid
LEFT JOIN cidadao cid ON cid.id = c.cidadaoid
WHERE c.excluidoem IS NULL
ORDER BY c.criadoem
"""


# Created by AI.
def _is_valid_coordinate(latitude: float | None, longitude: float | None) -> bool:
    if latitude is None or longitude is None:
        return False

    latitude = float(latitude)
    longitude = float(longitude)

    if latitude == 0 and longitude == 0:
        return False

    return -33.75 <= latitude <= 5.28 and -74 <= longitude <= -28.8


# Created by AI.
def _sqlalchemy_url(url: str) -> str:
    """
    Remove parâmetros que o Prisma aceita e o psycopg não reconhece.

    O `DATABASE_URL` do backend costuma terminar em `?schema=public`, mas
    `schema` é uma opção do Prisma; o psycopg falha com
    `invalid connection option "schema"`.
    """
    parts = urlsplit(url)
    if not parts.query:
        return url

    kept = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key.lower() not in {"schema", "connection_limit", "pool_timeout", "pgbouncer"}
    ]
    query = urlencode(kept)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


# Created by AI.
class SyncChamados:
    """
    Copia os chamados analíticos do PostgreSQL do backend para a coleção
    `chamados_raw` do MongoDB. O backend continua sendo a fonte da verdade:
    este job só lê e nunca escreve no banco operacional.
    """

    def __init__(self, backend_database_url: str | None = None):
        self.backend_database_url = backend_database_url or BACKEND_DATABASE_URL

    # Created by AI.
    def read_backend(self) -> pd.DataFrame:
        if not self.backend_database_url:
            raise RuntimeError(
                "A variável BACKEND_DATABASE_URL não foi encontrada em etl/.env. "
                "Copie o valor do DATABASE_URL usado pelo backend."
            )

        engine = create_engine(_sqlalchemy_url(self.backend_database_url), pool_pre_ping=True)
        try:
            with engine.connect() as connection:
                return pd.read_sql(text(CHAMADOS_QUERY), connection)
        finally:
            engine.dispose()

    # Created by AI.
    def to_documents(self, df: pd.DataFrame) -> list[dict]:
        if df.empty:
            return []

        frame = df.copy()

        for column in ("latitude", "longitude"):
            frame[column] = pd.to_numeric(frame[column], errors="coerce")

        frame["coordenada_valida"] = [
            _is_valid_coordinate(latitude, longitude)
            for latitude, longitude in zip(frame["latitude"], frame["longitude"])
        ]
        frame["bairro"] = frame["bairro_original"].map(normalize_bairro)

        frame["criadoem"] = pd.to_datetime(frame["criadoem"], utc=True)
        if "atualizadoem" in frame.columns:
            frame["atualizadoem"] = pd.to_datetime(
                frame["atualizadoem"],
                utc=True,
            )
        frame["data_chamado"] = (
            frame["criadoem"]
            .dt.tz_convert("America/Recife")
            .dt.strftime("%Y-%m-%d")
        )
        frame["criadoem"] = frame["criadoem"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        if "atualizadoem" in frame.columns:
            frame["atualizadoem"] = (
                frame["atualizadoem"]
                .dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            )
        frame["status"] = frame["status"].map(
            lambda value: STATUS_DISPLAY.get(str(value), str(value))
        )

        documents = frame.to_dict(orient="records")
        for document in documents:
            document["_id"] = document["id"]
            for key, value in document.items():
                if isinstance(value, (list, dict)):
                    continue
                if pd.isna(value):
                    document[key] = None

        return documents

    # Created by AI.
    def run(self) -> dict:
        df = self.read_backend()
        documents = self.to_documents(df)
        sem_bairro = sum(1 for document in documents if not document.get("bairro"))
        sem_coordenada = sum(
            1 for document in documents if not document.get("coordenada_valida")
        )

        load = Load()
        try:
            gravados, removidos = load.upsert_mongo(documents, "chamados_raw", "_id")
        finally:
            load.close()

        summary = {
            "lidos": len(df),
            "gravados": gravados,
            "removidos": removidos,
            "sem_bairro": sem_bairro,
            "sem_coordenada": sem_coordenada,
        }

        print(
            "Sync de chamados concluído: "
            f"{summary['lidos']} lido(s), {summary['gravados']} gravado(s), "
            f"{summary['removidos']} removido(s), "
            f"{summary['sem_bairro']} sem bairro, "
            f"{summary['sem_coordenada']} sem coordenada válida."
        )

        return summary


# Created by AI.
def main() -> None:
    SyncChamados().run()


if __name__ == "__main__":
    main()
