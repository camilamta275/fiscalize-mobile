import sqlite3
from datetime import datetime, timezone

import pandas as pd
from pyspark.sql import DataFrame as SparkDataFrame
from pymongo import MongoClient, UpdateOne
from pymongo.server_api import ServerApi
from sqlalchemy import create_engine, text

from src.config import DATABASE_URL, MONGO_DATABASE, MONGODB_URI, SQLITE_DATABASE


class Load:
    """
    Responsável por persistir dados nas camadas de armazenamento:
    SQLite, MongoDB e PostgreSQL (Neon).
    """

    def __init__(self):
        self.mongo_uri = MONGODB_URI
        self.client = MongoClient(
            self.mongo_uri,
            server_api=ServerApi("1"),
        )

        self.database_name = MONGO_DATABASE
        self.sqlite_database = SQLITE_DATABASE

    def close(self) -> None:
        """Encerra a conexão com o MongoDB."""
        self.client.close()

    def _para_pandas(self, dados) -> pd.DataFrame:
        """
        Converte um DataFrame Spark para Pandas quando necessário.

        Mantém compatibilidade com DataFrames que já são Pandas.
        A conversão acontece somente na etapa de persistência.
        """
        if isinstance(dados, SparkDataFrame):
            return dados.toPandas()

        if isinstance(dados, pd.DataFrame):
            return dados

        raise TypeError(
            "O carregamento espera um DataFrame do Pandas ou do Spark."
        )

    def load_sqlite(
        self,
        df,
        table_name: str,
    ) -> None:
        """
        Carrega o DataFrame transformado em uma tabela SQLite.

        Aceita DataFrames do Pandas ou do Spark.
        """
        df = self._para_pandas(df)

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

    def load_mongo(
        self,
        data: dict | list[dict],
        collection_name: str,
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

    def upsert_mongo(
        self,
        records: list[dict],
        collection_name: str,
        id_field: str = "_id",
    ) -> tuple[int, int]:
        """
        Insere ou atualiza documentos usando id_field como chave.

        A operação é idempotente: executar o sync novamente não duplica
        chamados.

        Documentos que não existem mais na origem são preservados,
        evitando exclusões de dados de outras cargas ou execuções.

        Retorna:
            Quantidade de registros gravados e quantidade removida.
        """
        if not records:
            print(
                f"Nenhum registro para sincronizar em {collection_name}."
            )
            return 0, 0

        db = self.client[self.database_name]
        collection = db[collection_name]
        synced_at = datetime.now(timezone.utc)

        operations = []

        for record in records:
            document = dict(record)

            if id_field not in document:
                raise ValueError(
                    f"Registro sem o campo obrigatório '{id_field}' "
                    f"para a coleção {collection_name}."
                )

            document["data_extracao"] = synced_at
            document["synced_at"] = synced_at

            operations.append(
                UpdateOne(
                    {id_field: document[id_field]},
                    {"$set": document},
                    upsert=True,
                )
            )

        collection.bulk_write(operations, ordered=False)

        # Preserva documentos que não estão na origem atual.
        # Não realiza exclusões automáticas no MongoDB.
        deleted = 0

        print(
            f"Chamados sincronizados em {collection_name}: "
            f"{len(records)} upsert(s), {deleted} remoção(ões), "
            f"carga {synced_at}."
        )

        return len(records), deleted

    def load_neon(
        self,
        df,
        table_name: str,
    ) -> None:
        """
        Carrega o DataFrame transformado em uma tabela PostgreSQL.

        Aceita DataFrames do Pandas ou do Spark.

        A carga não usa DROP/TRUNCATE: apaga as linhas e insere
        a nova carga na mesma transação. Se a tabela ainda não
        existir, ela é criada.
        """
        df = self._para_pandas(df)

        if not table_name.replace("_", "").isalnum():
            raise ValueError(
                f"Nome de tabela inválido: {table_name}"
            )

        engine = create_engine(DATABASE_URL)

        try:
            with engine.begin() as connection:
                exists = connection.execute(
                    text("SELECT to_regclass(:name)"),
                    {"name": table_name},
                ).scalar()

                if exists:
                    connection.execute(
                        text(f'DELETE FROM "{table_name}"')
                    )

                    df.to_sql(
                        table_name,
                        connection,
                        if_exists="append",
                        index=False,
                    )
                else:
                    df.to_sql(
                        table_name,
                        connection,
                        if_exists="fail",
                        index=False,
                    )

        finally:
            engine.dispose()

        print(
            f"DataFrame carregado com sucesso "
            f"no PostgreSQL: {table_name}"
        )
