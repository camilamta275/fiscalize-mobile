import os
import uuid

import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import (
    assert_mfa_schema,
    challenge_row,
    critical_mfa_token,
    expire_challenge,
    login_with_mfa,
    recover_otp_code,
    register_account,
    request_login_challenge,
)

# Created by AI.
def device_identity():
    return {
        "deviceId": (
            f"api-tests-{os.getenv('FISCALIZE_TEST_DEVICE_ID', 'device')}-{uuid.uuid4()}"
        ),
        "deviceName": "API tests",
    }

# Created by AI.
def new_account(auth_security_data):
    """Cadastra uma conta sintética e devolve email e senha."""
    email = f"mfa-{uuid.uuid4()}@example.com"
    password = auth_security_data["valid_password"]
    register_account(email, password)
    return email, password

# Created by AI.
@pytest.fixture
def mfa_account(auth_security_data, database):
    """Conta autenticada por MFA real, pronta para ações críticas."""
    email, password = new_account(auth_security_data)
    session = login_with_mfa(database, email, password, f"mfa-{uuid.uuid4()}")
    return email, password, {"Authorization": f"Bearer {session['token']}"}

# Created by AI.
def test_login_requires_device_identifier(credentials):
    response = requests.post(
        endpoints.LOGIN,
        json={"email": credentials["email"], "senha": credentials["password"]},
    )

    assert response.status_code == 400
    assert "dispositivo" in response.json()["error"].lower()

# Created by AI.
# Updated by AI.
def test_login_new_device_returns_mfa_challenge(auth_security_data):
    email, password = new_account(auth_security_data)

    response = requests.post(
        endpoints.LOGIN,
        json={"email": email, "senha": password, **device_identity()},
    )
    assert_mfa_schema(response)

    assert response.status_code == 200
    data = response.json()
    assert data.get("mfaRequired") is True
    assert isinstance(data.get("challengeToken"), str)
    assert data.get("destination")

# Created by AI.
def test_login_otp_accepts_the_emailed_code(auth_security_data, database):
    """O código recuperado do hash é aceito pelo endpoint real e abre sessão."""
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)

    response = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": identity["deviceId"],
        },
    )

    assert response.status_code == 200, response.text
    session = response.json()
    assert session["email"] == email
    assert session["token"]
    assert session["refreshToken"]

    # O dispositivo passa a ser confiável: o próximo login dispensa o código.
    trusted_login = requests.post(
        endpoints.LOGIN,
        json={"email": email, "senha": password, **identity},
    )
    assert trusted_login.status_code == 200, trusted_login.text
    assert "token" in trusted_login.json()

# Created by AI.
def test_login_otp_rejects_wrong_code(auth_security_data, database):
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)
    wrong_code = "000000" if code != "000000" else "111111"

    response = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": wrong_code,
            "deviceId": identity["deviceId"],
        },
    )

    assert response.status_code == 401
    assert challenge_row(database, challenge_token)["attempts"] == 1

# Created by AI.
def test_login_otp_locks_challenge_after_five_wrong_attempts(auth_security_data, database):
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)
    wrong_code = "000000" if code != "000000" else "111111"

    for attempt in range(5):
        response = requests.post(
            endpoints.MFA_VERIFY,
            json={
                "challengeToken": challenge_token,
                "code": wrong_code,
                "deviceId": identity["deviceId"],
            },
        )
        assert response.status_code == 401, f"tentativa {attempt + 1}"

    # O desafio é descartado: nem o código correto abre sessão.
    locked = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": identity["deviceId"],
        },
    )
    assert locked.status_code == 401

# Created by AI.
def test_login_otp_is_single_use(auth_security_data, database):
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)

    first = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": identity["deviceId"],
        },
    )
    assert first.status_code == 200, first.text

    replay = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": identity["deviceId"],
        },
    )
    assert replay.status_code == 401

# Created by AI.
def test_login_otp_rejects_device_mismatch(auth_security_data, database):
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)

    response = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": "another-device",
        },
    )

    assert response.status_code == 400
    assert "dispositivo" in response.json()["error"].lower()

