import uuid
import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import (
    critical_mfa_token,
    login_payload,
    login_with_mfa,
    profile_fields,
    register_account,
    require_session,
)

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
            **profile_fields(),
        }
        response = requests.post(endpoints.REGISTER, json=user_data)

        assert response.status_code == 400
        assert "8 caracteres" in response.json()["error"]


# Created by AI.
# Updated by AI.
def test_login_locks_account_after_five_consecutive_failures(credentials, auth_security_data):
    # Cadastro de uma conta temporária para testar o bloqueio
    email = f"security-{uuid.uuid4()}@example.com"
    registration = requests.post(
        endpoints.REGISTER,
        json={
            "nome": f"Usuário {uuid.uuid4()}",
            "email": email,
            "senha": auth_security_data["valid_password"],
            **profile_fields(),
        },
    )
    assert registration.status_code == 201, registration.text

    # Quatro tentativas inválidas ainda retornam credenciais inválidas
    for _ in range(auth_security_data["lockout_attempts"] - 1):
        response = requests.post(endpoints.LOGIN, json={
            "email": email,
            "senha": credentials["incorrect_password"],
            "deviceId": f"lockout-{email}",
            "deviceName": "API tests",
        })
        assert response.status_code == 401, response.text

    # A quinta tentativa bloqueia temporariamente a conta
    fifth_attempt = requests.post(endpoints.LOGIN, json={
        "email": email,
        "senha": credentials["incorrect_password"],
        "deviceId": f"lockout-{email}",
        "deviceName": "API tests",
    })
    assert fifth_attempt.status_code == 423
    assert "bloqueada" in fifth_attempt.json()["error"].lower()

    # Mesmo a senha correta não permite login durante o bloqueio
    valid_password_while_locked = requests.post(endpoints.LOGIN, json={
        "email": email,
        "senha": auth_security_data["valid_password"],
        "deviceId": f"lockout-{email}",
        "deviceName": "API tests",
    })
    assert valid_password_while_locked.status_code == 423


# Created by AI.
# Updated by AI.
def test_refresh_token_rotates_and_rejects_reuse(auth_security_data, database):
    # Login retorna um refresh token e a primeira renovação emite outro token.
    email = f"refresh-{uuid.uuid4()}@example.com"
    register_account(email, auth_security_data["valid_password"])

    session = login_with_mfa(database, email, auth_security_data["valid_password"], "refresh")
    first_refresh_token = session["refreshToken"]

    first_refresh_response = requests.post(
        endpoints.REFRESH,
        json={"refreshToken": first_refresh_token},
    )
    assert first_refresh_response.status_code == 200, first_refresh_response.text
    second_refresh_token = first_refresh_response.json()["refreshToken"]
    assert second_refresh_token != first_refresh_token

    # O token anterior é one-time-use e não pode ser reutilizado.
    reused_token_response = requests.post(
        endpoints.REFRESH,
        json={"refreshToken": first_refresh_token},
    )
    assert reused_token_response.status_code == 401, reused_token_response.text

    # A reutilização revoga a sessão; o token sucessor também deixa de funcionar.
    revoked_successor_response = requests.post(
        endpoints.REFRESH,
        json={"refreshToken": second_refresh_token},
    )
    assert revoked_successor_response.status_code == 401, revoked_successor_response.text


# Created by AI.
# Updated by AI.
@pytest.fixture
def rights_portal_auth(auth_security_data, database):
    """Cria uma conta temporária autenticada para cada teste do portal."""
    password = auth_security_data["valid_password"]
    email = f"rights-{uuid.uuid4()}@example.com"
    register_account(email, password)

    session = login_with_mfa(database, email, password, "rights")
    headers = {"Authorization": f"Bearer {session['token']}"}
    return email, password, headers

# Created by AI.
def test_rights_portal_reads_profile(rights_portal_auth):
    # O titular consulta os dados pessoais armazenados.
    email, _password, headers = rights_portal_auth
    profile_response = requests.get(endpoints.GET_USER, headers=headers)
    assert profile_response.status_code == 200, profile_response.text
    assert profile_response.json()["email"] == email

