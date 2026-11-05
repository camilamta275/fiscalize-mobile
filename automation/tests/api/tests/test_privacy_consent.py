import uuid

import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import profile_fields


# Created by AI.
def test_register_rejects_missing_privacy_consent():
    response = requests.post(
        endpoints.REGISTER,
        json={
            "nome": "Sem Consentimento",
            "email": f"privacy-missing-{uuid.uuid4()}@example.com",
            "senha": "StrongPassword1!",
            **{key: value for key, value in profile_fields().items() if key != "privacyPolicyVersion"},
        },
    )

    assert response.status_code == 400, response.text
    assert "Política de Privacidade" in response.json()["error"]


# Created by AI.
def test_register_rejects_outdated_privacy_policy():
    response = requests.post(
        endpoints.REGISTER,
        json={
            "nome": "Versão Antiga",
            "email": f"privacy-outdated-{uuid.uuid4()}@example.com",
            "senha": "StrongPassword1!",
            **profile_fields(),
            "privacyPolicyVersion": "0.9",
        },
    )

    assert response.status_code == 400, response.text
    assert "Política de Privacidade" in response.json()["error"]


# Created by AI.
def test_register_persists_privacy_consent(database):
    email = f"privacy-valid-{uuid.uuid4()}@example.com"
    response = requests.post(
        endpoints.REGISTER,
        json={
            "nome": "Com Consentimento",
            "email": email,
            "senha": "StrongPassword1!",
            **profile_fields(),
        },
    )

    assert response.status_code == 201, response.text

    with database.cursor() as cursor:
        cursor.execute(
            """
            SELECT versao, origem, documento
            FROM consentimentos_privacidade
            JOIN usuario ON usuario.id = consentimentos_privacidade.usuario_id
            WHERE usuario.email = %s
            """,
            (email,),
        )
        consent = cursor.fetchone()

    assert consent == (
        endpoints.PRIVACY_POLICY_VERSION,
        "mobile",
        "POLITICA-DE-PRIVACIDADE.md",
    )
