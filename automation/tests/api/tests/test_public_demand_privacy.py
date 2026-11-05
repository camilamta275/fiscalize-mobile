import requests

from automation.tests.api.config.settings import Endpoints as endpoints


# Created by AI.
def test_public_demands_are_anonymous():
    response = requests.get(f"{endpoints.BASE_URL}/demands/public")

    assert response.status_code == 200, response.text
    payload = response.json()
    assert set(payload) == {"data", "total", "page", "limit", "totalPages"}

    allowed_fields = {
        "id",
        "protocolo",
        "title",
        "description",
        "status",
        "category",
        "photoUrl",
        "latitude",
        "longitude",
        "createdAt",
    }
    forbidden_fields = {
        "creator",
        "nome",
        "email",
        "cpf",
        "telefone",
        "usuario",
        "cidadao",
        "location",
        "endereco",
    }

    for demand in payload["data"]:
        assert set(demand).issubset(allowed_fields)
        assert forbidden_fields.isdisjoint(demand)
        assert {"description", "photoUrl", "latitude", "longitude"}.issubset(demand)
