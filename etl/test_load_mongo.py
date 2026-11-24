from datetime import datetime, timezone
import unittest
from unittest.mock import MagicMock, patch

from src.load import Load


# Created by AI.
class TestLoadMongo(unittest.TestCase):
    # Created by AI.
    def test_load_mongo_is_idempotent_by_snapshot(self):
        # Created by AI.
        def fake_update_one(filter_query, update, upsert):
            return {
                "filter": filter_query,
                "update": update,
                "upsert": upsert,
            }

        extracted_at = datetime(2026, 11, 19, tzinfo=timezone.utc)
        manifests = MagicMock()
        manifests.find_one.return_value = {"data_extracao": extracted_at}
        collection = MagicMock()
        database = {
            "_etl_raw_loads": manifests,
            "populacao_ibge_raw": collection,
        }

        load = Load.__new__(Load)
        load.client = {"FISCALIZE_ETL": database}
        load.database_name = "FISCALIZE_ETL"

        snapshot = [
            {"bairro": "Boa Viagem", "populacao": 10},
            {"bairro": "Casa Amarela", "populacao": 20},
        ]
        with patch("src.load.UpdateOne", side_effect=fake_update_one):
            load.load_mongo(snapshot, "populacao_ibge_raw")
            load.load_mongo(
                list(reversed(snapshot)),
                "populacao_ibge_raw",
            )
            load.load_mongo(
                [
                    {"bairro": "Boa Viagem", "populacao": 11},
                    {"bairro": "Casa Amarela", "populacao": 20},
                ],
                "populacao_ibge_raw",
            )

        first_batch, repeated_batch, changed_batch = [
            call.args[0] for call in collection.bulk_write.call_args_list
        ]

        self.assertEqual(
            [operation["filter"] for operation in first_batch],
            [operation["filter"] for operation in repeated_batch],
        )
        self.assertNotEqual(
            [operation["filter"] for operation in first_batch],
            [operation["filter"] for operation in changed_batch],
        )
        self.assertTrue(
            all(
                operation["update"]["$setOnInsert"]["data_extracao"]
                == extracted_at
                for operation in first_batch
            )
        )
        manifest_ids = [
            call.args[0]["_id"]
            for call in manifests.update_one.call_args_list
        ]
        self.assertEqual(manifest_ids[0], manifest_ids[1])
        self.assertNotEqual(manifest_ids[0], manifest_ids[2])
        self.assertEqual(collection.insert_many.call_count, 0)
        self.assertEqual(manifests.update_one.call_count, 3)
