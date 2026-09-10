import json

from src.extract import Extract
from src.load import Load
from src.transform import Transform
import pandas as pd


def run_clima():
    """
    Executa o ETL de dados climáticos.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()

    try:
            log_inicio_etl("ETL de Clima")

            # 1. Extração dos chamados fictícios
            print("Etapa 1: Lendo chamados fictícios!")

            chamados = busca_chamados();
        
            print(f"{len(chamados)} chamados carregados!")
    
            # 2. Extração da API Open-Meteo
            print("Etapa 2: Extraindo dados climáticos!")
        
            data = ext.clima(
                latitude=-8.0631,
                longitude=-34.8711,
                data_inicio="2026-02-01",
                data_fim="2026-02-28"
            )
        
            # Guarda o resultado bruto no MongoDB
            ld.load_mongo(
                data,
                "clima_raw"
            )
        
            # 3. Transformação
            print("Etapa 3: Transformando os dados!")
        
            df_clima = transformer.transform_clima(data)

        
            # 4. Cruzamento chamados + clima
            print("Etapa 4: Cruzando chamados com dados climáticos!")
        
            df_final = transformer.merge_chamados_clima(
                chamados,
                df_clima
            )
        
            # 5. Carga no SQLite
            print("Etapa 5: Salvando no SQLite!")
        
            ld.load_sqlite(
                df_final,
                "chamados_clima"
            )

            log_fim_etl("ETL de Clima")

    finally:
        ext.close()
        ld.close()
        

def run_populacao():
    """
    Executa o ETL de população.
    """

    ext = Extract()
    transformer = Transform()
    ld = Load()

    try:
        log_inicio_etl("ETL de População")

        # 1. Extração
        print("Etapa 1: Extraindo dados do IBGE!")

        df_demografia = ext.populacao_bairros()

        # 2. Carga do dado bruto no MongoDB
        print("Etapa 2: Salvando dados brutos no MongoDB!")

        dados_populacao = df_demografia.to_dict(
            orient="records"
        )

        ld.load_mongo(
            dados_populacao,
            "populacao_ibge_raw"
        )

        # 3. Transformação
        print("Etapa 3: Transformando os dados!")

        df_populacao = transformer.transform_populacao(
            df_demografia
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

        # 6. SQLite
        print("Etapa 5: Salvando no SQLite!")

        ld.load_sqlite(
            df_final,
            "chamados_populacao"
        )

        log_fim_etl("ETL de População")

    finally:
        ext.close()
        ld.close()

def busca_chamados():
    """
    Busca os chamados fictícios no arquivo JSON.
    """

    with open(
        "data/chamados.json",
        "r",
        encoding="utf-8"
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
