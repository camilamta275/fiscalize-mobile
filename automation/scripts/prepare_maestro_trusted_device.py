#!/usr/bin/env python3
# Created by AI.

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlsplit

import psycopg
import requests

from automation.scripts.otp_recovery import recover_otp_code, sanitize_database_url

# Created by AI.
CREDENTIALS_FILE = Path(__file__).resolve().parents[1] / "data" / "credentials.json"
# Created by AI.
OTP_COOLDOWN_RETRY_SECONDS = 60
# Created by AI.
MAX_LOGIN_ATTEMPTS = 3


# Created by AI.
# Updated by AI.
def validate_ci_database_url(database_url: str) -> str:
    """Allow OTP recovery only from the ephemeral local CI database."""
    parsed = urlsplit(database_url)

    if (
        parsed.scheme not in {"postgres", "postgresql"}
        or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}
        or parsed.port not in {None, 5432}
        or parsed.path.strip("/") != "fiscalize"
    ):
        raise ValueError("A recuperação de OTP requer o PostgreSQL fiscalize local da CI.")

    return sanitize_database_url(database_url)


# Created by AI.
def prepare_trusted_device(
    api_base_url: str,
    email: str,
    password: str,
    device_id: str,
    database_url: str,
) -> None:
    """Trust the E2E device through the regular login and OTP verification routes."""
    login_url = f"{api_base_url.rstrip('/')}/auth/login"
    verify_url = f"{api_base_url.rstrip('/')}/auth/2fa/verify"

    for attempt in range(MAX_LOGIN_ATTEMPTS):
        response = requests.post(
            login_url,
            json={
                "email": email,
                "senha": password,
                "deviceId": device_id,
                "deviceName": "Maestro CI",
            },
            timeout=30,
        )

        if response.status_code == 429 and attempt + 1 < MAX_LOGIN_ATTEMPTS:
            time.sleep(OTP_COOLDOWN_RETRY_SECONDS)
            continue

        if response.status_code != 200:
            raise RuntimeError(f"Login de preparação falhou (HTTP {response.status_code}).")

        try:
            login_result = response.json()
        except ValueError as error:
            raise RuntimeError("Login de preparação retornou uma resposta inválida.") from error

        if not isinstance(login_result, dict):
            raise RuntimeError("Login de preparação retornou um formato inválido.")
        if login_result.get("mfaRequired") is not True:
            raise RuntimeError("O backend não solicitou OTP para o dispositivo E2E novo.")

        challenge_token = login_result.get("challengeToken")
        if not isinstance(challenge_token, str) or not challenge_token:
            raise RuntimeError("O backend não retornou o desafio OTP esperado.")

        with psycopg.connect(database_url, connect_timeout=5) as connection:
            code = recover_otp_code(connection, challenge_token)

        verification = requests.post(
            verify_url,
            json={
                "challengeToken": challenge_token,
                "code": code,
                "deviceId": device_id,
            },
            timeout=30,
        )

        if verification.status_code != 200:
            raise RuntimeError(
                f"Verificação OTP de preparação falhou (HTTP {verification.status_code})."
            )

        return

    raise RuntimeError("Login de preparação excedeu as tentativas permitidas.")


# Created by AI.
def seeded_citizen_account() -> tuple[str, str] | None:
    """Return the seeded citizen used by the standalone flows (same account as the API suite)."""
    try:
        login = json.loads(CREDENTIALS_FILE.read_text(encoding="utf-8"))["login"]
        email, password = login["email"], login["password"]
    except (OSError, ValueError, KeyError, TypeError):
        return None
    if isinstance(email, str) and isinstance(password, str) and email and password:
        return email, password
    return None


# Created by AI.
def accounts_to_trust(env: dict[str, str]) -> list[tuple[str, str]]:
    """List every account the flows log into, so none of them stops at the OTP screen.

    O dispositivo E2E é único; cada conta precisa ser confiada nele, senão o app para
    na tela de verificação de segurança (RNF-SEC-04) e o fluxo nunca chega à home.
    """
    accounts = [(env["MAESTRO_TC06_EMAIL"], env["MAESTRO_TC06_PASSWORD"])]

    tc03_email = env.get("MAESTRO_TC03_EMAIL", "").strip()
    tc03_password = env.get("MAESTRO_TC03_PASSWORD", "")
    if tc03_email and tc03_password:
        accounts.append((tc03_email, tc03_password))

    citizen = seeded_citizen_account()
    if citizen:
        accounts.append(citizen)

    unique: list[tuple[str, str]] = []
    for account in accounts:
        if account not in unique:
            unique.append(account)
    return unique


# Created by AI.
def main() -> int:
    if os.getenv("GITHUB_ACTIONS", "").lower() != "true":
        print("[erro] A preparação OTP só pode ser executada em GitHub Actions.", file=sys.stderr)
        return 2

    required = (
        "DATABASE_URL",
        "MAESTRO_TC06_EMAIL",
        "MAESTRO_TC06_PASSWORD",
        "MAESTRO_E2E_DEVICE_ID",
    )
    missing = [name for name in required if not os.getenv(name, "").strip()]
    if missing:
        print(
            "[erro] Variáveis ausentes para preparar o dispositivo: "
            + ", ".join(missing)
            + ".",
            file=sys.stderr,
        )
        return 2

    try:
        database_url = validate_ci_database_url(os.environ["DATABASE_URL"])
        api_base_url = os.getenv("MAESTRO_API_BASE_URL", "http://localhost:3000")
        api_parts = urlsplit(api_base_url)
        if (
            api_parts.scheme != "http"
            or api_parts.hostname not in {"localhost", "127.0.0.1", "::1"}
            or api_parts.port not in {None, 3000}
            or api_parts.path not in {"", "/"}
            or api_parts.query
            or api_parts.fragment
            or api_parts.username
            or api_parts.password
        ):
            raise ValueError("MAESTRO_API_BASE_URL deve apontar para a API HTTP local.")

        accounts = accounts_to_trust(dict(os.environ))
        for email, password in accounts:
            prepare_trusted_device(
                api_base_url,
                email,
                password,
                os.environ["MAESTRO_E2E_DEVICE_ID"].strip(),
                database_url,
            )
    except (OSError, ValueError, RuntimeError, psycopg.Error, requests.RequestException) as error:
        message = str(error)
        sensitive_values = [os.getenv(name) for name in (
            "MAESTRO_TC06_EMAIL",
            "MAESTRO_TC06_PASSWORD",
            "MAESTRO_TC03_EMAIL",
            "MAESTRO_TC03_PASSWORD",
            "DATABASE_URL",
            "JWT_SECRET",
        )]
        citizen = seeded_citizen_account()
        if citizen:
            sensitive_values.extend(citizen)
        for sensitive_value in sensitive_values:
            if sensitive_value:
                message = message.replace(sensitive_value, "[REDACTED]")
        print(
            f"[erro] Preparação do dispositivo confiável falhou ({type(error).__name__}): "
            f"{message}",
            file=sys.stderr,
        )
        return 1

    print(
        f"[preflight] Dispositivo confiável preparado pelo fluxo normal de OTP ({len(accounts)} conta(s))."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
