# Created by AI.
"""Testes de API de PATCH /demands/:id/status (atualização de status pelo Gestor).

Cenários cobertos (plano em docs/PLANO-ATUALIZACAO-STATUS-GESTOR.md):
1. Gestor atualiza o status com o valor cru do enum (`status_id: "Em_Andamento"`)
   → 200 com rótulo de exibição no corpo, persistência confirmada por
   GET /demands/:id (status novo + evento "Status atualizado" no histórico).
2. Cidadão no mesmo endpoint → 403 (requireRole(['Gestor'])).
3. status_id inválido com token de Gestor → 400 "Status inválido.".
4. Sem token → 401.

Importante: o corpo usa os valores crus do enum do Prisma (com sublinhado) e a
resposta traz o rótulo de exibição já traduzido por displayStatus().
"""

import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import login_with_mfa

# Created by AI.
DEMAND_PAYLOAD = {
    "title": "Ocorrencia de status",
    "description": "Chamado sintetico criado pelo teste de atualizacao de status.",
    "category_id": 1,
    "location": "Rua Principal, 123, Recife - PE",
    "latitude": -8.05,
    "longitude": -34.9,
}

# Created by AI.
# Credenciais do seed do backend (backend/prisma/seed.ts). O Cidadao é dono da
# demanda criada; o Gestor é o único perfil liberado no PATCH de status.
SEED_CIDADAO = {"email": "cidadao@fiscalize.gov.br", "password": "Cidadao@123456"}
SEED_GESTOR = {"email": "gestor@fiscalize.gov.br", "password": "Gestor@123456"}


# Created by AI.
def status_path(demand_id):
    """Monta a URL de PATCH /demands/:id/status."""
    return f"{endpoints.DEMANDS}/{demand_id}/status"


# Created by AI.
def login_token(database, account, purpose):
    """Conclui o login (com MFA quando exigido) e devolve o access token."""
    session = login_with_mfa(database, account["email"], account["password"], purpose)
    return session["token"]


# Created by AI.
@pytest.fixture(scope="module")
def cidadao_token(database):
    """Token do Cidadao do seed, usado para criar a demanda de teste."""
    return login_token(database, SEED_CIDADAO, "status-owner")


# Created by AI.
@pytest.fixture(scope="module")
def gestor_token(database):
    """Token do Gestor do seed, único perfil autorizado no PATCH de status."""
    return login_token(database, SEED_GESTOR, "status-gestor")


# Created by AI.
@pytest.fixture(scope="module")
def demand_id(cidadao_token):
    """Cria uma demanda sintética como o Cidadao do seed."""
    headers = {"Authorization": f"Bearer {cidadao_token}"}
    created = requests.post(endpoints.DEMANDS, json=DEMAND_PAYLOAD, headers=headers)
    assert created.status_code == 201, created.text
    return created.json()["id"]


# Created by AI.
def test_gestor_updates_status(database, gestor_token, demand_id):
    """Gestor altera o status; a resposta traz o rótulo e o detalhe persiste."""
    headers = {"Authorization": f"Bearer {gestor_token}"}

    response = requests.patch(
        status_path(demand_id),
        json={"status_id": "Em_Andamento"},
        headers=headers,
    )
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["id"] == demand_id
    assert body["status"] == "Em Andamento"
    assert body["updatedAt"]

    detail = requests.get(f"{endpoints.DEMANDS}/{demand_id}", headers=headers)
    assert detail.status_code == 200, detail.text

    payload = detail.json()
    assert payload["status"] == "Em Andamento"
    assert any(
        log["tipo"] == "status" and "Status atualizado" in (log.get("titulo") or "")
        for log in payload["logs"]
    )


# Created by AI.
def test_cidadao_cannot_update_status(cidadao_token, demand_id):
    """requireRole(['Gestor']) rejeita o Cidadao — mesmo o dono do chamado."""
    headers = {"Authorization": f"Bearer {cidadao_token}"}

    response = requests.patch(
        status_path(demand_id),
        json={"status_id": "Em_Andamento"},
        headers=headers,
    )
    assert response.status_code == 403, response.text


# Created by AI.
def test_invalid_status_id_is_rejected(gestor_token, demand_id):
    """Valor fora do enum do Prisma é rejeitado com 400.

    O sublinhado no valor cru (`Em_An_lise`) e a ausência de acento são as
    particularidades do contrato; qualquer outra string cai no 400.
    """
    headers = {"Authorization": f"Bearer {gestor_token}"}

    response = requests.patch(
        status_path(demand_id),
        json={"status_id": "xyz"},
        headers=headers,
    )
    assert response.status_code == 400, response.text
    assert response.json()["error"] == "Status inválido."


# Created by AI.
def test_update_status_requires_authentication(demand_id):
    """Sem token, o endpoint é 401 antes de qualquer verificação de papel."""
    response = requests.patch(status_path(demand_id), json={"status_id": "Em_Andamento"})
    assert response.status_code == 401, response.text
