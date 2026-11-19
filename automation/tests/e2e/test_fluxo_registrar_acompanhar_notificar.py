# Created by AI.
"""E2E do fluxo completo: registrar a denúncia, acompanhar o status e verificar a notificação.

O app roda num emulador/dispositivo Android, integrado ao backend REAL (mesmo
backend usado pela suíte de API). O Maestro conduz o app e este teste orquestra
as duas partes do fluxo:

1. fluxo-1-registrar-chamado.yaml  -> cidadão registra a ocorrência pelo app.
2. (aqui, via API) o Gestor muda o status do chamado para "Em Andamento", como
   no mundo real, onde o gestor atua em outra interface.
3. fluxo-2-acompanhar-notificar.yaml -> cidadão vê o novo status na lista,
   NÃO vê a ação exclusiva do Gestor (negativo) e recebe a notificação.

Execução local (emulador ligado, app instalado, backend com seed):
    cd automation
    python -m pytest tests/e2e -o addopts="" -v

Sem Maestro/adb/dispositivo o teste é IGNORADO (skip), para não quebrar a suíte
de regressão comum. Na pipeline de E2E, E2E_OBRIGATORIO=1 transforma esse skip
em falha, evitando um "verde" sem execução.
"""

import os
import shutil
import subprocess
import uuid
from pathlib import Path

import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints
from automation.tests.api.conftest import database, login_with_mfa  # noqa: F401

REPO_ROOT = Path(__file__).resolve().parents[3]
FLUXO_DIR = REPO_ROOT / "automation" / "tests" / "e2e" / "fluxo"

# Credenciais do seed (backend/prisma/seed.ts), as mesmas da suíte de API.
CIDADAO = {"email": "cidadao@fiscalize.gov.br", "password": "Cidadao@123456"}
GESTOR = {"email": "gestor@fiscalize.gov.br", "password": "Gestor@123456"}

STATUS_API = "Em_Andamento"
STATUS_EXIBIDO = "Em Andamento"


# Created by AI.
def _comando_maestro():
    """Comando do Maestro conforme o sistema operacional, ou None se ausente."""
    base = ["cmd.exe", "/c", "maestro"] if os.name == "nt" else ["maestro"]
    if shutil.which("maestro") is None:
        return None
    return base


# Created by AI.
def _dispositivo_conectado():
    """True quando há ao menos um emulador/dispositivo Android conectado."""
    if shutil.which("adb") is None:
        return False
    saida = subprocess.run(["adb", "devices"], capture_output=True, text=True, check=False).stdout
    return any(linha.endswith("\tdevice") for linha in saida.splitlines())


# Created by AI.
@pytest.fixture(scope="module")
def maestro():
    """Garante o ambiente E2E (Maestro + dispositivo); ignora ou falha conforme E2E_OBRIGATORIO."""
    comando = _comando_maestro()
    faltando = None
    if comando is None:
        faltando = "Maestro CLI não encontrado no PATH."
    elif not _dispositivo_conectado():
        faltando = "Nenhum emulador/dispositivo Android conectado (adb devices)."

    if faltando:
        if os.getenv("E2E_OBRIGATORIO") == "1":
            pytest.fail(faltando)
        pytest.skip(faltando)
    return comando


# Created by AI.
def _rodar_fluxo(comando, arquivo, variaveis):
    """Executa um fluxo Maestro injetando variáveis; falha com a saída do Maestro."""
    argumentos = list(comando) + ["test"]
    for nome, valor in variaveis.items():
        argumentos += ["-e", f"{nome}={valor}"]
    argumentos.append(str(FLUXO_DIR / arquivo))

    resultado = subprocess.run(argumentos, capture_output=True, text=True, check=False, timeout=900)
    saida = f"{resultado.stdout}\n{resultado.stderr}"
    assert resultado.returncode == 0, f"Fluxo {arquivo} falhou:\n{saida[-4000:]}"


# Created by AI.
def _localizar_chamado(token, titulo):
    """Procura, entre os chamados do próprio cidadão, o que tem o título informado."""
    resposta = requests.get(endpoints.DEMANDS, headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    itens = corpo if isinstance(corpo, list) else corpo.get("data") or corpo.get("items") or []
    for item in itens:
        if item.get("title") == titulo or item.get("titulo") == titulo:
            return item["id"]
    pytest.fail(f"Chamado '{titulo}' não encontrado na API após o registro pelo app.")


# Created by AI.
def test_registrar_acompanhar_e_notificar(maestro, database):  # noqa: F811
    """Fluxo completo: registro pelo app, mudança de status pelo Gestor e notificação ao cidadão."""
    titulo = f"E2E fluxo {uuid.uuid4().hex[:8]}"
    variaveis = {
        "FLUXO_EMAIL": CIDADAO["email"],
        "FLUXO_SENHA": CIDADAO["password"],
        "FLUXO_TITULO": titulo,
        "FLUXO_STATUS_ESPERADO": STATUS_EXIBIDO,
    }

    # 1) REGISTRAR pelo app
    _rodar_fluxo(maestro, "fluxo-1-registrar-chamado.yaml", variaveis)

    # 2) O Gestor muda o status (API real); gera a notificação ao cidadão
    token_cidadao = login_with_mfa(database, CIDADAO["email"], CIDADAO["password"], "e2e-cidadao")["token"]
    token_gestor = login_with_mfa(database, GESTOR["email"], GESTOR["password"], "e2e-gestor")["token"]
    chamado_id = _localizar_chamado(token_cidadao, titulo)

    atualizacao = requests.patch(
        f"{endpoints.DEMANDS}/{chamado_id}/status",
        json={"status_id": STATUS_API},
        headers={"Authorization": f"Bearer {token_gestor}"},
    )
    assert atualizacao.status_code == 200, atualizacao.text

    # 3) ACOMPANHAR e NOTIFICAR pelo app (inclui o negativo de permissão)
    _rodar_fluxo(maestro, "fluxo-2-acompanhar-notificar.yaml", variaveis)


# Created by AI.
def test_cidadao_nao_atualiza_status_via_api(database):  # noqa: F811
    """Negativo de apoio: o mesmo bloqueio visto na interface vale no backend (403)."""
    token = login_with_mfa(database, CIDADAO["email"], CIDADAO["password"], "e2e-neg-cidadao")["token"]
    resposta = requests.patch(
        f"{endpoints.DEMANDS}/00000000-0000-0000-0000-000000000000/status",
        json={"status_id": STATUS_API},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 403, resposta.text
