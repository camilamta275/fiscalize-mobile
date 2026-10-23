import sys
from pathlib import Path

import pandas as pd
import streamlit as st
from sqlalchemy import create_engine


# Created by AI.
ETL_DIR = Path(__file__).resolve().parents[1] / "etl"
if str(ETL_DIR) not in sys.path:
    sys.path.insert(0, str(ETL_DIR))

from src.config import DATABASE_URL


# Created by AI.
@st.cache_data
def carregar_dados() -> pd.DataFrame:
    engine = create_engine(DATABASE_URL)
    try:
        return pd.read_sql_table("chamados_populacao", engine)
    finally:
        engine.dispose()


# Created by AI.
def main() -> None:
    st.set_page_config(
        page_title="Fiscalize - Chamados por bairro",
        page_icon="📊",
        layout="wide",
    )
    st.title("Dashboard de chamados do Fiscalize")
    st.caption("Dados carregados da tabela chamados_populacao no Neon.")

    try:
        dados = carregar_dados()
    except Exception as error:
        st.error(f"Não foi possível carregar os dados do Neon: {error}")
        st.stop()

    if dados.empty:
        st.warning("A tabela final não possui registros.")
        st.stop()

    bairros = sorted(dados["bairro"].dropna().unique())
    bairro_selecionado = st.selectbox(
        "Filtre por bairro",
        ["Todos"] + bairros,
    )
    if bairro_selecionado == "Todos":
        filtrados = dados
    else:
        filtrados = dados[dados["bairro"] == bairro_selecionado]

    total_chamados = int(filtrados["chamados"].sum())
    total_populacao = filtrados["populacao"].sum(min_count=1)
    media_chamados = filtrados["chamados_por_1000"].mean()

    total_coluna, populacao_coluna, media_coluna = st.columns(3)
    total_coluna.metric("Total de chamados", total_chamados)
    populacao_coluna.metric(
        "População dos bairros",
        "Não informado"
        if pd.isna(total_populacao)
        else f"{int(total_populacao):,}".replace(",", "."),
    )
    media_coluna.metric(
        "Média por 1.000 habitantes",
        "Não informado"
        if pd.isna(media_chamados)
        else f"{media_chamados:.2f}",
    )

    st.subheader("Chamados por bairro")
    grafico = filtrados.set_index("bairro")[["chamados"]]
    st.bar_chart(grafico)

    st.subheader("Dados da tabela final")
    st.dataframe(filtrados, use_container_width=True)


if __name__ == "__main__":
    main()
