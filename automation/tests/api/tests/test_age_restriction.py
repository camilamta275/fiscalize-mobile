from datetime import date, timedelta
import uuid

import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import profile_fields


# Created by AI.
def register_with_birth_date(birth_date):
    payload = {
        **profile_fields(),
        "nome": "Teste de Idade",
        "email": f"age-{uuid.uuid4()}@example.com",
        "senha": "StrongPassword1!",
        "dataNascimento": birth_date,
    }
    return requests.post(endpoints.REGISTER, json=payload)


# Created by AI.
def test_register_rejects_underage_user():
    today = date.today()
    birth_date = today.replace(year=today.year - 17).isoformat()
    response = register_with_birth_date(birth_date)

    assert response.status_code == 400, response.text
    assert "18 anos" in response.json()["error"]


# Created by AI.
def test_register_accepts_user_turning_eighteen_today():
    today = date.today()
    birth_date = today.replace(year=today.year - 18).isoformat()
    response = register_with_birth_date(birth_date)

    assert response.status_code == 201, response.text


# Created by AI.
def test_register_rejects_future_birth_date():
    birth_date = (date.today() + timedelta(days=1)).isoformat()
    response = register_with_birth_date(birth_date)

    assert response.status_code == 400, response.text
    assert "futuro" in response.json()["error"]


# Created by AI.
def test_register_rejects_invalid_birth_date():
    response = register_with_birth_date("2000-02-31")

    assert response.status_code == 400, response.text
    assert "Data de nascimento" in response.json()["error"]


# Created by AI.
def test_register_rejects_missing_birth_date():
    payload = {
        **profile_fields(),
        "nome": "Sem Data",
        "email": f"age-missing-{uuid.uuid4()}@example.com",
        "senha": "StrongPassword1!",
    }
    payload.pop("dataNascimento")
    response = requests.post(endpoints.REGISTER, json=payload)

    assert response.status_code == 400, response.text
    assert "data de nascimento" in response.json()["error"]
