import os

import requests
from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import login_trusted

# Created by AI.
def device_fields():
    return {
        "deviceId": os.getenv("FISCALIZE_TEST_DEVICE_ID", "api-tests-device"),
        "deviceName": "API tests",
    }

# Login de usuário - /auth/login
# Updated by AI.
def test_login_user(credentials, database):
    session = login_trusted(
        database,
        credentials["email"],
        credentials["password"],
        os.getenv("FISCALIZE_TEST_DEVICE_ID", "shared"),
    )
    assert "token" in session
    assert "refreshToken" in session
  
# --- Testes para casos de erro no login do usuário ---  
# Login de usuário com email inválido
# Updated by AI.
def test_login_user_invalid_email(credentials):
    login_data = {
        "email": "invalid_email@example.com",
        "senha": credentials["password"],
        **device_fields(),
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 401
    
# Login de usuário com senha inválida
# Updated by AI.
def test_login_user_invalid_password(credentials):
    login_data = {
        "email": credentials["email"],
        "senha": credentials["incorrect_password"],
        **device_fields(),
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 401
    
# Login de usuário com email vazio
def test_login_user_empty_email(credentials):
    login_data = {
        "email": "",
        "senha": credentials["password"]
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Login de usuário com senha vazia
def test_login_user_empty_password(credentials):
    login_data = {
        "email": credentials["email"],
        "senha": ""
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Login de usuário com email e senha vazios
def test_login_user_empty_email_and_password():
    login_data = {
        "email": "",
        "senha": ""
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)