from pathlib import Path

from prefect import flow, task

BASE_DIR = Path(__file__).resolve().parent

from src.extract import Extract
from src.load import Load
from src.transform import Transform


# Updated by AI.
@task(name="Ler chamados", log_prints=True)
def ler_chamados():
    """Lê os chamados fictícios do arquivo JSON."""
    import json

    caminho = BASE_DIR / "data" / "chamados.json"

    with open(caminho, "r", encoding="utf-8") as arquivo:
        chamados = json.load(arquivo)

    print(f"{len(chamados)} chamados carregados.")
    return chamados


# Updated by AI.
@task(name="Extrair dados do MongoDB", log_prints=True)
def extrair_mongo(nome_colecao):
    """Lê os dados brutos previamente armazenados no MongoDB."""
    ext = Extract()

    try:
        dados = ext.extract_collection_from_mongo(nome_colecao)

        if dados.empty:
            raise ValueError(
                f"A coleção '{nome_colecao}' está vazia."
            )

        return dados
    finally:
        ext.close()


# Updated by AI.
@task(name="Transformar clima", log_prints=True)
def transformar_clima(dados_brutos):
    return Transform().transform_clima(dados_brutos)


# Updated by AI.
@task(name="Transformar população", log_prints=True)
def transformar_populacao(dados_brutos):
    return Transform().transform_populacao(dados_brutos)


# Updated by AI.
@task(name="Cruzar chamados e clima", log_prints=True)
def cruzar_clima(chamados, dados_clima):
    return Transform().merge_chamados_clima(
        chamados,
        dados_clima
    )


# Updated by AI.
@task(name="Cruzar chamados e população", log_prints=True)
def cruzar_populacao(chamados, dados_populacao):
    return Transform().merge_chamados_populacao(
        chamados,
        dados_populacao
    )


# Updated by AI.
@task(name="Carregar no SQLite", log_prints=True)
def carregar_sqlite(dados, tabela):
    load = Load()

    try:
        load.load_sqlite(dados, tabela)
    finally:
        load.close()


# Updated by AI.
@task(
    name="Carregar no Neon",
    log_prints=True,
    retries=2,
    retry_delay_seconds=5
)
def carregar_neon(dados, tabela):
    load = Load()

    try:
        load.load_neon(dados, tabela)
    finally:
        load.close()


# Updated by AI.
@flow(name="ETL Fiscalize", log_prints=True)
def etl_fiscalize():
    """Orquestra os pipelines de clima e população."""

    chamados = ler_chamados()

    # Pipeline de clima
    clima_bruto = extrair_mongo("clima_raw")
    clima_transformado = transformar_clima(clima_bruto)
    chamados_clima = cruzar_clima(
        chamados,
        clima_transformado
    )

    carregar_sqlite(chamados_clima, "chamados_clima")
    carregar_neon(chamados_clima, "chamados_clima")

    # Pipeline de população
    populacao_bruta = extrair_mongo("populacao_ibge_raw")
    populacao_transformada = transformar_populacao(
        populacao_bruta
    )
    chamados_populacao = cruzar_populacao(
        chamados,
        populacao_transformada
    )

    carregar_sqlite(
        chamados_populacao,
        "chamados_populacao"
    )
    carregar_neon(
        chamados_populacao,
        "chamados_populacao"
    )


if __name__ == "__main__":
    etl_fiscalize()
