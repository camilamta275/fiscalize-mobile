import uuid
import json
import pytest
import requests
from pathlib import Path
from automation.tests.api.config.settings import Endpoints as endpoints

# Created by AI.
def profile_fields():
    """Retorna o perfil sintético base configurado no arquivo de dados."""
    credentials_path = Path(__file__).resolve().parents[2] / "data" / "credentials.json"
    with credentials_path.open(encoding="utf-8") as credentials_file:
        profile = json.load(credentials_file)["profile"]
    return {
        **profile,
        "cpf": str(uuid.uuid4().int)[:11],
    }

# Updated by AI.
@pytest.fixture
def create_uuid():
    return str(uuid.uuid4())

# Created by AI.
@pytest.fixture
def credentials_data():
    """Carrega uma única vez os dados compartilhados dos testes de API."""
    credentials_path = Path(__file__).resolve().parents[2] / "data" / "credentials.json"
    with credentials_path.open(encoding="utf-8") as credentials_file:
        return json.load(credentials_file)

# Updated by AI.
@pytest.fixture
def credentials(credentials_data):
    """Retorna as credenciais do usuário de teste configurado."""
    return credentials_data["login"]

# Created by AI.
# Updated by AI.
@pytest.fixture
def auth_security_data(credentials_data):
    """Retorna os dados sintéticos dos testes de segurança de autenticação."""
    return credentials_data["auth_security"]

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