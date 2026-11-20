#!/usr/bin/env python3
# Created by AI.

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

# Created by AI.
REPO_ROOT = Path(__file__).resolve().parents[2]
# Created by AI.
TEST_ROOT = REPO_ROOT / "automation" / "tests" / "e2e"
# Created by AI.
REPORT_ROOT = REPO_ROOT / "automation" / "reports" / "maestro"
MIN_REDACTED_LITERAL_LENGTH = 4
# Created by AI.
REQUIRED_ENV_BY_FILE = {
    "login-senha-incorreta-usuario-existente.yaml": ("MAESTRO_TC02_EMAIL",),
    "ocorrencia-criacao-completa.yaml": (
        "MAESTRO_TC03_EMAIL",
        "MAESTRO_TC03_PASSWORD",
    ),
    "login-gestor.yaml": ("MAESTRO_TC06_EMAIL", "MAESTRO_TC06_PASSWORD"),
}


# Created by AI.
def discover_test_files() -> list[str]:
    """Return the standalone Maestro flows under the supported E2E directory.

    Os fluxos de ``fluxo/`` recebem variáveis de execução do pytest
    (``test_fluxo_registrar_acompanhar_notificar.py``, workflow ``e2e.yml``) e não
    rodam sozinhos; continuam aceitos quando informados explicitamente.
    """
    return sorted(
        path.relative_to(REPO_ROOT).as_posix()
        for path in TEST_ROOT.rglob("*.yaml")
        if path.relative_to(TEST_ROOT).parts[0] != "fluxo"
    )


# Created by AI.
def resolve_test_files(cli_tests: list[str] | None) -> list[str]:
    """Resolve explicit flows or default to every flow without allowing path escapes."""
    requested = cli_tests if cli_tests else discover_test_files()
    if not requested:
        raise FileNotFoundError(f"Nenhum fluxo Maestro encontrado em {TEST_ROOT}.")

    resolved: list[str] = []
    seen: set[str] = set()

    for raw in requested:
        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = REPO_ROOT / candidate

        candidate = candidate.resolve()
        if not candidate.is_relative_to(TEST_ROOT.resolve()):
            raise ValueError(f"Arquivo fora do diretório E2E: {raw}")
        if not candidate.is_file() or candidate.suffix.lower() != ".yaml":
            raise FileNotFoundError(f"Fluxo YAML não encontrado: {raw}")

        relative = candidate.relative_to(REPO_ROOT).as_posix()
        if relative in seen:
            raise ValueError(f"Fluxo informado mais de uma vez: {relative}")

        resolved.append(relative)
        seen.add(relative)

    return resolved


# Created by AI.
def required_env_for_selection(selected: list[str]) -> list[str]:
    """List unique environment variables required by the chosen flows."""
    required: list[str] = []
    for item in selected:
        for name in REQUIRED_ENV_BY_FILE.get(Path(item).name, ()):
            if name not in required:
                required.append(name)
    return required


# Created by AI.
def build_maestro_env(selected: list[str]) -> dict[str, str]:
    """Validate flow inputs and return the inherited environment for Maestro."""
    env = os.environ.copy()
    missing = [name for name in required_env_for_selection(selected) if not env.get(name)]
    if missing:
        raise RuntimeError(
            "Variáveis de ambiente ausentes para os fluxos selecionados: "
            + ", ".join(missing)
            + "."
        )

    secret_markers = ("PASSWORD", "TOKEN", "SECRET")
    for name in list(env):
        if name.startswith("MAESTRO_"):
            continue
        if (
            any(marker in name.upper() for marker in secret_markers)
            or name in {"DATABASE_URL", "FISCALIZE_DATABASE_URL"}
        ):
            env.pop(name)

    return env


# Created by AI.
def maestro_base_command() -> list[str]:
    """Resolve the Maestro executable on Windows and Unix-like runners."""
    if os.name == "nt":
        return ["cmd.exe", "/c", "maestro"]
    return ["maestro"]


