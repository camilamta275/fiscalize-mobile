import os
import sqlite3

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()


class Load:
    """
    Responsável por persistir os dados extraídos da API do IBGE (PNADC),
    seja em um arquivo JSON local, seja em uma coleção do MongoDB.
    """

    def __init__(self):
        self.mongo_uri = os.getenv("MONGODB_URI")
        self.client = MongoClient(self.mongo_uri, server_api=ServerApi("1"))

        self.database_name = "FISCALIZE_ETL"
        self.sqlite_database = "fiscalize_etl.db"

    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()


    def load_sqlite(
        self,
        df: pd.DataFrame,
        table_name: str
    ) -> None:
        """
        Carrega o DataFrame transformado em uma tabela SQLite.

        Parâmetros:
            df: DataFrame com os dados transformados.
            table_name: nome da tabela no SQLite.
        """

        conn = sqlite3.connect(self.sqlite_database)

        df.to_sql(
            table_name,
            conn,
            if_exists="replace",
            index=False
        )

        conn.close()

        print(
            f"DataFrame carregado com sucesso "
            f"no SQLite: {table_name}"
        )

    def load_mongo(
        self,
        data: dict | list[dict],
        collection_name: str
    ) -> None:
        """
        Carrega dados brutos em uma coleção do MongoDB.

        Parâmetros:
            data: dado bruto a ser armazenado.
            collection_name: nome da coleção no MongoDB.
        """

        db = self.client[self.database_name]
        collection = db[collection_name]

        if isinstance(data, dict):
            collection.insert_one(data)
        else:
            collection.insert_many(data)

        print(
            f"Dados brutos carregados com sucesso "
            f"no MongoDB: {collection_name}"
        )