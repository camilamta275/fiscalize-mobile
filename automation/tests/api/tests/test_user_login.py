import os
import uuid

import pytest
import requests
from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import assert_mfa_schema

# Created by AI.
def device_fields():
    return {
        "deviceId": os.getenv("FISCALIZE_TEST_DEVICE_ID", "api-tests-device"),
        "deviceName": "API tests",
    }

# Login de usuário - /auth/login
# Updated by AI.
# Updated by AI.
# Updated by AI.
def test_login_user(credentials):
    device = device_fields()
    device["deviceId"] = f"{device['deviceId']}-{uuid.uuid4()}"
    login_data = {
        "email": credentials["email"],
        "senha": credentials["password"],
        **device,
    }
    resp = requests.post(endpoints.LOGIN, json=login_data)
    assert_mfa_schema(resp)
    if resp.status_code == 429:
        pytest.skip("Cooldown de OTP ativo; aguarde 60 segundos para repetir.")
    assert resp.status_code == 200
    data = resp.json()
    assert ("token" in data) or data.get("mfaRequired") is True
  
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