from prefect import flow, task

from src.chamados import busca_chamados, clima_cobre, intervalo_chamados
from src.extract import Extract
from src.load import Load
from src.seed_mongo import Seed_Mongo
from src.sync_chamados import SyncChamados
from src.transform import Transform


# Created by AI.
@task(name="Sincronizar chamados do backend", log_prints=True)
def sincronizar_chamados():
    """Copia os chamados do PostgreSQL do backend para `chamados_raw`."""
    return SyncChamados().run()


# Updated by AI.
@task(name="Ler chamados", log_prints=True)
def ler_chamados():
    """Lê os chamados reais da coleção `chamados_raw`."""
    ext = Extract()

    try:
        chamados = busca_chamados(ext)
        print(f"{len(chamados)} chamados carregados.")
        return chamados
    finally:
        ext.close()


# Created by AI.
@task(name="Garantir clima no intervalo", log_prints=True)
def garantir_clima(data_inicio: str, data_fim: str):
    """Busca a série climática quando a carga existente não cobre o intervalo."""
    ext = Extract()
    ld = Load()
    seed = Seed_Mongo()

    try:
        raw = ext.extract_collection_from_mongo("clima_raw")
        transformado = None if raw.empty else Transform().transform_clima(raw)

        if transformado is None or not clima_cobre(transformado, data_inicio, data_fim):
            seed.extrair_clima_da_api_e_salvar_no_mongo(
                ext,
                ld,
                data_inicio=data_inicio,
                data_fim=data_fim,
            )
        else:
            print(
                f"clima_raw já cobre o intervalo {data_inicio} a {data_fim}; "
                "nenhuma chamada à API foi necessária."
            )
    finally:
        ext.close()
        ld.close()


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
    """Orquestra o sync e os pipelines de clima e população."""

    sincronizar_chamados()
    chamados = ler_chamados()
    data_inicio, data_fim = intervalo_chamados(chamados)

    # Pipeline de clima
    garantir_clima(data_inicio, data_fim)
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
