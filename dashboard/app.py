import sys
from pathlib import Path

import altair as alt
import pandas as pd
import streamlit as st
from sqlalchemy import create_engine


# Created by AI.
ETL_DIR = Path(__file__).resolve().parents[1] / "etl"
if str(ETL_DIR) not in sys.path:
    sys.path.insert(0, str(ETL_DIR))

from src.config import DATABASE_URL


# Updated by AI.
@st.cache_data
def carregar_populacao() -> pd.DataFrame:
    engine = create_engine(DATABASE_URL)
    try:
        return pd.read_sql_table("chamados_populacao", engine)
    finally:
        engine.dispose()


# Created by AI.
@st.cache_data
def carregar_clima_diario() -> pd.DataFrame:
    engine = create_engine(DATABASE_URL)
    try:
        return pd.read_sql_table("chamados_clima_diario", engine)
    finally:
        engine.dispose()


# Created by AI.
def grafico_chamados_clima(
    dados: pd.DataFrame,
    coluna_clima: str,
    rotulo_clima: str,
    cor: str,
) -> alt.LayerChart:
    """Barras de chamados + linha do indicador climático em eixo próprio."""
    base = alt.Chart(dados).encode(
        x=alt.X("data:T", title="Data"),
    )

    barras = base.mark_bar(opacity=0.55, color="#4C78A8").encode(
        y=alt.Y("chamados:Q", title="Chamados"),
        tooltip=[
            alt.Tooltip("data:T", title="Data", format="%d/%m/%Y"),
            alt.Tooltip("chamados:Q", title="Chamados"),
            alt.Tooltip(f"{coluna_clima}:Q", title=rotulo_clima),
        ],
    )

    linha = base.mark_line(point=True, color=cor).encode(
        y=alt.Y(
            f"{coluna_clima}:Q",
            title=rotulo_clima,
            axis=alt.Axis(orient="right", titleColor=cor, labelColor=cor),
        ),
    )

    return (
        alt.layer(barras, linha)
        .resolve_scale(y="independent")
        .properties(height=320)
    )


# Updated by AI.
def main() -> None:
    st.set_page_config(
        page_title="Fiscalize - Chamados e clima",
        page_icon="📊",
        layout="wide",
    )
    st.title("Dashboard de chamados do Fiscalize")
    st.caption(
        "Camada gold no Neon: chamados por bairro e chamados x clima diário."
    )

    try:
        dados = carregar_populacao()
    except Exception as error:
        st.error(f"Não foi possível carregar chamados_populacao do Neon: {error}")
        st.stop()

    if dados.empty:
        st.warning("A tabela chamados_populacao não possui registros.")
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

    st.subheader("Clima x chamados por dia")
    st.caption(
        "Usa a série diária da Open-Meteo (temperatura média e precipitação) "
        "cruzada com a data local dos chamados. O filtro de bairro não se aplica "
        "ao clima, que é da cidade do Recife."
    )

    try:
        clima = carregar_clima_diario()
    except Exception as error:
        st.warning(
            "Não foi possível carregar chamados_clima_diario do Neon: "
            f"{error}"
        )
        clima = pd.DataFrame()

    if clima.empty:
        st.info(
            "A tabela chamados_clima_diario ainda não possui registros. "
            "Execute o ETL para gerar a camada gold."
        )
    else:
        clima["data"] = pd.to_datetime(clima["data"], errors="coerce")
        clima = clima.dropna(subset=["data"]).sort_values("data")

        total_chamados_clima = clima["chamados"].sum()
        media_temperatura = clima["temperatura"].mean()
        total_precipitacao = clima["precipitacao"].sum(min_count=1)

        clima_coluna, chuva_coluna, temperatura_coluna = st.columns(3)
        clima_coluna.metric(
            "Chamados no período",
            int(total_chamados_clima),
        )
        chuva_coluna.metric(
            "Precipitação acumulada",
            "Não informado"
            if pd.isna(total_precipitacao)
            else f"{total_precipitacao:.1f} mm",
        )
        temperatura_coluna.metric(
            "Temperatura média",
            "Não informado"
            if pd.isna(media_temperatura)
            else f"{media_temperatura:.1f} °C",
        )

        esquerda, direita = st.columns(2)

        with esquerda:
            st.markdown("**Chamados x precipitação diária**")
            st.altair_chart(
                grafico_chamados_clima(
                    clima,
                    "precipitacao",
                    "Precipitação (mm)",
                    "#4C9BE8",
                ),
                width="stretch",
            )

        with direita:
            st.markdown("**Chamados x temperatura média diária**")
            st.altair_chart(
                grafico_chamados_clima(
                    clima,
                    "temperatura",
                    "Temperatura (°C)",
                    "#E8844C",
                ),
                width="stretch",
            )

        st.subheader("Dados diários de clima e chamados")
        st.dataframe(
            clima[["data", "temperatura", "precipitacao", "chamados"]],
            width="stretch",
        )

    st.subheader("Dados da tabela de população")
    st.dataframe(filtrados, width="stretch")


if __name__ == "__main__":
    main()
