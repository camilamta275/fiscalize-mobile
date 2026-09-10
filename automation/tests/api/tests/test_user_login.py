import requests
from automation.tests.api.config.settings import Endpoints as endpoints

# Login de usuário - /auth/login
def test_login_user(register_user):
    email = register_user["email"]
    senha = register_user["senha"]
    login_data = {
        "email": email,
        "senha": senha
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
  
# --- Testes para casos de erro no login do usuário ---  
# Login de usuário com email inválido
def test_login_user_invalid_email(register_user):
    senha = register_user["senha"]
    login_data = {
        "email": "invalid_email@example.com",
        "senha": senha
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 401
    
# Login de usuário com senha inválida
def test_login_user_invalid_password(register_user):
    email = register_user["email"]
    login_data = {
        "email": email,
        "senha": "invalid_password"
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 401
    
# Login de usuário com email vazio
def test_login_user_empty_email(register_user):
    senha = register_user["senha"]
    login_data = {
        "email": "",
        "senha": senha
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Login de usuário com senha vazia
def test_login_user_empty_password(register_user):
    email = register_user["email"]
    login_data = {
        "email": email,
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