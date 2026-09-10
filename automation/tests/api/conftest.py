import uuid
import pytest
import requests
from automation.tests.api.config.settings import Endpoints as endpoints

@pytest.fixture
def create_uuid():
    return str(uuid.uuid4())

@pytest.fixture
def register_user(create_uuid):
    """Registra um usuário novo e devolve as credenciais, prontas para login."""
    name = create_uuid
    password = create_uuid
    credentials = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": f"{password}"
    }
    requests.post(endpoints.REGISTER, json=credentials)
    return credentials

@pytest.fixture
def authenticate_user(register_user):
    """Faz login com as credenciais fornecidas e retorna o token de autenticação."""
    login_data = {
        "email": register_user["email"],
        "senha": register_user["senha"]
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    data = resp.json()
    return data["token"]