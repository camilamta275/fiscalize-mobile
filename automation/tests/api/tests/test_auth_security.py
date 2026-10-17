import uuid
import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints

# Created by AI.
@pytest.fixture(scope="module", autouse=True)
def api_is_available():
    try:
        response = requests.get(endpoints.HEALTH, timeout=3)
    except requests.RequestException:
        pytest.skip("Backend API indisponível em localhost:3000.")

    if response.status_code not in (200, 503):
        pytest.skip(f"Backend API indisponível: HTTP {response.status_code}.")


# Created by AI.
def test_register_rejects_password_outside_policy(auth_security_data):
    # Cadastro com senhas que não atendem à política de segurança
    for password_case in auth_security_data["invalid_password_cases"]:
        user_data = {
            "nome": f"Usuário {uuid.uuid4()}",
            "email": f"security-{uuid.uuid4()}@example.com",
            "senha": password_case["password"],
        }
        response = requests.post(endpoints.REGISTER, json=user_data)

        assert response.status_code == 400
        assert "8 caracteres" in response.json()["error"]


# Created by AI.
def test_login_locks_account_after_five_consecutive_failures(credentials, auth_security_data):
    # Cadastro de uma conta temporária para testar o bloqueio
    email = f"security-{uuid.uuid4()}@example.com"
    registration = requests.post(
        endpoints.REGISTER,
        json={
            "nome": f"Usuário {uuid.uuid4()}",
            "email": email,
            "senha": auth_security_data["valid_password"],
        },
    )
    assert registration.status_code == 201, registration.text

    # Quatro tentativas inválidas ainda retornam credenciais inválidas
    for _ in range(auth_security_data["lockout_attempts"] - 1):
        response = requests.post(endpoints.LOGIN, json={
            "email": email,
            "senha": credentials["incorrect_password"],
        })
        assert response.status_code == 401, response.text

    # A quinta tentativa bloqueia temporariamente a conta
    fifth_attempt = requests.post(endpoints.LOGIN, json={
        "email": email,
        "senha": credentials["incorrect_password"],
    })
    assert fifth_attempt.status_code == 423
    assert "bloqueada" in fifth_attempt.json()["error"].lower()

    # Mesmo a senha correta não permite login durante o bloqueio
    valid_password_while_locked = requests.post(endpoints.LOGIN, json={
        "email": email,
        "senha": auth_security_data["valid_password"],
    })
    assert valid_password_while_locked.status_code == 423


# Created by AI.
def test_refresh_token_rotates_and_rejects_reuse(auth_security_data):
    # Login retorna um refresh token e a primeira renovação emite outro token.
    email = f"refresh-{uuid.uuid4()}@example.com"
    registration = requests.post(
        endpoints.REGISTER,
        json={
            "nome": f"Usuário {uuid.uuid4()}",
            "email": email,
            "senha": auth_security_data["valid_password"],
        },
    )
    assert registration.status_code == 201, registration.text

    login_response = requests.post(
        endpoints.LOGIN,
        json={
            "email": email,
            "senha": auth_security_data["valid_password"],
        },
    )
    assert login_response.status_code == 200, login_response.text
    first_refresh_token = login_response.json()["refreshToken"]

    first_refresh_response = requests.post(
        f"{endpoints.BASE_URL}/auth/refresh",
        json={"refreshToken": first_refresh_token},
    )
    assert first_refresh_response.status_code == 200, first_refresh_response.text
    second_refresh_token = first_refresh_response.json()["refreshToken"]
    assert second_refresh_token != first_refresh_token

    # O token anterior é one-time-use e não pode ser reutilizado.
    reused_token_response = requests.post(
        f"{endpoints.BASE_URL}/auth/refresh",
        json={"refreshToken": first_refresh_token},
    )
    assert reused_token_response.status_code == 401, reused_token_response.text

    # A reutilização revoga a sessão; o token sucessor também deixa de funcionar.
    revoked_successor_response = requests.post(
        f"{endpoints.BASE_URL}/auth/refresh",
        json={"refreshToken": second_refresh_token},
    )
    assert revoked_successor_response.status_code == 401, revoked_successor_response.text
