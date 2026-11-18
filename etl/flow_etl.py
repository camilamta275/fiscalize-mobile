from prefect import flow, task
from prefect.cache_policies import NO_CACHE

from src.chamados import busca_chamados, clima_cobre, intervalo_chamados
from src.extract import Extract
from src.load import Load
from src.seed_mongo import Seed_Mongo
from src.sync_chamados import SyncChamados
from src.transform import Transform
from src.spark_transform import SparkTransform
from src.spark_session import encerrar_sessao_spark


@task(name="Sincronizar chamados do backend", log_prints=True)
def sincronizar_chamados():
    """Copia os chamados do PostgreSQL do backend para chamados_raw."""
    return SyncChamados().run()


@task(name="Ler chamados", log_prints=True)
def ler_chamados():
    """Lê os chamados reais da coleção chamados_raw."""
    ext = Extract()

    try:
        chamados = busca_chamados(ext)
        print(f"{len(chamados)} chamados carregados.")
        return chamados
    finally:
        ext.close()


@task(name="Garantir clima no intervalo", log_prints=True)
def garantir_clima(data_inicio: str, data_fim: str):
    """
    Busca a série climática quando a carga existente
    não cobre o intervalo necessário.
    """
    ext = Extract()
    ld = Load()
    seed = Seed_Mongo()

    try:
        raw = ext.extract_collection_from_mongo("clima_raw")

        # Mantém a transformação Pandas nesta verificação.
        transformado = (
            None if raw.empty else Transform().transform_clima(raw)
        )

        if transformado is None or not clima_cobre(
            transformado,
            data_inicio,
            data_fim,
        ):
            seed.extrair_clima_da_api_e_salvar_no_mongo(
                ext,
                ld,
                data_inicio=data_inicio,
                data_fim=data_fim,
            )
        else:
            print(
                f"clima_raw já cobre o intervalo "
                f"{data_inicio} a {data_fim}; "
                "nenhuma chamada à API foi necessária."
            )
    finally:
        ext.close()
        ld.close()


@task(name="Garantir população do IBGE", log_prints=True)
def garantir_populacao():
    """Busca a população do IBGE quando a carga bronze estiver vazia."""
    ext = Extract()
    ld = Load()
    seed = Seed_Mongo()

    try:
        raw = ext.extract_collection_from_mongo("populacao_ibge_raw")

        if raw.empty:
            seed.extrair_populacao_da_api_e_salvar_no_mongo(ext, ld)
        else:
            print(
                "populacao_ibge_raw já possui carga; "
                "nenhuma chamada foi necessária."
            )
    finally:
        ext.close()
        ld.close()


@task(name="Extrair dados do MongoDB", log_prints=True)
def extrair_mongo(nome_colecao: str):
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


@task(name="Construir camada silver com Spark", log_prints=True)
def construir_silver(chamados, clima_bruto, populacao_bruta):
    """
    Constrói as três tabelas Silver utilizando Apache Spark.
    """

    transform = SparkTransform()

    return {
        "silver_chamado": transform.build_silver_chamado(chamados),

        "silver_clima_diario": transform.build_silver_clima_diario(
            clima_bruto
        ),

        "silver_bairro_populacao": (
            transform.build_silver_bairro_populacao(populacao_bruta)
        ),
    }


@task(
    name="Construir camada gold com Spark",
    log_prints=True,
    cache_policy=NO_CACHE,
)
def construir_gold(silver: dict):
    """
    Gera as tabelas Gold exclusivamente a partir
    dos DataFrames da camada Silver com Spark.
    """

    transform = SparkTransform()

    silver_chamado = silver["silver_chamado"]
    silver_clima_diario = silver["silver_clima_diario"]
    silver_bairro_populacao = silver["silver_bairro_populacao"]

    return {
        "chamados_clima": transform.build_gold_chamados_clima(
            silver_chamado,
            silver_clima_diario,
        ),

        "chamados_populacao": transform.build_gold_chamados_populacao(
            silver_chamado,
            silver_bairro_populacao,
        ),

        "chamados_clima_diario": (
            transform.build_gold_chamados_clima_diario(
                silver_chamado,
                silver_clima_diario,
            )
        ),
    }


@task(
    name="Carregar no SQLite",
    log_prints=True,
    cache_policy=NO_CACHE,
)
def carregar_sqlite(tabelas: dict, camada: str):
    """
    Persiste os DataFrames da camada Silver ou Gold no SQLite.
    A conversão de Spark para Pandas ocorre dentro de Load.
    """

    load = Load()

    try:
        for tabela, dados in tabelas.items():
            print(f"[{camada}] SQLite: {tabela}")
            load.load_sqlite(dados, tabela)
    finally:
        load.close()


@task(
    name="Carregar no Neon",
    log_prints=True,
    retries=2,
    retry_delay_seconds=5,
    cache_policy=NO_CACHE,
)
def carregar_neon(tabelas: dict, camada: str):
    """
    Persiste os DataFrames da camada Silver ou Gold no Neon.
    A conversão de Spark para Pandas ocorre dentro de Load.
    """

    load = Load()

    try:
        for tabela, dados in tabelas.items():
            print(f"[{camada}] Neon: {tabela}")
            load.load_neon(dados, tabela)
    finally:
        load.close()


@flow(name="ETL Fiscalize", log_prints=True)
def etl_fiscalize():
    """
    Orquestra o pipeline completo:
    Bronze -> Silver -> Gold.

    O Apache Spark é utilizado nas transformações
    das camadas Silver e Gold.
    """

    try:
        # ==========================================================
        # BRONZE: SINCRONIZAÇÃO E EXTRAÇÃO
        # ==========================================================

        sincronizar_chamados()

        chamados = ler_chamados()

        data_inicio, data_fim = intervalo_chamados(chamados)

        garantir_clima(data_inicio, data_fim)
        garantir_populacao()

        clima_bruto = extrair_mongo("clima_raw")
        populacao_bruta = extrair_mongo("populacao_ibge_raw")

        # ==========================================================
        # SILVER: TRANSFORMAÇÃO COM APACHE SPARK
        # ==========================================================

        silver = construir_silver(
            chamados,
            clima_bruto,
            populacao_bruta,
        )

        # Persistência da camada Silver.
        carregar_sqlite(silver, "silver")
        carregar_neon(silver, "silver")

        # ==========================================================
        # GOLD: TRANSFORMAÇÃO COM APACHE SPARK
        # ==========================================================

        gold = construir_gold(silver)

        # Persistência da camada Gold.
        carregar_sqlite(gold, "gold")
        carregar_neon(gold, "gold")

        print("ETL Fiscalize finalizada com sucesso!")

    finally:
        # ==========================================================
        # ENCERRAMENTO DO APACHE SPARK
        # ==========================================================

        encerrar_sessao_spark()


if __name__ == "__main__":
    etl_fiscalize()
