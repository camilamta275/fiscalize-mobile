import hashlib
import json
import os
import uuid
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg
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
# Updated by AI.
def device_id_for(purpose):
    """Identificador estável de dispositivo por cenário de teste."""
    suffix = os.getenv("FISCALIZE_TEST_DEVICE_ID", "default")
    return f"api-tests-{purpose}-{suffix}"

# Created by AI.
# Updated by AI.
def login_payload(email, password, purpose):
    """Monta o payload de login com um dispositivo estável por cenário."""
    return {
        "email": email,
        "senha": password,
        "deviceId": device_id_for(purpose),
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
            "Login exigiu OTP para este dispositivo. Confie o dispositivo no "
            "banco (fixture `database`) ou defina FISCALIZE_TEST_TOKEN."
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

# Created by AI.
def _sanitize_database_url(url):
    """Remove parâmetros exclusivos do Prisma (ex.: schema) antes de conectar."""
    parts = urlsplit(url)
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key != "schema"
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

# Created by AI.
def _database_url():
    """Resolve a URL do PostgreSQL a partir do ambiente ou de backend/.env."""
    configured = os.getenv("FISCALIZE_DATABASE_URL")
    if configured:
        return _sanitize_database_url(configured)

    env_path = Path(__file__).resolve().parents[3] / "backend" / ".env"
    if not env_path.exists():
        pytest.skip(
            "backend/.env não encontrado. Defina FISCALIZE_DATABASE_URL para "
            "pré-confiar dispositivos nos testes de API."
        )

    for line in env_path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "DATABASE_URL":
            return _sanitize_database_url(value.strip().strip('"').strip("'"))

    pytest.skip("DATABASE_URL não encontrada em backend/.env.")

# Created by AI.
@pytest.fixture(scope="session")
def database():
    """Conexão direta ao PostgreSQL usada para preparar as pré-condições de MFA."""
    try:
        connection = psycopg.connect(_database_url(), connect_timeout=5)
    except psycopg.Error as error:
        pytest.skip(f"Banco indisponível para preparar dispositivos confiáveis: {error}")

    with connection:
        yield connection

# Created by AI.
def hash_device_id(device_id):
    """Reproduz o hash SHA-256 que o backend aplica ao identificador do dispositivo."""
    return hashlib.sha256(device_id.strip().encode("utf-8")).hexdigest()

# Created by AI.
def trust_device(connection, email, device_id):
    """Pré-confia o dispositivo para que o login dispense o código por e-mail."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO usuario_dispositivos (usuario_id, device_hash, device_name, trusted)
            SELECT id, %s, %s, true FROM usuario WHERE email = %s
            ON CONFLICT (usuario_id, device_hash)
            DO UPDATE SET trusted = true, last_used_at = now()
            """,
            (hash_device_id(device_id), "API tests", email),
        )
        affected = cursor.rowcount
    connection.commit()

    if affected == 0:
        pytest.skip(
            f"Usuário {email} não encontrado no banco para pré-confiar o dispositivo."
        )

# Created by AI.
def register_account(email, password, name="Titular de Teste"):
    """Cadastra uma conta sintética e devolve a resposta da API."""
    response = requests.post(
        endpoints.REGISTER,
        json={
            "nome": name,
            "email": email,
            "senha": password,
            **profile_fields(),
        },
    )
    assert response.status_code == 201, response.text
    return response

# Created by AI.
def login_trusted(connection, email, password, purpose):
    """Autentica a partir de um dispositivo já confiado e devolve a resposta JSON."""
    trust_device(connection, email, device_id_for(purpose))
    response = requests.post(endpoints.LOGIN, json=login_payload(email, password, purpose))
    require_session(response)
    return response.json()

# Created by AI.
def complete_mfa_challenge(connection, challenge_token):
    """Marca o desafio como verificado, como se o usuário tivesse digitado o código."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE otp_challenges
            SET verified_at = now()
            WHERE challenge_hash = %s AND consumed_at IS NULL
            """,
            (hashlib.sha256(challenge_token.encode("utf-8")).hexdigest(),),
        )
        affected = cursor.rowcount
    connection.commit()

    if affected != 1:
        pytest.skip(
            "Desafio MFA não encontrado no banco. Aplique a migração "
            "`20261019193000_add_mfa_otp` antes dos testes de API."
        )

# Created by AI.
def critical_mfa_token(connection, headers, action):
    """Solicita o OTP de ação crítica e devolve o token já verificado."""
    response = requests.post(
        endpoints.MFA_REQUEST_CRITICAL,
        headers=headers,
        json={"action": action},
    )
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip(
            "Cooldown de OTP ativo para esta ação. Aguarde 60 segundos "
            "antes de repetir o cenário."
        )
    assert response.status_code == 200, response.text

    challenge_token = response.json()["challengeToken"]
    complete_mfa_challenge(connection, challenge_token)
    return challenge_token

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
def authenticate_user(credentials, database):
    """Faz login com as credenciais configuradas e retorna o token de autenticação."""
    configured_token = os.getenv("FISCALIZE_TEST_TOKEN")
    if configured_token:
        return configured_token

    session = login_trusted(
        database,
        credentials["email"],
        credentials["password"],
        os.getenv("FISCALIZE_TEST_DEVICE_ID", "shared"),
    )
    return session["token"]
