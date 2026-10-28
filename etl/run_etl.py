import json

from src.config import CHAMADOS_PATH
from src.extract import Extract
from src.load import Load
from src.transform import Transform
from src.seed_mongo import Seed_Mongo

# Updated by AI.
def run_clima(carregar_da_api: bool = False):
    """
    Executa o ETL de dados climáticos.

    Parâmetros:
        carregar_da_api: se True, extrai os dados da API Open-Meteo e
            salva o bruto no Mongo antes de seguir o fluxo normal.
            Use True apenas na primeira execução ou quando quiser
            atualizar os dados brutos.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()
    seed = Seed_Mongo()

    try:
            log_inicio_etl("ETL de Clima")

           # 1. Extração dos chamados fictícios
            print("Etapa 1: Lendo chamados fictícios!")
            chamados = busca_chamados()
            print(f"{len(chamados)} chamados carregados!")

            # 2. Extração da API (opcional) e carga bruta no Mongo
            if carregar_da_api:
                print("Etapa 2: Extraindo dados climáticos da API!")
                seed.extrair_clima_da_api_e_salvar_no_mongo(ext, ld)

            # 3. Busca dos dados brutos no Mongo
            print("Etapa 3: Buscando dados em MONGO!")
            df_clima_raw = ext.extract_collection_from_mongo("clima_raw")
            if df_clima_raw.empty:
                raise ValueError("A coleção clima_raw está vazia.")
 
        
            # 4. Transformação
            print("Etapa 4: Transformando os dados!")
        
            df_clima = transformer.transform_clima(df_clima_raw)
            print(
                f"Auditoria clima: {len(df_clima_raw)} documento(s) bronze "
                f"e {len(df_clima)} registro(s) transformado(s)."
            )

        
            # 5. Cruzamento chamados + clima
            print("Etapa 5: Cruzando chamados com dados climáticos!")
        
            df_final = transformer.merge_chamados_clima(
                chamados,
                df_clima
            )
            print(
                f"Auditoria clima: {len(chamados)} chamado(s) de entrada e "
                f"{len(df_final)} chamado(s) no destino."
            )
        
            # 6. Carga no SQLite
            print("Etapa 6: Salvando no SQLite!")
            ld.load_sqlite(df_final, "chamados_clima")

            # 7. Carga no Neon
            print("Etapa 7: Salvando no Neon!")
            ld.load_neon(df_final, "chamados_clima")

            log_fim_etl("ETL de Clima")

    finally:
        ext.close()
        ld.close()
        

# Updated by AI.
def run_populacao(carregar_da_api: bool = False):
    """
    Executa o ETL de população.

    Parâmetros:
        carregar_da_api: se True, extrai os dados do IBGE e salva o
            bruto no Mongo antes de seguir o fluxo normal. Use True
            apenas na primeira execução ou quando quiser atualizar os
            dados brutos.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()
    seed = Seed_Mongo()

    try:
        log_inicio_etl("ETL de População")

        # 1. Extração da API (opcional) e carga bruta no Mongo
        if carregar_da_api:
            print("Etapa 1: Extraindo dados de população da API!")
            seed.extrair_populacao_da_api_e_salvar_no_mongo(ext, ld)

        # 2. Busca dos dados brutos no Mongo
        print("Etapa 2: Buscando dados em MONGO!")
        df_populacao_raw = ext.extract_collection_from_mongo("populacao_ibge_raw")
        if df_populacao_raw.empty:
            raise ValueError("A coleção populacao_ibge_raw está vazia.")

        # 3. Transformação
        print("Etapa 3: Transformando os dados!")

        df_populacao = transformer.transform_populacao(
            df_populacao_raw
        )
        print(
            f"Auditoria população: {len(df_populacao_raw)} registro(s) "
            f"na carga bronze e {len(df_populacao)} após o filtro de Recife."
        )

        # 4. Leitura dos chamados fictícios
        chamados = busca_chamados()

        # 5. Cruzamento
        print(
            "Etapa 4: Cruzando chamados e população!"
        )

        df_final = transformer.merge_chamados_populacao(
            chamados,
            df_populacao
        )
        print(
            f"Auditoria população: {len(chamados)} chamado(s) de entrada e "
            f"{len(df_final)} bairro(s) agregados no destino."
        )

        # 6. SQLite
        print("Etapa 5: Salvando no SQLite!")

        ld.load_sqlite(df_final, "chamados_populacao")

        # 7. Carga no Neon
        print("Etapa 7: Salvando no Neon!")
        ld.load_neon(df_final, "chamados_populacao")

        log_fim_etl("ETL de População")

    finally:
        ext.close()
        ld.close()

# Updated by AI.
def busca_chamados():
    """
    Busca os chamados fictícios no arquivo JSON.
    """

    with open(
        CHAMADOS_PATH,
        "r",
        encoding="utf-8",
    ) as arquivo:
        chamados = json.load(arquivo)

    return chamados

def log_inicio_etl(nome_etl: str):
    print("\n" + "=" * 50)
    print(f"  INICIANDO: {nome_etl}")
    print("=" * 50 + "\n")

def log_fim_etl(nome_etl: str):
    print("\n" + "=" * 50)
    print(f"  ✅ CONCLUÍDO: {nome_etl}")
    print("=" * 50 + "\n")
    print()

def main():
    """
        Executa as ETLs do projeto.
    """

    run_clima()
    run_populacao()

if __name__ == "__main__":
    main()
