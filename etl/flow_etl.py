import argparse
import json
from pathlib import Path

from dotenv import load_dotenv
from prefect import flow, task
from prefect.futures import wait

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from src.extract import Extract
from src.load import Load
from src.seed_mongo import Seed_Mongo
from src.transform import Transform


@task(name="Ler chamados", log_prints=True)
def ler_chamados():
    """Lê os chamados fictícios do arquivo JSON."""
    caminho = BASE_DIR / "data" / "chamados.json"

    with open(caminho, "r", encoding="utf-8") as arquivo:
        chamados = json.load(arquivo)

    print(f"{len(chamados)} chamados carregados.")
    return chamados


@task(
    name="Extrair clima da API (Open-Meteo)",
    log_prints=True,
    retries=2,
    retry_delay_seconds=10
)
def extrair_clima_api():
    """Busca os dados climáticos na API e salva o bruto no MongoDB."""
    ext = Extract()
    ld = Load()

    try:
        Seed_Mongo().extrair_clima_da_api_e_salvar_no_mongo(ext, ld)
    finally:
        ext.close()
        ld.close()


@task(
    name="Extrair população da API (IBGE)",
    log_prints=True,
    retries=2,
    retry_delay_seconds=10
)
def extrair_populacao_api():
    """Baixa os dados de população do IBGE e salva o bruto no MongoDB."""
    ext = Extract()
    ld = Load()

    try:
        Seed_Mongo().extrair_populacao_da_api_e_salvar_no_mongo(ext, ld)
    finally:
        ext.close()
        ld.close()


@task(
    name="Extrair dados do MongoDB",
    log_prints=True,
    retries=2,
    retry_delay_seconds=5
)
def extrair_mongo(nome_colecao):
    """Lê os dados brutos previamente armazenados no MongoDB."""
    ext = Extract()

    try:
        dados = ext.extract_collection_from_mongo(nome_colecao)

        if dados.empty:
            raise ValueError(
                f"A coleção '{nome_colecao}' está vazia."
            )

        print(f"{len(dados)} registros lidos de '{nome_colecao}'.")
        return dados
    finally:
        ext.close()


@task(name="Transformar clima", log_prints=True)
def transformar_clima(dados_brutos):
    return Transform().transform_clima(dados_brutos)


@task(name="Transformar população", log_prints=True)
def transformar_populacao(dados_brutos):
    return Transform().transform_populacao(dados_brutos)


@task(name="Cruzar chamados e clima", log_prints=True)
def cruzar_clima(chamados, dados_clima):
    return Transform().merge_chamados_clima(
        chamados,
        dados_clima
    )


@task(name="Cruzar chamados e população", log_prints=True)
def cruzar_populacao(chamados, dados_populacao):
    return Transform().merge_chamados_populacao(
        chamados,
        dados_populacao
    )


@task(name="Carregar no SQLite", log_prints=True)
def carregar_sqlite(dados, tabela):
    load = Load()

    try:
        load.load_sqlite(dados, tabela)
    finally:
        load.close()


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


@flow(name="ETL Fiscalize", log_prints=True)
def etl_fiscalize(
    carregar_da_api: bool = False,
    colecao_clima: str = "clima_raw",
    colecao_populacao: str = "populacao_ibge_raw"
):
    """
    Orquestra os pipelines de clima e população.

    Parâmetros:
        carregar_da_api: se True, busca os dados nas APIs (Open-Meteo e
            IBGE) e atualiza o bruto no MongoDB antes de transformar.
        colecao_clima / colecao_populacao: coleções do MongoDB lidas
            pela pipeline. Um nome inexistente faz a extração falhar,
            o que serve para demonstrar o tratamento de falhas.

    Os dois pipelines (clima e população) não dependem um do outro e
    rodam em paralelo; dentro de cada um, as etapas seguem a ordem
    extração -> transformação -> cruzamento -> carga.
    """

    chamados = ler_chamados.submit()

    # Extração das APIs (opcional): a leitura do Mongo só começa depois
    # que o bruto foi atualizado.
    espera_clima = []
    espera_populacao = []

    if carregar_da_api:
        espera_clima = [extrair_clima_api.submit()]
        espera_populacao = [extrair_populacao_api.submit()]

    # Pipeline de clima
    clima_bruto = extrair_mongo.submit(
        colecao_clima,
        wait_for=espera_clima
    )
    clima_transformado = transformar_clima.submit(clima_bruto)
    chamados_clima = cruzar_clima.submit(
        chamados,
        clima_transformado
    )

    # Pipeline de população
    populacao_bruta = extrair_mongo.submit(
        colecao_populacao,
        wait_for=espera_populacao
    )
    populacao_transformada = transformar_populacao.submit(
        populacao_bruta
    )
    chamados_populacao = cruzar_populacao.submit(
        chamados,
        populacao_transformada
    )

    cargas = [
        carregar_sqlite.submit(chamados_clima, "chamados_clima"),
        carregar_neon.submit(chamados_clima, "chamados_clima"),
        carregar_sqlite.submit(chamados_populacao, "chamados_populacao"),
        carregar_neon.submit(chamados_populacao, "chamados_populacao"),
    ]

    wait(cargas)

    # Se alguma etapa falhou, as cargas que dependem dela não chegam a
    # rodar. Nesse caso o flow é marcado como Failed no Prefect.
    nao_concluidas = [c for c in cargas if not c.state.is_completed()]

    if nao_concluidas:
        raise RuntimeError(
            f"{len(nao_concluidas)} de {len(cargas)} cargas não foram "
            "concluídas. Verifique no painel do Prefect a task que falhou."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL Fiscalize com Prefect")
    parser.add_argument(
        "--api",
        action="store_true",
        help="atualiza os dados brutos das APIs antes de rodar"
    )
    parser.add_argument(
        "--simular-falha",
        action="store_true",
        help="lê uma coleção inexistente para demonstrar uma falha"
    )
    parser.add_argument(
        "--serve",
        action="store_true",
        help="cria um deployment agendado (a cada hora) e fica aguardando"
    )
    args = parser.parse_args()

    if args.serve:
        etl_fiscalize.serve(
            name="etl-fiscalize-agendado",
            cron="0 * * * *"
        )
    else:
        etl_fiscalize(
            carregar_da_api=args.api,
            colecao_clima=(
                "colecao_inexistente" if args.simular_falha else "clima_raw"
            )
        )
