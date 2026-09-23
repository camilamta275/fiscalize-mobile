import uuid
import json
import pytest
import requests
from pathlib import Path
from automation.tests.api.config.settings import Endpoints as endpoints

@pytest.fixture
def create_uuid():
    return str(uuid.uuid4())

@pytest.fixture
def credentials():
    """Carrega as credenciais do usuário de teste configurado."""
    credentials_path = Path(__file__).resolve().parents[2] / "data" / "credentials.json"
    with credentials_path.open(encoding="utf-8") as credentials_file:
        return json.load(credentials_file)["login"]

@pytest.fixture
def authenticate_user(credentials):
    """Faz login com as credenciais configuradas e retorna o token de autenticação."""
    login_data = {
        "email": credentials["email"],
        "senha": credentials["password"]
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    data = resp.json()
    return data["token"]