# Created by AI.
def ensure_maestro_available(env: dict[str, str]) -> None:
    """Fail before running any flow if the CLI is unavailable."""
    result = subprocess.run(
        maestro_base_command() + ["--version"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("Maestro CLI não encontrado ou indisponível no PATH.")


# Created by AI.
def clear_app_data(flow: str, env: dict[str, str]) -> None:
    """Clear the app's local state using the package id declared in the flow."""
    app_id = None
    for line in (REPO_ROOT / flow).read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition(":")
        if separator and key.strip() == "appId":
            app_id = value.strip().strip("\"'")
            break
    if not app_id:
        raise RuntimeError(f"Identificador do aplicativo ausente no fluxo {flow}.")

    result = subprocess.run(
        ["adb", "shell", "pm", "clear", app_id],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 or result.stdout.strip() != "Success":
        raise RuntimeError(f"Não foi possível limpar o estado local antes de {flow}.")


# Created by AI.
def sensitive_environment_values(env: dict[str, str]) -> list[str]:
    """Return credential-like values that must not be persisted in text artifacts."""
    sensitive_suffixes = ("_EMAIL", "_PASSWORD", "_TOKEN", "_SECRET")
    return [
        value
        for name, value in env.items()
        if value and (name.endswith(sensitive_suffixes) or name == "MAESTRO_E2E_DEVICE_ID")
    ]


# Created by AI.
def sensitive_flow_values(flow: str) -> list[str]:
    """Collect literal input strings so flow credentials cannot enter text artifacts."""
    values: list[str] = []
    in_env_block = False
    sensitive_names = ("PASSWORD", "SENHA", "TOKEN", "SECRET")
    for line in (REPO_ROOT / flow).read_text(encoding="utf-8").splitlines():
        if line.strip() == "env:" and not line.startswith(" "):
            in_env_block = True
            continue
        if in_env_block and line and not line.startswith(" "):
            in_env_block = False

        if in_env_block:
            variable = re.match(r"\s+([A-Z0-9_]+):\s*(.*?)\s*$", line)
            if variable and any(name in variable.group(1) for name in sensitive_names):
                values.append(variable.group(2).strip("\"'"))

        input_text = re.match(r"\s*-\s*inputText:\s*(.*?)\s*$", line)
        if input_text:
            value = input_text.group(1).strip()
            if value and not value.startswith("${"):
                values.append(value.strip("\"'"))

    # Literais curtos (ex.: o "a" do teste de descrição mínima) não são segredos e,
    # se redigidos, apagam essa letra de todos os logs e tornam o diagnóstico ilegível.
    return [value for value in values if len(value) >= MIN_REDACTED_LITERAL_LENGTH]


# Created by AI.
def redact_text(text: str, sensitive_values: list[str]) -> str:
    """Redact secret values from Maestro output before logging or artifact storage."""
    for value in sorted(sensitive_values, key=len, reverse=True):
        text = text.replace(value, "[REDACTED]")
    return text


# Created by AI.
def redact_text_artifacts(directory: Path, sensitive_values: list[str]) -> None:
    """Sanitize text evidence while leaving binary screenshots unchanged."""
    text_extensions = {".html", ".json", ".log", ".txt", ".xml"}
    for path in directory.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in text_extensions:
            continue
        content = path.read_bytes()
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            continue
        path.write_text(redact_text(text, sensitive_values), encoding="utf-8")


# Created by AI.
def run_flow(
    flow: str,
    env: dict[str, str],
    sensitive_values: list[str],
    reset_app_state: bool,
) -> int:
    """Run one flow and persist redacted JUnit, logs, screenshots, and debug evidence."""
    flow_path = Path(flow)
    flow_relative_path = flow_path.relative_to(Path("automation/tests/e2e"))
    output_dir = REPORT_ROOT / flow_relative_path.parent / flow_path.stem
    test_output_dir = output_dir / "test-output"
    debug_output_dir = output_dir / "debug"
    junit_path = output_dir / "junit.xml"
    output_dir.mkdir(parents=True, exist_ok=True)
    test_output_dir.mkdir(parents=True, exist_ok=True)
    debug_output_dir.mkdir(parents=True, exist_ok=True)

    command = maestro_base_command() + [
        "test",
        "--format=JUNIT",
        f"--output={junit_path}",
        f"--test-output-dir={test_output_dir}",
        f"--debug-output={debug_output_dir}",
        "--flatten-debug-output",
        flow,
    ]
    print(f"[maestro] Iniciando {flow}")

    try:
        if reset_app_state:
            clear_app_data(flow, env)
        result = subprocess.run(
            command,
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        output = redact_text(result.stdout + result.stderr, sensitive_values)
        (output_dir / "maestro.log").write_text(output, encoding="utf-8")
        redact_text_artifacts(output_dir, sensitive_values)
    except (OSError, RuntimeError) as error:
        message = f"[erro] Não foi possível iniciar o Maestro para {flow}: {error}"
        print(message, file=sys.stderr)
        (output_dir / "maestro.log").write_text(message, encoding="utf-8")
        return 2

    if result.returncode == 0:
        print(f"[maestro] Aprovado: {flow}")
    else:
        print(f"[maestro] Falhou (código {result.returncode}): {flow}", file=sys.stderr)
        log_lines = output.splitlines()
        for line in log_lines[-30:]:
            print(line, file=sys.stderr)
    return result.returncode


# Created by AI.
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Executa sequencialmente fluxos Maestro da suíte E2E."
    )
    parser.add_argument(
        "tests",
        nargs="*",
        help="Arquivos YAML específicos; sem argumentos executa todos os fluxos.",
    )
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument(
        "--dry-run",
        action="store_true",
        help="Lista os fluxos e variáveis requeridas sem validar credenciais ou executar.",
    )
    modes.add_argument(
        "--validate-only",
        action="store_true",
        help="Valida a seleção e as variáveis requeridas sem iniciar o Maestro.",
    )
    parser.add_argument(
        "--reset-app-state",
        action="store_true",
        help="Limpa os dados locais do aplicativo antes de cada fluxo.",
    )
    args = parser.parse_args()

    try:
        selected = resolve_test_files(args.tests)
    except (FileNotFoundError, ValueError) as error:
        print(f"[erro] {error}", file=sys.stderr)
        return 2

    if args.dry_run:
        print(f"[dry-run] Fluxos selecionados: {len(selected)}")
        for flow in selected:
            print(f"  - {flow}")
        required = required_env_for_selection(selected)
        print("[dry-run] Variaveis requeridas: " + (", ".join(required) or "nenhuma"))
        return 0

    try:
        env = build_maestro_env(selected)
    except RuntimeError as error:
        print(f"[erro] {error}", file=sys.stderr)
        return 2

    if args.validate_only:
        print(f"[maestro] Seleção válida: {len(selected)} fluxos e variáveis presentes.")
        return 0

    try:
        ensure_maestro_available(env)
    except (OSError, RuntimeError) as error:
        print(f"[erro] {error}", file=sys.stderr)
        return 2

    secret_values = sensitive_environment_values(env)
    for flow in selected:
        secret_values.extend(sensitive_flow_values(flow))
    secret_values = list(dict.fromkeys(secret_values))
    failures: list[str] = []
    for flow in selected:
        if run_flow(flow, env, secret_values, args.reset_app_state) != 0:
            failures.append(flow)

    if failures:
        print("[maestro] Fluxos com falha:", file=sys.stderr)
        for flow in failures:
            print(f"  - {flow}", file=sys.stderr)
        return 1

    print(f"[maestro] Todos os {len(selected)} fluxos foram aprovados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
