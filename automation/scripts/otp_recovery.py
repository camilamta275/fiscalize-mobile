# Created by AI.

from __future__ import annotations

import hashlib
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from psycopg.rows import dict_row


# Created by AI.
class OtpChallengeNotFoundError(RuntimeError):
    """Raised when the requested OTP challenge is absent from the database."""


# Created by AI.
class OtpCodeNotFoundError(RuntimeError):
    """Raised when no six-digit code matches the stored challenge hash."""


# Created by AI.
def sanitize_database_url(url: str) -> str:
    """Remove Prisma-only parameters before using a PostgreSQL URL with psycopg."""
    parts = urlsplit(url)
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key != "schema"
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


# Created by AI.
# Updated by AI.
def challenge_row(connection, challenge_token):
    """Read the persisted state for the matching challenge token."""
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
    """Recover the six-digit OTP from its hash without changing challenge state."""
    row = challenge_row(connection, challenge_token)
    if row is None:
        raise OtpChallengeNotFoundError(
            "Desafio MFA não encontrado no banco. Aplique a migração "
            "`20261019193000_add_mfa_otp` antes dos testes de API."
        )

    code_hash = row["code_hash"]
    sha256 = hashlib.sha256
    for candidate in range(100000, 1000000):
        code = str(candidate)
        if sha256(code.encode("utf-8")).hexdigest() == code_hash:
            return code

    raise OtpCodeNotFoundError(
        "Nenhum código de seis dígitos corresponde ao hash armazenado."
    )
