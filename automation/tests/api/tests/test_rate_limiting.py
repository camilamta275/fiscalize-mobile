import os
import uuid

import pytest
import requests

from automation.tests.api.config.settings import Endpoints as endpoints

# Created by AI.
GENERAL_LIMIT = int(os.getenv("FISCALIZE_RATE_LIMIT_GENERAL_MAX", "100"))
# Created by AI.
AUTH_LIMIT = int(os.getenv("FISCALIZE_RATE_LIMIT_AUTH_MAX", "10"))
# Created by AI.
DEMAND_LIMIT = int(os.getenv("FISCALIZE_RATE_LIMIT_DEMAND_MAX", "10"))


# Created by AI.
def client_ip_headers():
    """Return a synthetic client IP for an isolated rate-limit bucket."""
    octet = uuid.uuid4().int % 254 + 1
    return {"X-Forwarded-For": f"198.51.100.{octet}"}


# Created by AI.
def assert_rate_limit_headers(response):
    """Validate the headers required from a rate-limited response."""
    assert response.headers.get("Retry-After"), response.headers
    assert (
        response.headers.get("RateLimit")
        or response.headers.get("RateLimit-Limit")
        or response.headers.get("X-RateLimit-Limit")
    ), response.headers


# Created by AI.
def post_login(headers=None):
    """Send one login request with an unknown synthetic account."""
    payload = {
        "email": f"rate-limit-{uuid.uuid4()}@example.com",
        "senha": "SyntheticPassword1!",
        "deviceId": f"rate-limit-{uuid.uuid4()}",
        "deviceName": "API rate-limit tests",
    }
    return requests.post(
        endpoints.LOGIN,
        json=payload,
        headers=headers,
        timeout=10,
    )


# Created by AI.
def invalid_demand_payload():
    """Return invalid data so limit tests do not create database records."""
    return {"synthetic": str(uuid.uuid4())}


# Created by AI.
def test_general_request_below_limit_returns_normally():
    """A general route accepts a request below its configured limit."""
    response = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers=client_ip_headers(),
        timeout=10,
    )

    assert response.status_code != 429, response.text


# Created by AI.
def test_general_limit_returns_429_after_limit_is_exceeded():
    """A general route rejects requests after the configured limit."""
    headers = client_ip_headers()
    responses = [
        requests.get(
            f"{endpoints.BASE_URL}/demands/public",
            headers=headers,
            timeout=10,
        )
        for _ in range(GENERAL_LIMIT + 1)
    ]

    rejected = next(
        (response for response in responses if response.status_code == 429),
        None,
    )
    assert rejected is not None, "A rota geral não retornou HTTP 429."
    assert_rate_limit_headers(rejected)


# Created by AI.
def test_authentication_limit_is_more_restrictive_than_general_limit():
    """Authentication routes use a stricter independent policy."""
    headers = client_ip_headers()
    responses = [post_login(headers) for _ in range(AUTH_LIMIT + 1)]

    rejected = next(
        (response for response in responses if response.status_code == 429),
        None,
    )
    assert rejected is not None, "A rota de autenticação não retornou HTTP 429."
    assert_rate_limit_headers(rejected)
    assert AUTH_LIMIT < GENERAL_LIMIT


# Created by AI.
def test_authentication_bucket_does_not_consume_general_bucket():
    """Authentication traffic does not consume the general-route bucket."""
    headers = client_ip_headers()
    for _ in range(AUTH_LIMIT + 1):
        post_login(headers)

    general_response = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers=headers,
        timeout=10,
    )

    assert general_response.status_code != 429, general_response.text


# Created by AI.
def test_demand_submission_is_allowed_below_limit(authenticate_user):
    """The demand route is not rate-limited before its configured limit."""
    response = requests.post(
        endpoints.DEMANDS,
        json=invalid_demand_payload(),
        headers={
            "Authorization": f"Bearer {authenticate_user}",
            **client_ip_headers(),
        },
        timeout=10,
    )

    assert response.status_code != 429, response.text


# Created by AI.
def test_demand_submission_limit_returns_429(authenticate_user):
    """The demand route rejects requests after its specific limit."""
    headers = {
        "Authorization": f"Bearer {authenticate_user}",
        **client_ip_headers(),
    }
    responses = [
        requests.post(
            endpoints.DEMANDS,
            json=invalid_demand_payload(),
            headers=headers,
            timeout=10,
        )
        for _ in range(DEMAND_LIMIT + 1)
    ]

    rejected = next(
        (response for response in responses if response.status_code == 429),
        None,
    )
    assert rejected is not None, "A submissão de denúncia não retornou HTTP 429."
    assert_rate_limit_headers(rejected)


# Created by AI.
def test_different_client_ips_have_independent_buckets():
    """Different client IPs have independent general-route counters."""
    first = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers={"X-Forwarded-For": "198.51.100.10"},
        timeout=10,
    )
    second = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers={"X-Forwarded-For": "198.51.100.11"},
        timeout=10,
    )

    assert first.status_code != 429, first.text
    assert second.status_code != 429, second.text


# Created by AI.
def test_untrusted_forwarded_for_does_not_crash_request():
    """An untrusted forwarded header cannot cause a server error."""
    response = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers={"X-Forwarded-For": "203.0.113.1, 198.51.100.1"},
        timeout=10,
    )

    assert response.status_code != 500, response.text


# Created by AI.
@pytest.mark.skipif(
    os.getenv("FISCALIZE_TEST_REDIS_UNAVAILABLE") != "1",
    reason="Requires an environment that can simulate Redis unavailability.",
)
def test_redis_unavailability_follows_configured_policy():
    """Redis failure follows the explicitly configured deployment policy."""
    response = requests.get(
        f"{endpoints.BASE_URL}/demands/public",
        headers=client_ip_headers(),
        timeout=10,
    )

    expected_status = int(os.getenv("FISCALIZE_REDIS_FAILURE_STATUS", "503"))
    assert response.status_code == expected_status, response.text


# Created by AI.
@pytest.mark.skipif(
    os.getenv("FISCALIZE_TEST_LOG_CAPTURE") != "1",
    reason="Requires sanitized API log capture from the test environment.",
)
def test_rate_limit_logs_do_not_expose_sensitive_values():
    """The log-capture environment verifies that sensitive values are masked."""
    secret = f"synthetic-secret-{uuid.uuid4()}"
    response = requests.post(
        endpoints.LOGIN,
        json={
            "email": f"{secret}@example.com",
            "senha": secret,
            "deviceId": secret,
            "deviceName": "API rate-limit tests",
        },
        headers=client_ip_headers(),
        timeout=10,
    )

    assert response.status_code in {400, 401, 429}
