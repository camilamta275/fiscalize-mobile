# Created by AI.
from __future__ import annotations

from datetime import timedelta

import pandas as pd

METADATA_COLUMNS = ["_id", "data_extracao", "synced_at"]


# Created by AI.
def busca_chamados(ext) -> list[dict]:
    """
    Lê os chamados da coleção `chamados_raw` (carga mais recente do sync).
    O JSON `etl/data/chamados.json` não é mais usado em produção.
    """
    df = ext.extract_collection_from_mongo("chamados_raw")

    if df.empty:
        raise ValueError(
            "A coleção chamados_raw está vazia. "
            "Execute `python -m src.sync_chamados` antes do ETL."
        )

    df = df.drop(columns=METADATA_COLUMNS, errors="ignore")
    return df.to_dict(orient="records")


# Created by AI.
def intervalo_chamados(chamados: list[dict]) -> tuple[str, str]:
    """
    Calcula o intervalo de datas coberto pelos chamados, já com um dia de
    margem em cada ponta para evitar buracos na série climática.
    """
    df = pd.DataFrame(chamados)

    if df.empty:
        raise ValueError("Nenhum chamado foi recebido para calcular o intervalo.")

    if "data_chamado" in df.columns:
        series = pd.to_datetime(df["data_chamado"], errors="coerce")
    else:
        series = (
            pd.to_datetime(df["criadoem"], utc=True)
            .dt.tz_convert("America/Recife")
            .dt.tz_localize(None)
        )

    series = series.dropna()
    if series.empty:
        raise ValueError("Os chamados não possuem data válida para o intervalo climático.")

    data_inicio = series.min().date() - timedelta(days=1)
    data_fim = series.max().date() + timedelta(days=1)

    return data_inicio.isoformat(), data_fim.isoformat()


# Created by AI.
def clima_cobre(df_clima: pd.DataFrame, data_inicio: str, data_fim: str) -> bool:
    """Indica se a carga transformada de clima cobre todo o intervalo."""
    if df_clima.empty:
        return False

    datas = pd.to_datetime(df_clima["data"], errors="coerce").dropna()
    if datas.empty:
        return False

    return (
        datas.min().date() <= pd.Timestamp(data_inicio).date()
        and datas.max().date() >= pd.Timestamp(data_fim).date()
    )
