from src.chamados import busca_chamados, clima_cobre, intervalo_chamados
from src.extract import Extract
from src.load import Load
from src.transform import Transform
from src.seed_mongo import Seed_Mongo


# Created by AI.
# Updated by AI.
def garantir_clima(
    ext: Extract,
    ld: Load,
    seed: Seed_Mongo,
    transformer: Transform,
    data_inicio: str,
    data_fim: str,
    carregar_da_api: bool = False,
):
    """Garante que `clima_raw` cubra o intervalo dos chamados."""
    df_clima_raw = ext.extract_collection_from_mongo("clima_raw")
    df_clima = None
    if not df_clima_raw.empty:
        df_clima = transformer.transform_clima(df_clima_raw)

    precisa_carregar = (
        carregar_da_api
        or df_clima is None
        or not clima_cobre(df_clima, data_inicio, data_fim)
    )

    if precisa_carregar:
        print("Extraindo dados climáticos da API Open-Meteo!")
        seed.extrair_clima_da_api_e_salvar_no_mongo(
            ext,
            ld,
            data_inicio=data_inicio,
            data_fim=data_fim,
        )
        df_clima_raw = ext.extract_collection_from_mongo("clima_raw")

    return df_clima_raw


# Created by AI.
def garantir_populacao(
    ext: Extract,
    ld: Load,
    seed: Seed_Mongo,
    carregar_da_api: bool = False,
):
    """Garante que `populacao_ibge_raw` possua a carga mais recente do IBGE."""
    df_populacao_raw = ext.extract_collection_from_mongo("populacao_ibge_raw")

    if carregar_da_api or df_populacao_raw.empty:
        print("Extraindo dados de população da API do IBGE!")
        seed.extrair_populacao_da_api_e_salvar_no_mongo(ext, ld)
        df_populacao_raw = ext.extract_collection_from_mongo("populacao_ibge_raw")

    return df_populacao_raw


# Created by AI.
def carregar_tabelas(ld: Load, tabelas: dict[str, object]) -> None:
    """Carrega as tabelas no SQLite e no Neon."""
    for nome, df in tabelas.items():
        print(f"Carregando {nome} no SQLite...")
        ld.load_sqlite(df, nome)

        print(f"Carregando {nome} no Neon...")
        ld.load_neon(df, nome)


# Created by AI.
# Updated by AI.
def run_etl(
    carregar_clima_da_api: bool = False,
    carregar_populacao_da_api: bool = False,
):
    """
    Executa o pipeline medallion completo:

    bronze (Mongo) -> silver (SQLite/Neon) -> gold (SQLite/Neon)

    O backend continua sendo a fonte da verdade. O sync dos chamados é uma
    etapa separada (`python -m src.sync_chamados`) ou a primeira task do flow.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()
    seed = Seed_Mongo()

    try:
        log_inicio_etl("ETL Fiscalize (bronze -> silver -> gold)")

        # 1. Bronze: chamados sincronizados do backend + clima + população
        print("Etapa 1: Lendo chamados da coleção chamados_raw.")
        chamados = busca_chamados(ext)
        print(f"{len(chamados)} chamados carregados.")

        data_inicio, data_fim = intervalo_chamados(chamados)
        print(f"Intervalo de clima necessário: {data_inicio} a {data_fim}.")

        df_clima_raw = garantir_clima(
            ext,
            ld,
            seed,
            transformer,
            data_inicio,
            data_fim,
            carregar_da_api=carregar_clima_da_api,
        )
        df_populacao_raw = garantir_populacao(
            ext,
            ld,
            seed,
            carregar_da_api=carregar_populacao_da_api,
        )

        # 2. Silver
        print("Etapa 2: Montando a camada silver.")
        silver_chamado = transformer.build_silver_chamado(chamados)
        silver_clima_diario = transformer.build_silver_clima_diario(df_clima_raw)
        silver_bairro_populacao = transformer.build_silver_bairro_populacao(
            df_populacao_raw
        )

        carregar_tabelas(
            ld,
            {
                "silver_chamado": silver_chamado,
                "silver_clima_diario": silver_clima_diario,
                "silver_bairro_populacao": silver_bairro_populacao,
            },
        )

        # 3. Gold
        print("Etapa 3: Gerando a camada gold a partir da silver.")
        chamados_clima = transformer.build_gold_chamados_clima(
            silver_chamado,
            silver_clima_diario,
        )
        chamados_populacao = transformer.build_gold_chamados_populacao(
            silver_chamado,
            silver_bairro_populacao,
        )
        chamados_clima_diario = transformer.build_gold_chamados_clima_diario(
            silver_chamado,
            silver_clima_diario,
        )

        carregar_tabelas(
            ld,
            {
                "chamados_clima": chamados_clima,
                "chamados_populacao": chamados_populacao,
                "chamados_clima_diario": chamados_clima_diario,
            },
        )

        log_fim_etl("ETL Fiscalize (bronze -> silver -> gold)")

    finally:
        ext.close()
        ld.close()


# Created by AI.
def run_populacao(carregar_da_api: bool = False):
    """
    Atualiza apenas a camada de população e a gold `chamados_populacao`.

    Útil para refletir chamados novos no Dashboard ETL sem consultar a API
    de clima. As tabelas silver de clima não são regravadas.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()
    seed = Seed_Mongo()

    try:
        log_inicio_etl("ETL de População")

        chamados = busca_chamados(ext)
        print(f"{len(chamados)} chamados carregados.")

        df_populacao_raw = garantir_populacao(
            ext,
            ld,
            seed,
            carregar_da_api=carregar_da_api,
        )

        silver_chamado = transformer.build_silver_chamado(chamados)
        silver_bairro_populacao = transformer.build_silver_bairro_populacao(
            df_populacao_raw
        )

        carregar_tabelas(
            ld,
            {
                "silver_chamado": silver_chamado,
                "silver_bairro_populacao": silver_bairro_populacao,
            },
        )

        chamados_populacao = transformer.build_gold_chamados_populacao(
            silver_chamado,
            silver_bairro_populacao,
        )
        carregar_tabelas(ld, {"chamados_populacao": chamados_populacao})

        log_fim_etl("ETL de População")

    finally:
        ext.close()
        ld.close()


# Created by AI.
def log_inicio_etl(nome_etl: str):
    print("\n" + "=" * 50)
    print(f"  INICIANDO: {nome_etl}")
    print("=" * 50 + "\n")


# Created by AI.
def log_fim_etl(nome_etl: str):
    print("\n" + "=" * 50)
    print(f"  ✅ CONCLUÍDO: {nome_etl}")
    print("=" * 50 + "\n")
    print()


# Created by AI.
# Updated by AI.
def main():
    """
    Executa o ETL completo do projeto.
    """

    run_etl()


if __name__ == "__main__":
    main()
