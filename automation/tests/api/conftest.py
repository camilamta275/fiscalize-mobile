import uuid
import pytest
import requests
import os

@pytest.fixture
def api_base_url():
    return os.environ.get("API_BASE_URL", "http://localhost:3000")

@pytest.fixture
def create_uuid():
    return str(uuid.uuid4())

@pytest.fixture
def register_user(api_base_url, create_uuid):
    """Registra um usuário novo e devolve as credenciais, prontas para login."""
    name = create_uuid
    password = create_uuid
    credentials = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=credentials)
    assert resp.status_code == 201
    return credentials

@pytest.fixture
def authenticate_user(api_base_url, register_user):
    """Faz login com as credenciais fornecidas e retorna o token de autenticação."""
    login_data = {
        "email": register_user["email"],
        "senha": register_user["senha"]
    }
    resp = requests.post(f"{api_base_url}/auth/login", json=login_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    return data["token"]