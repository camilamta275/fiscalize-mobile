# Created by AI.

import os
import re
import secrets
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, Mock, call, patch

import pytest

# Created by AI.
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from automation.scripts.otp_recovery import (
    OtpChallengeNotFoundError,
    OtpCodeNotFoundError,
    recover_otp_code,
)
from automation.scripts.prepare_maestro_trusted_device import (
    accounts_to_trust,
    main as prepare_trusted_device_main,
    prepare_trusted_device,
    validate_ci_database_url,
)
from automation.scripts.run_maestro_e2e import (
    build_maestro_env,
    clear_app_data,
    discover_test_files,
    redact_text,
    resolve_test_files,
    sensitive_flow_values,
)
from automation.tests.api import conftest as api_conftest


# Created by AI.
# Updated by AI.
def test_runner_discovers_all_flows_and_accepts_individual_selection():
    flows = discover_test_files()

    assert len(flows) == 16
    assert "automation/tests/e2e/login/login-gestor.yaml" in flows
    assert "automation/tests/e2e/ocorrencia/ocorrencia-campo-obrigatorio.yaml" in flows
    assert resolve_test_files(["automation/tests/e2e/login/login-gestor.yaml"]) == [
        "automation/tests/e2e/login/login-gestor.yaml"
    ]


# Created by AI.
def test_yaml_testids_match_app_components():
    app_root = REPO_ROOT / "mobile" / "src"
    test_root = REPO_ROOT / "automation" / "tests" / "e2e"

    app_testids = set()
    for path in app_root.rglob("*"):
        if path.suffix not in {".tsx", ".ts"}:
            continue
        app_testids.update(
            re.findall(r'testID="([^"]+)"', path.read_text(encoding="utf-8"))
        )

    yaml_testids = set()
    for path in test_root.rglob("*.yaml"):
        text = path.read_text(encoding="utf-8")
        yaml_testids.update(re.findall(r'id:\s*["]([^"]+)["]', text))

    outdated = sorted(yaml_testids - app_testids)
    assert not outdated, f"testIDs usados pelos YAML que não existem no app: {outdated}"


# Created by AI.
def test_preflight_verifies_otp_for_the_same_device_without_logging_it(capsys):
    email = f"{secrets.token_hex(8)}@example.test"
    password = secrets.token_urlsafe(24)
    device_id = secrets.token_urlsafe(24)
    challenge_token = secrets.token_urlsafe(24)
    otp = "".join(str(secrets.randbelow(10)) for _ in range(6))
    database_url = "postgresql://localhost:5432/fiscalize?schema=public"
    database_connection = MagicMock()
    login_response = SimpleNamespace(
        status_code=200,
        json=Mock(return_value={"mfaRequired": True, "challengeToken": challenge_token}),
    )
    verification_response = SimpleNamespace(status_code=200)

    with (
        patch(
            "automation.scripts.prepare_maestro_trusted_device.requests.post",
            side_effect=[login_response, verification_response],
        ) as post,
        patch(
            "automation.scripts.prepare_maestro_trusted_device.psycopg.connect",
            return_value=database_connection,
        ) as connect,
        patch(
            "automation.scripts.prepare_maestro_trusted_device.recover_otp_code",
            return_value=otp,
        ) as recover,
    ):
        prepare_trusted_device(
            "http://localhost:3000",
            email,
            password,
            device_id,
            database_url,
        )

    assert post.call_args_list == [
        call(
            "http://localhost:3000/auth/login",
            json={
                "email": email,
                "senha": password,
                "deviceId": device_id,
                "deviceName": "Maestro CI",
            },
            timeout=30,
        ),
        call(
            "http://localhost:3000/auth/2fa/verify",
            json={
                "challengeToken": challenge_token,
                "code": otp,
                "deviceId": device_id,
            },
            timeout=30,
        ),
    ]
    connect.assert_called_once_with(database_url, connect_timeout=5)
    recover.assert_called_once_with(database_connection.__enter__(), challenge_token)
    captured = capsys.readouterr()
    assert otp not in captured.out + captured.err


# Created by AI.
def test_preflight_database_must_be_the_local_ci_database():
    database_url = "postgresql://localhost:5432/fiscalize?schema=public"

    assert "schema=" not in validate_ci_database_url(database_url)

    for rejected_url in (
        "postgresql://db.example.test:5432/fiscalize",
        "postgresql://localhost:5432/other",
    ):
        try:
            validate_ci_database_url(rejected_url)
        except ValueError:
            pass
        else:
            raise AssertionError("A non-CI database URL must be rejected.")


# Created by AI.
# Updated by AI.
def test_standalone_otp_recovery_raises_runtime_error_without_pytest_outcomes():
    with patch(
        "automation.scripts.otp_recovery.challenge_row",
        return_value=None,
    ):
        with pytest.raises(OtpChallengeNotFoundError) as error:
            recover_otp_code(Mock(), "challenge-token")

    assert isinstance(error.value, RuntimeError)
    assert not isinstance(error.value, pytest.skip.Exception)


# Created by AI.
def test_api_conftest_preserves_pytest_skip_for_missing_challenge():
    error = OtpChallengeNotFoundError("challenge missing")

    with patch.object(api_conftest, "_recover_otp_code", side_effect=error):
        with pytest.raises(pytest.skip.Exception, match="challenge missing"):
            api_conftest.recover_otp_code(Mock(), "challenge-token")


# Created by AI.
def test_api_conftest_preserves_pytest_fail_for_unrecoverable_code():
    error = OtpCodeNotFoundError("code hash not matched")

    with patch.object(api_conftest, "_recover_otp_code", side_effect=error):
        with pytest.raises(pytest.fail.Exception, match="code hash not matched"):
            api_conftest.recover_otp_code(Mock(), "challenge-token")


