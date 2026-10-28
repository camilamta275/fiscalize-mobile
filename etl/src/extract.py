import io
import zipfile

import pandas as pd
import requests
from pymongo import MongoClient
from pymongo.server_api import ServerApi

from src.config import MONGO_DATABASE, MONGODB_URI


# Updated by AI.
class Extract:
    """
        Responsável por extrair dados climáticos da API Open-Meteo
        e ler dados previamente armazenados no MongoDB.
    """

    # Updated by AI.
    def __init__(self):
         # Open-Meteo
        self.clima_url = "https://archive-api.open-meteo.com/v1/archive"

        # IBGE
        self.ibge_bairros_url = (
            "https://ftp.ibge.gov.br/"
            "Censos/Censo_Demografico_2022/"
            "Agregados_por_Setores_Censitarios/"
            "Agregados_por_Bairro_csv/"
            "Agregados_por_bairros_demografia_BR.zip"
        )

        self.ibge_bairros_csv = (
            "Agregados_por_bairros_demografia_BR.csv"
        )

        # MongoDB
        self.mongo_uri = MONGODB_URI
        self.client = MongoClient(
            self.mongo_uri,
            server_api=ServerApi("1")
        )


    # Updated by AI.
    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()

    # Updated by AI.
    def clima(
        self,
        latitude: float,
        longitude: float,
        data_inicio: str,
        data_fim: str
    ) -> dict:
        """
        Busca dados climáticos históricos na API Open-Meteo.

        Parâmetros:
            latitude: latitude da localização consultada.
            longitude: longitude da localização consultada.
            data_inicio: data inicial da consulta, no formato AAAA-MM-DD.
            data_fim: data final da consulta, no formato AAAA-MM-DD.

        Retorna:
            Dados climáticos retornados pela API.
        """

        response = requests.get(
            self.clima_url,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "start_date": data_inicio,
                "end_date": data_fim,
                "daily": "temperature_2m_mean,precipitation_sum",
                "timezone": "America/Recife"
            },
            timeout=60,
        )

        response.raise_for_status()

        print(f"Dados climáticos lidos com sucesso!")

        return response.json()

    # Updated by AI.
    def populacao_bairros(self) -> pd.DataFrame:
        """
        Baixa os dados demográficos por bairro do Censo 2022
        disponibilizados pelo IBGE em arquivo CSV compactado.

        Retorna:
            DataFrame contendo os dados demográficos dos bairros.
            
        Fluxo:
            1. Faz uma requisição HTTP para a URL do IBGE.
            2. Recebe o conteúdo do arquivo ZIP.
            3. Descompacta o arquivo CSV contido no ZIP.
            4. Lê o CSV em um DataFrame do Pandas.
            5. Retorna o DataFrame com os dados demográficos.
        """

        response = requests.get(self.ibge_bairros_url, timeout=120)

        response.raise_for_status()

        arquivo_zip = zipfile.ZipFile(
            io.BytesIO(response.content)
        )

        with arquivo_zip.open(self.ibge_bairros_csv) as arquivo:
            df = pd.read_csv(
                arquivo,
                sep=";",
                encoding="latin1",
                na_values=["", "-", "N/A", "NA", "..."],
                keep_default_na=True,
            )

        print("Dados de população extraídos com sucesso do IBGE!")

        return df

    # Updated by AI.
    def extract_collection_from_mongo(self, collection_name: str) -> pd.DataFrame:
        """
        Extrai dados de uma coleção do MongoDB e retorna como DataFrame.

        Parâmetros:
            collection_name: nome da coleção no MongoDB.

        Retorna:
            DataFrame contendo os dados extraídos da coleção.
        """

        db = self.client[MONGO_DATABASE]
        collection = db[collection_name]

        data = list(collection.find())
        if not data:
            return pd.DataFrame()

        marked_data = [
            item
            for item in data
            if "data_extracao" in item
        ]
        if not marked_data:
            raise ValueError(
                f"A coleção '{collection_name}' possui dados sem "
                "data_extracao. Execute uma nova carga bruta antes da "
                "transformação."
            )

        latest_extraction = max(
            item["data_extracao"]
            for item in marked_data
        )
        latest_data = [
            item
            for item in marked_data
            if item["data_extracao"] == latest_extraction
        ]

        df = pd.DataFrame(latest_data)
        print(
            f"Carga mais recente de {collection_name}: "
            f"{len(df)} registros em {latest_extraction}."
        )

        print(
            f"Dados extraídos com sucesso da coleção "
            f"{collection_name} do MongoDB!"
        )

        return df