# Created by AI.
def test_login_otp_rejects_expired_challenge(auth_security_data, database):
    email, password = new_account(auth_security_data)
    identity = device_identity()
    challenge_token = request_login_challenge(email, password, identity["deviceId"])
    code = recover_otp_code(database, challenge_token)
    expire_challenge(database, challenge_token)

    response = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": identity["deviceId"],
        },
    )

    assert response.status_code == 401

# Created by AI.
def test_verify_otp_rejects_malformed_code():
    response = requests.post(
        endpoints.MFA_VERIFY,
        json={"challengeToken": "not-a-real-challenge", "code": "123"},
    )

    assert response.status_code == 400
    assert "6 dígitos" in response.json()["error"]

# Created by AI.
# Updated by AI.
def test_verify_otp_rejects_unknown_challenge():
    response = requests.post(
        endpoints.MFA_VERIFY,
        json={"challengeToken": "not-a-real-challenge", "code": "123456"},
    )
    assert_mfa_schema(response)

    assert response.status_code == 401

# Created by AI.
def test_request_critical_otp_requires_authentication():
    response = requests.post(
        endpoints.MFA_REQUEST_CRITICAL,
        json={"action": "password"},
    )

    assert response.status_code == 401

# Created by AI.
def test_request_critical_otp_rejects_invalid_action(authenticate_user):
    response = requests.post(
        endpoints.MFA_REQUEST_CRITICAL,
        headers={"Authorization": f"Bearer {authenticate_user}"},
        json={"action": "unsupported"},
    )

    assert response.status_code == 400
    assert "ação crítica" in response.json()["error"].lower()

# Created by AI.
def test_critical_action_requires_recent_verification(authenticate_user):
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers={"Authorization": f"Bearer {authenticate_user}"},
        json={
            "senhaAtual": "WrongCurrent1!",
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "NewStrong1!",
        },
    )

    assert response.status_code == 401
    assert "verificação adicional" in response.json()["error"].lower()

# Created by AI.
def test_critical_action_rejects_unknown_verification_token(authenticate_user):
    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers={"Authorization": f"Bearer {authenticate_user}"},
        json={
            "senhaAtual": "WrongCurrent1!",
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "NewStrong1!",
            "mfaToken": "not-a-real-verification",
        },
    )

    assert response.status_code == 401

# Created by AI.
def test_critical_verification_token_is_bound_to_action(mfa_account, database):
    """Um token emitido para troca de senha não autoriza a exclusão da conta."""
    _email, password, headers = mfa_account
    token = critical_mfa_token(database, headers, "password")

    response = requests.delete(
        endpoints.GET_USER,
        headers=headers,
        json={"senha": password, "mode": "delete", "mfaToken": token},
    )

    assert response.status_code == 401

# Created by AI.
def test_critical_verification_token_is_single_use(mfa_account, database):
    _email, old_password, headers = mfa_account
    token = critical_mfa_token(database, headers, "password")

    first = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": old_password,
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "NewStrong1!",
            "mfaToken": token,
        },
    )
    assert first.status_code == 204, first.text

    replay = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=headers,
        json={
            "senhaAtual": "NewStrong1!",
            "novaSenha": "Another1!",
            "confirmarNovaSenha": "Another1!",
            "mfaToken": token,
        },
    )
    assert replay.status_code == 401

# Created by AI.
def test_critical_verification_token_is_bound_to_user(mfa_account, auth_security_data, database):
    """O token de um titular não pode ser reutilizado por outra conta."""
    _email, _password, headers = mfa_account
    token = critical_mfa_token(database, headers, "password")

    other_email, other_password = new_account(auth_security_data)
    other_session = login_with_mfa(
        database, other_email, other_password, f"other-{uuid.uuid4()}"
    )
    other_headers = {"Authorization": f"Bearer {other_session['token']}"}

    response = requests.patch(
        endpoints.CHANGE_PASSWORD,
        headers=other_headers,
        json={
            "senhaAtual": other_password,
            "novaSenha": "NewStrong1!",
            "confirmarNovaSenha": "NewStrong1!",
            "mfaToken": token,
        },
    )

    assert response.status_code == 401