# Created by AI.
def test_preflight_handles_neutral_otp_errors_as_a_normal_failure(capsys):
    email = f"{secrets.token_hex(8)}@example.test"
    password = secrets.token_urlsafe(24)
    environment = {
        "GITHUB_ACTIONS": "true",
        "DATABASE_URL": "postgresql://localhost:5432/fiscalize",
        "MAESTRO_TC06_EMAIL": email,
        "MAESTRO_TC06_PASSWORD": password,
        "MAESTRO_E2E_DEVICE_ID": "maestro-test-device",
        "MAESTRO_API_BASE_URL": "http://localhost:3000",
    }

    with (
        patch.dict(os.environ, environment),
        patch(
            "automation.scripts.prepare_maestro_trusted_device.prepare_trusted_device",
            side_effect=OtpChallengeNotFoundError("challenge missing"),
        ),
    ):
        exit_code = prepare_trusted_device_main()

    captured = capsys.readouterr()
    assert exit_code == 1
    assert "OtpChallengeNotFoundError" in captured.err
    assert "challenge missing" in captured.err
    assert password not in captured.out + captured.err


# Created by AI.
def test_runner_redacts_credential_values_from_logs():
    value = secrets.token_urlsafe(24)

    assert redact_text(f"login input {value}", [value]) == "login input [REDACTED]"


# Created by AI.
def test_runner_redacts_literal_password_inputs_from_flow_artifacts():
    values = sensitive_flow_values(
        "automation/tests/e2e/login/login-cidadao-sucesso.yaml"
    )

    assert values
    assert all(redact_text(value, values) == "[REDACTED]" for value in values)


# Created by AI.
def test_runner_does_not_pass_backend_or_github_secrets_to_maestro():
    email = f"{secrets.token_hex(8)}@example.test"
    password = secrets.token_urlsafe(24)
    selected = ["automation/tests/e2e/login/login-gestor.yaml"]

    with patch.dict(
        os.environ,
        {
            "MAESTRO_TC06_EMAIL": email,
            "MAESTRO_TC06_PASSWORD": password,
            "DATABASE_URL": secrets.token_urlsafe(24),
            "JWT_SECRET": secrets.token_urlsafe(24),
            "GITHUB_TOKEN": secrets.token_urlsafe(24),
        },
    ):
        env = build_maestro_env(selected)

    assert env["MAESTRO_TC06_EMAIL"] == email
    assert env["MAESTRO_TC06_PASSWORD"] == password
    assert "DATABASE_URL" not in env
    assert "JWT_SECRET" not in env
    assert "GITHUB_TOKEN" not in env


# Created by AI.
def test_runner_clears_the_package_declared_by_each_flow():
    flow = "automation/tests/e2e/login/login-gestor.yaml"
    env = {"PATH": "safe"}

    with patch(
        "automation.scripts.run_maestro_e2e.subprocess.run",
        return_value=SimpleNamespace(returncode=0, stdout="Success\n"),
    ) as run:
        clear_app_data(flow, env)

    assert run.call_args.args[0] == [
        "adb",
        "shell",
        "pm",
        "clear",
        "br.com.fiscalize.mobile",
    ]
    assert run.call_args.kwargs["env"] == env


# Created by AI.
def test_preflight_trusts_every_account_used_by_the_flows():
    env = {
        "MAESTRO_TC06_EMAIL": "gestor@example.test",
        "MAESTRO_TC06_PASSWORD": "gestor-pass",
        "MAESTRO_TC03_EMAIL": "tc03@example.test",
        "MAESTRO_TC03_PASSWORD": "tc03-pass",
    }

    accounts = accounts_to_trust(env)

    assert accounts[0] == ("gestor@example.test", "gestor-pass")
    assert ("tc03@example.test", "tc03-pass") in accounts
    # O cidadão semeado (mesmo das suítes de API) também precisa estar confiado.
    assert any(email == "cidadao@fiscalize.gov.br" for email, _ in accounts)
    assert len(accounts) == len(set(accounts))


# Created by AI.
def test_preflight_skips_optional_account_when_secrets_are_missing():
    env = {"MAESTRO_TC06_EMAIL": "gestor@example.test", "MAESTRO_TC06_PASSWORD": "gestor-pass"}

    emails = [email for email, _ in accounts_to_trust(env)]

    assert "tc03@example.test" not in emails
    assert emails[0] == "gestor@example.test"


# Created by AI.
def test_runner_does_not_redact_short_literals_from_logs(tmp_path, monkeypatch):
    from automation.scripts import run_maestro_e2e as runner

    flow = tmp_path / "flow.yaml"
    flow.write_text('- inputText: "a"\n- inputText: "Senha-Longa-123"\n', encoding="utf-8")
    monkeypatch.setattr(runner, "REPO_ROOT", tmp_path)

    values = runner.sensitive_flow_values("flow.yaml")

    assert "a" not in values
    assert "Senha-Longa-123" in values


# Created by AI.
def test_runner_rejects_tc02_account_outside_the_seeded_citizen():
    selected = [
        "automation/tests/e2e/login/login-senha-incorreta-usuario-existente.yaml"
    ]
    environment = {
        "MAESTRO_TC02_EMAIL": "outra-conta@example.test",
        "MAESTRO_TC06_EMAIL": "gestor@example.test",
        "MAESTRO_TC06_PASSWORD": "gestor-pass",
    }

    with patch.dict(os.environ, environment, clear=True):
        with pytest.raises(RuntimeError, match="cidadão semeado"):
            build_maestro_env(selected)