# Created by AI.
# Updated by AI.
def test_rights_portal_updates_profile(rights_portal_auth):
    # O titular corrige os dados cadastrados no próprio perfil.
    email, _password, headers = rights_portal_auth
    cpf = str(uuid.uuid4().int)[:11]
    update_response = requests.put(
        endpoints.GET_USER,
        headers=headers,
        json={
            "nome": "Titular Atualizado",
            "email": email,
            **profile_fields(),
        },
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["nome"] == "Titular Atualizado"

    persisted_profile_response = requests.get(endpoints.GET_USER, headers=headers)
    assert persisted_profile_response.status_code == 200, persisted_profile_response.text
    assert persisted_profile_response.json()["nome"] == "Titular Atualizado"

# Created by AI.
# Updated by AI.
def test_rights_portal_exports_personal_data(rights_portal_auth, database):
    # O titular exporta seus dados em formato estruturado sem expor a senha.
    email, _password, headers = rights_portal_auth
    mfa_token = critical_mfa_token(database, headers, "export")
    export_response = requests.post(
        endpoints.EXPORT_USER, headers=headers, json={"mfaToken": mfa_token}
    )
    assert export_response.status_code == 200, export_response.text
    assert export_response.json()["data"]["email"] == email
    assert "senha" not in export_response.json()["data"]

# Created by AI.
# Updated by AI.
def test_rights_portal_anonymizes_personal_data(rights_portal_auth, database):
    # O titular ativa e desativa a preferência de anonimização sem excluir a conta.
    _email, password, headers = rights_portal_auth
    anonymize_token = critical_mfa_token(database, headers, "anonymization")
    anonymize_response = requests.patch(
        endpoints.ANONYMIZATION,
        headers=headers,
        json={"enabled": True, "senha": password, "mfaToken": anonymize_token},
    )
    assert anonymize_response.status_code == 204, anonymize_response.text

    disable_token = critical_mfa_token(database, headers, "anonymization")
    disable_response = requests.patch(
        endpoints.ANONYMIZATION,
        headers=headers,
        json={"enabled": False, "mfaToken": disable_token},
    )
    assert disable_response.status_code == 204, disable_response.text
    assert requests.get(endpoints.GET_USER, headers=headers).status_code == 200


# Created by AI.
# Updated by AI.
def test_user_can_change_password(rights_portal_auth, database):
    # O titular altera a senha e consegue autenticar com a nova credencial.
    email, old_password, headers = rights_portal_auth
    new_password = "NewStrong1!"
    mfa_token = critical_mfa_token(database, headers, "password")
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": old_password,
            "novaSenha": new_password,
            "confirmarNovaSenha": new_password,
            "mfaToken": mfa_token,
        },
    )
    assert response.status_code == 204, response.text

    old_login = requests.post(
        endpoints.LOGIN,
        json=login_payload(email, old_password, "rights"),
    )
    assert old_login.status_code == 401, old_login.text
    new_login = requests.post(
        endpoints.LOGIN,
        json=login_payload(email, new_password, "rights"),
    )
    assert new_login.status_code == 200, new_login.text


# Created by AI.
# Updated by AI.
def test_change_password_rejects_invalid_current_password(rights_portal_auth, database):
    _email, old_password, headers = rights_portal_auth
    mfa_token = critical_mfa_token(database, headers, "password")
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": "WrongCurrent1!",
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "NewStrong1!",
            "mfaToken": mfa_token,
        },
    )
    assert response.status_code == 401, response.text
    assert old_password != "WrongCurrent1!"

# Created by AI.
# Updated by AI.
def test_change_password_rejects_mismatched_confirmation(rights_portal_auth, database):
    _email, old_password, headers = rights_portal_auth
    mfa_token = critical_mfa_token(database, headers, "password")
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": old_password,
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "Different1!",
            "mfaToken": mfa_token,
        },
    )
    assert response.status_code == 400, response.text


# Created by AI.
# Updated by AI.
def test_change_password_rejects_weak_new_password(rights_portal_auth, database):
    _email, old_password, headers = rights_portal_auth
    mfa_token = critical_mfa_token(database, headers, "password")
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": old_password,
            "novaSenha": "weak",
            "confirmarNovaSenha": "weak",
            "mfaToken": mfa_token,
        },
    )
    assert response.status_code == 400, response.text
    assert "8 caracteres" in response.json()["error"]


# Created by AI.
# Updated by AI.
def test_rights_portal_deletes_account(rights_portal_auth, database):
    # O titular solicita a exclusão permanente da própria conta.
    _email, password, headers = rights_portal_auth
    mfa_token = critical_mfa_token(database, headers, "delete")
    delete_response = requests.delete(
        endpoints.GET_USER,
        headers=headers,
        json={"senha": password, "mode": "delete", "mfaToken": mfa_token},
    )
    assert delete_response.status_code == 204, delete_response.text

    # O token deixa de acessar dados depois da exclusão da conta.
    profile_response = requests.get(endpoints.GET_USER, headers=headers)
    assert profile_response.status_code == 401, profile_response.text
