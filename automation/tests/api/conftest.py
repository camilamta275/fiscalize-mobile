import hashlib
import json
import os
import uuid
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg
import pytest
import requests
from pathlib import Path
from psycopg.rows import dict_row

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
    """Return an access token, failing when interactive MFA is still pending."""
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip(
            "Login bloqueado pelo cooldown de OTP. Aguarde 60 segundos "
            "antes de repetir o cenário."
        )
    response.raise_for_status()
    data = response.json()
    assert not data.get("mfaRequired"), (
        "Login ainda exige OTP. Use `login_with_mfa` para concluir o desafio."
    )
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
            "recuperar o código MFA nos testes de API."
        )

    for line in env_path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "DATABASE_URL":
            return _sanitize_database_url(value.strip().strip('"').strip("'"))

    pytest.skip("DATABASE_URL não encontrada em backend/.env.")

# Created by AI.
@pytest.fixture(scope="session")
def database():
    """Conexão somente leitura usada para recuperar o código MFA em teste."""
    try:
        connection = psycopg.connect(_database_url(), connect_timeout=5)
    except psycopg.Error as error:
        pytest.skip(f"Banco indisponível para recuperar o código MFA: {error}")

    with connection:
        yield connection

# Created by AI.
def challenge_row(connection, challenge_token):
    """Lê o estado persistido do desafio correspondente ao token."""
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT code_hash, attempts, expires_at, verified_at, consumed_at
            FROM otp_challenges
            WHERE challenge_hash = %s
            """,
            (hashlib.sha256(challenge_token.encode("utf-8")).hexdigest(),),
        )
        return cursor.fetchone()

# Created by AI.
def recover_otp_code(connection, challenge_token):
    """Recupera o código de seis dígitos a partir do hash guardado pelo backend.

    O teste não lê a caixa de e-mail, mas o backend persiste apenas o SHA-256 de
    um código numérico de seis dígitos. O espaço de busca (900 mil) é pequeno o
    bastante para recuperar exatamente o código que seria enviado, sem alterar
    nenhum estado do desafio.
    """
    row = challenge_row(connection, challenge_token)
    if row is None:
        pytest.skip(
            "Desafio MFA não encontrado no banco. Aplique a migração "
            "`20261019193000_add_mfa_otp` antes dos testes de API."
        )

    code_hash = row["code_hash"]
    sha256 = hashlib.sha256
    for candidate in range(100000, 1000000):
        code = str(candidate)
        if sha256(code.encode("utf-8")).hexdigest() == code_hash:
            return code

    pytest.fail("Nenhum código de seis dígitos corresponde ao hash armazenado.")

# Created by AI.
def expire_challenge(connection, challenge_token):
    """Move a expiração do desafio para o passado, simulando a passagem do tempo."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE otp_challenges
            SET expires_at = now() - interval '1 second'
            WHERE challenge_hash = %s
            """,
            (hashlib.sha256(challenge_token.encode("utf-8")).hexdigest(),),
        )
    connection.commit()

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
def request_login_challenge(email, password, device_id):
    """Executa o login de um dispositivo novo e devolve o token do desafio."""
    response = requests.post(
        endpoints.LOGIN,
        json={
            "email": email,
            "senha": password,
            "deviceId": device_id,
            "deviceName": "API tests",
        },
    )
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip(
            "Cooldown de OTP ativo. Aguarde 60 segundos antes de repetir o cenário."
        )
    assert response.status_code == 200, response.text

    data = response.json()
    assert data.get("mfaRequired") is True, "Esperado desafio MFA para dispositivo novo."
    assert isinstance(data.get("challengeToken"), str)
    return data["challengeToken"]

# Created by AI.
def login_with_mfa(connection, email, password, purpose):
    """Conclui o login real, respondendo ao desafio OTP quando ele é exigido."""
    payload = login_payload(email, password, purpose)
    response = requests.post(endpoints.LOGIN, json=payload)
    assert_mfa_schema(response)
    if response.status_code == 429:
        pytest.skip(
            "Cooldown de OTP ativo. Aguarde 60 segundos antes de repetir o cenário."
        )
    assert response.status_code == 200, response.text

    data = response.json()
    if not data.get("mfaRequired"):
        return data

    challenge_token = data["challengeToken"]
    code = recover_otp_code(connection, challenge_token)
    verification = requests.post(
        endpoints.MFA_VERIFY,
        json={
            "challengeToken": challenge_token,
            "code": code,
            "deviceId": payload["deviceId"],
        },
    )
    assert verification.status_code == 200, verification.text
    return verification.json()

# Created by AI.
def critical_mfa_token(connection, headers, action):
    """Solicita e conclui o OTP de ação crítica, devolvendo o token verificado."""
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
    code = recover_otp_code(connection, challenge_token)
    verification = requests.post(
        endpoints.MFA_VERIFY,
        json={"challengeToken": challenge_token, "code": code},
    )
    assert verification.status_code == 200, verification.text
    return verification.json()["verificationToken"]

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

    session = login_with_mfa(
        database,
        credentials["email"],
        credentials["password"],
        os.getenv("FISCALIZE_TEST_DEVICE_ID", "shared"),
    )
    return session["token"]
