import sqlite3
from datetime import datetime, timezone

import pandas as pd
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from sqlalchemy import create_engine

from src.config import DATABASE_URL, MONGO_DATABASE, MONGODB_URI, SQLITE_DATABASE


# Updated by AI.
class Load:
    """
    Responsável por persistir os dados extraídos da API do IBGE (PNADC),
    seja em um arquivo JSON local, seja em uma coleção do MongoDB.
    """

    # Updated by AI.
    def __init__(self):
        self.mongo_uri = MONGODB_URI
        self.client = MongoClient(self.mongo_uri, server_api=ServerApi("1"))

        self.database_name = MONGO_DATABASE
        self.sqlite_database = SQLITE_DATABASE

    # Updated by AI.
    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()


    # Updated by AI.
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

        with sqlite3.connect(self.sqlite_database) as conn:
            df.to_sql(
                table_name,
                conn,
                if_exists="replace",
                index=False,
            )

        print(
            f"DataFrame carregado com sucesso "
            f"no SQLite: {table_name}"
        )

    # Updated by AI.
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

        data_extracao = datetime.now(timezone.utc)
        if isinstance(data, dict):
            records = [dict(data)]
        else:
            records = [dict(item) for item in data]

        if not records:
            raise ValueError(
                f"Nenhum registro foi recebido para a coleção "
                f"{collection_name}."
            )

        for record in records:
            record["data_extracao"] = data_extracao

        collection.insert_many(records)

        print(
            f"Dados brutos carregados com sucesso "
            f"no MongoDB: {collection_name} "
            f"({len(records)} registros; carga {data_extracao})"
        )

    # Updated by AI.
    def load_neon(
        self,
        df: pd.DataFrame,
        table_name: str
    ) -> None:
        """
        Carrega o DataFrame transformado em uma tabela PostgreSQL.

        Parâmetros:
            df: DataFrame com os dados transformados.
            table_name: nome da tabela no PostgreSQL.
        """

        engine = create_engine(DATABASE_URL)
        try:
            df.to_sql(
                table_name,
                engine,
                if_exists="replace",
                index=False,
            )
        finally:
            engine.dispose()

        print(
            f"DataFrame carregado com sucesso "
            f"no PostgreSQL: {table_name}"
        )