import requests
from automation.tests.api.config.settings import Endpoints as endpoints

# Login de usuário - /auth/login
def test_login_user(credentials):
    login_data = {
        "email": credentials["email"],
        "senha": credentials["password"]
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
  
# --- Testes para casos de erro no login do usuário ---  
# Login de usuário com email inválido
def test_login_user_invalid_email(credentials):
    login_data = {
        "email": "invalid_email@example.com",
        "senha": credentials["password"]
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 401
    
# Login de usuário com senha inválida
def test_login_user_invalid_password(credentials):
    login_data = {
        "email": credentials["email"],
        "senha": credentials["incorrect_password"]
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