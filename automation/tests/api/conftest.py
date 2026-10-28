import json
import os
import uuid
import pytest
import requests
from pathlib import Path
from automation.tests.api.config.settings import Endpoints as endpoints

# Created by AI.
@pytest.fixture(scope="session", autouse=True)
def require_api():
    """Skip API tests when the local backend is not running."""
    try:
        response = requests.get(endpoints.HEALTH, timeout=2)
    except requests.RequestException as error:
        pytest.skip(
            f"API indisponível em {endpoints.BASE_URL}. "
            "Inicie o backend antes de executar os testes. "
            f"Detalhe: {error}"
        )

    if response.status_code >= 500:
        pytest.skip(
            f"API indisponível em {endpoints.BASE_URL}: "
            f"health retornou HTTP {response.status_code}."
        )

# Updated by AI.
def assert_mfa_schema(response):
    """Skip integration tests when the MFA migration is not applied."""
    if response.status_code == 500 and '"code":"P2021"' in response.text:
        pytest.skip(
            "Schema MFA ausente. Execute `cd backend && npx prisma migrate deploy` "
            "antes dos testes de API."
        )

# Created by AI.
def login_payload(email, password, purpose):
    return {
        "email": email,
        "senha": password,
        "deviceId": f"api-tests-{purpose}-{uuid.uuid4()}",
        "deviceName": "API tests",
    }

# Created by AI.
# Updated by AI.
def require_session(response):
    """Return an access token or skip when interactive MFA is required."""
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip(
            "Login bloqueado pelo cooldown de OTP. Aguarde 60 segundos "
            "antes de repetir o cenário."
        )
    data = response.json()
    if data.get("mfaRequired"):
        pytest.skip(
            "Login exigiu OTP. Defina FISCALIZE_TEST_TOKEN ou conclua o MFA "
            "manualmente antes deste cenário."
        )
    response.raise_for_status()
    return data["token"]

# Created by AI.
def profile_fields():
    """Retorna o perfil sintético base configurado no arquivo de dados."""
    credentials_path = Path(__file__).resolve().parents[2] / "data" / "credentials.json"
    with credentials_path.open(encoding="utf-8") as credentials_file:
        profile = json.load(credentials_file)["profile"]
    return {
        **profile,
        "cpf": str(uuid.uuid4().int)[:11],
    }

# Updated by AI.
@pytest.fixture
def create_uuid():
    return str(uuid.uuid4())

# Created by AI.
@pytest.fixture
def credentials_data():
    """Carrega uma única vez os dados compartilhados dos testes de API."""
    credentials_path = Path(__file__).resolve().parents[2] / "data" / "credentials.json"
    with credentials_path.open(encoding="utf-8") as credentials_file:
        return json.load(credentials_file)

# Updated by AI.
@pytest.fixture
def credentials(credentials_data):
    """Retorna as credenciais do usuário de teste configurado."""
    return credentials_data["login"]

# Created by AI.
# Updated by AI.
@pytest.fixture
def auth_security_data(credentials_data):
    """Retorna os dados sintéticos dos testes de segurança de autenticação."""
    return credentials_data["auth_security"]

# Updated by AI.
@pytest.fixture
def authenticate_user(credentials):
    """Faz login com as credenciais configuradas e retorna o token de autenticação."""
    configured_token = os.getenv("FISCALIZE_TEST_TOKEN")
    if configured_token:
        return configured_token

    response = requests.post(
        endpoints.LOGIN,
        json=login_payload(
            credentials["email"],
            credentials["password"],
            os.getenv("FISCALIZE_TEST_DEVICE_ID", "shared"),
        ),
    )
    return require_session(response)
