from pathlib import Path

from dotenv import dotenv_values


# Created by AI.
BASE_DIR = Path(__file__).resolve().parent.parent
_ENV = dotenv_values(BASE_DIR / ".env")


# Created by AI.
def _required_setting(name: str) -> str:
    value = _ENV.get(name)
    if not value:
        raise RuntimeError(
            f"A variável {name} não foi encontrada em {BASE_DIR / '.env'}."
        )
    return value


# Created by AI.
MONGODB_URI = _required_setting("MONGODB_URI")

# Created by AI.
DATABASE_URL = _required_setting("DATABASE_URL")

# Created by AI.
MONGO_DATABASE = _ENV.get("MONGO_DATABASE", "FISCALIZE_ETL")

# Created by AI.
SQLITE_DATABASE = BASE_DIR / _ENV.get(
    "SQLITE_DATABASE",
    "fiscalize_etl.db",
)

# Created by AI.
CHAMADOS_PATH = BASE_DIR / "data" / "chamados.json"
