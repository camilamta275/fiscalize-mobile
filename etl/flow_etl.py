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


# Created by AI.
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
            print("populacao_ibge_raw já possui carga; nenhuma chamada foi necessária.")
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


# Created by AI.
@task(name="Construir camada silver", log_prints=True)
def construir_silver(chamados, clima_bruto, populacao_bruta):
    """Monta as três tabelas silver a partir do bronze."""
    transform = Transform()

    return {
        "silver_chamado": transform.build_silver_chamado(chamados),
        "silver_clima_diario": transform.build_silver_clima_diario(clima_bruto),
        "silver_bairro_populacao": transform.build_silver_bairro_populacao(
            populacao_bruta
        ),
    }


# Created by AI.
@task(name="Construir camada gold", log_prints=True)
def construir_gold(silver: dict):
    """Gera as tabelas gold exclusivamente a partir da silver."""
    transform = Transform()
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
        "chamados_clima_diario": transform.build_gold_chamados_clima_diario(
            silver_chamado,
            silver_clima_diario,
        ),
    }


# Updated by AI.
@task(name="Carregar no SQLite", log_prints=True)
def carregar_sqlite(tabelas: dict, camada: str):
    load = Load()

    try:
        for tabela, dados in tabelas.items():
            print(f"[{camada}] SQLite: {tabela}")
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
def carregar_neon(tabelas: dict, camada: str):
    load = Load()

    try:
        for tabela, dados in tabelas.items():
            print(f"[{camada}] Neon: {tabela}")
            load.load_neon(dados, tabela)
    finally:
        load.close()


# Created by AI.
# Updated by AI.
@flow(name="ETL Fiscalize", log_prints=True)
def etl_fiscalize():
    """Orquestra o sync e o pipeline medallion bronze -> silver -> gold."""

    sincronizar_chamados()
    chamados = ler_chamados()
    data_inicio, data_fim = intervalo_chamados(chamados)

    garantir_clima(data_inicio, data_fim)
    garantir_populacao()

    clima_bruto = extrair_mongo("clima_raw")
    populacao_bruta = extrair_mongo("populacao_ibge_raw")

    silver = construir_silver(chamados, clima_bruto, populacao_bruta)
    carregar_sqlite(silver, "silver")
    carregar_neon(silver, "silver")

    gold = construir_gold(silver)
    carregar_sqlite(gold, "gold")
    carregar_neon(gold, "gold")


if __name__ == "__main__":
    etl_fiscalize()
