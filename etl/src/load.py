import sqlite3
from datetime import datetime, timezone

import pandas as pd
from pymongo import MongoClient, UpdateOne
from pymongo.server_api import ServerApi
from sqlalchemy import create_engine, text

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
    def upsert_mongo(
        self,
        records: list[dict],
        collection_name: str,
        id_field: str = "_id",
    ) -> tuple[int, int]:
        """
        Insere ou atualiza documentos usando `id_field` como chave.

        Diferente de `load_mongo`, esta carga é idempotente: rodar o sync
        duas vezes não duplica chamados. Documentos que não existem mais no
        backend também são removidos da coleção.
        """
        if not records:
            print(f"Nenhum registro para sincronizar em {collection_name}.")
            return 0, 0

        db = self.client[self.database_name]
        collection = db[collection_name]
        synced_at = datetime.now(timezone.utc)

        operations = []
        ids = []
        for record in records:
            document = dict(record)
            if id_field not in document:
                raise ValueError(
                    f"Registro sem o campo obrigatório '{id_field}' "
                    f"para a coleção {collection_name}."
                )

            ids.append(document[id_field])
            document["data_extracao"] = synced_at
            document["synced_at"] = synced_at
            operations.append(
                UpdateOne(
                    {id_field: document[id_field]},
                    {"$set": document},
                    upsert=True,
                )
            )

        result = collection.bulk_write(operations, ordered=False)
        deleted = collection.delete_many(
            {id_field: {"$nin": ids}}
        ).deleted_count

        print(
            f"Chamados sincronizados em {collection_name}: "
            f"{len(records)} upsert(s), {deleted} remoção(ões), "
            f"carga {synced_at}."
        )

        return len(records), deleted

    # Updated by AI.
    def load_neon(
        self,
        df: pd.DataFrame,
        table_name: str
    ) -> None:
        """
        Carrega o DataFrame transformado em uma tabela PostgreSQL.

        A carga não usa DROP/TRUNCATE: o usuário do Neon pode não ser dono
        das tabelas criadas por outro papel. Em vez disso, apaga as linhas e
        insere a nova carga na mesma transação. Se a tabela ainda não existir,
        ela é criada.
        """

        if not table_name.replace("_", "").isalnum():
            raise ValueError(f"Nome de tabela inválido: {table_name}")

        engine = create_engine(DATABASE_URL)
        try:
            with engine.begin() as connection:
                exists = connection.execute(
                    text("SELECT to_regclass(:name)"),
                    {"name": table_name},
                ).scalar()

                if exists:
                    connection.execute(text(f'DELETE FROM "{table_name}"'))
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