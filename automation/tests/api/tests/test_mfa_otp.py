import os
import uuid

import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import assert_mfa_schema

# Created by AI.
def device_identity():
    return {
        "deviceId": (
            f"api-tests-{os.getenv('FISCALIZE_TEST_DEVICE_ID', 'device')}-{uuid.uuid4()}"
        ),
        "deviceName": "API tests",
    }

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
def test_login_new_device_returns_mfa_challenge_or_session(credentials):
    response = requests.post(
        endpoints.LOGIN,
        json={
            "email": credentials["email"],
            "senha": credentials["password"],
            **device_identity(),
        },
    )
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip("Cooldown de OTP ativo; aguarde 60 segundos para repetir.")

    assert response.status_code == 200
    data = response.json()
    assert ("token" in data and "refreshToken" in data) or (
        data.get("mfaRequired") is True
        and isinstance(data.get("challengeToken"), str)
        and data.get("destination")
    )

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
