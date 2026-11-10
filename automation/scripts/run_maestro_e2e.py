#!/usr/bin/env python3
# Created by AI.
# Updated by AI.

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_TESTS = [
    "automation/tests/e2e/login/login-senha-incorreta-usuario-existente.yaml",
    "automation/tests/e2e/login/login-senha-incorreta.yaml",
    "automation/tests/e2e/login/login-gestor.yaml",
]

REQUIRED_ENV_BY_FILE = {
    "login-senha-incorreta-usuario-existente.yaml": [
        "MAESTRO_TC02_EMAIL"
    ],
    "login-gestor.yaml": [
        "MAESTRO_TC06_EMAIL",
        "MAESTRO_TC06_PASSWORD",
    ],
}


def resolve_test_files(cli_tests: list[str] | None) -> list[str]:
    requested = cli_tests if cli_tests else DEFAULT_TESTS
    resolved: list[str] = []
    seen: set[str] = set()

    allowed_tests = set(DEFAULT_TESTS)

    for raw in requested:
        candidate = Path(raw)

        if not candidate.is_absolute():
            candidate = REPO_ROOT / candidate

        candidate = candidate.resolve()

        if not candidate.is_relative_to(REPO_ROOT):
            raise ValueError(
                f"Arquivo fora do repositório: {raw}"
            )

        if not candidate.is_file():
            raise FileNotFoundError(
                f"Arquivo de teste não encontrado: {candidate}"
            )

        relative = candidate.relative_to(REPO_ROOT).as_posix()

        if relative not in allowed_tests:
            raise ValueError(
                f"Fluxo fora do escopo deste runner: {relative}"
            )

        if relative in seen:
            raise ValueError(
                f"Fluxo informado mais de uma vez: {relative}"
            )

        resolved.append(relative)
        seen.add(relative)

    return resolved


def required_env_for_selection(selected: list[str]) -> list[str]:
    required: list[str] = []
    seen: set[str] = set()

    for item in selected:
        name = Path(item).name

        for env_name in REQUIRED_ENV_BY_FILE.get(name, []):
            if env_name not in seen:
                required.append(env_name)
                seen.add(env_name)

    return required


def maestro_base_command() -> list[str]:
    if os.name == "nt":
        return ["cmd.exe", "/c", "maestro"]

    return ["maestro"]


def ensure_maestro_available() -> None:
    result = subprocess.run(
        maestro_base_command() + ["--version"],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Maestro CLI não encontrado ou indisponível no PATH."
        )


def build_maestro_env(selected: list[str]) -> dict[str, str]:
    env = os.environ.copy()
    required = required_env_for_selection(selected)

    missing: list[str] = []

    for env_name in required:
        value = os.getenv(env_name)

        if not value:
            missing.append(env_name)
            continue

        env[env_name] = value

    if missing:
        raise RuntimeError(
            "Variáveis de ambiente ausentes para os fluxos selecionados: "
            + ", ".join(missing)
            + "."
        )

    return env


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Valida e executa somente os fluxos E2E Maestro "
            "sob responsabilidade desta implementação."
        )
    )

    parser.add_argument(
        "tests",
        nargs="*",
        help=(
            "Arquivos YAML do Maestro. Se omitido, usa apenas "
            "os cenários de TC02, conta inexistente e gestor."
        ),
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Valida arquivos selecionados e mostra as etapas "
            "previstas, sem rodar migração, seed ou Maestro."
        ),
    )

    args = parser.parse_args()

    try:
        selected = resolve_test_files(args.tests)

    except (FileNotFoundError, ValueError) as exc:
        print(f"[erro] {exc}", file=sys.stderr)
        return 2

    if args.dry_run:
        print("[dry-run] Arquivos selecionados:")

        for item in selected:
            print(f"  - {item}")

        required = required_env_for_selection(selected)

        print("[dry-run] Etapas previstas:")
        print("  1. validar a existência dos arquivos selecionados")
        print("  2. confirmar a disponibilidade do Maestro para a execução real")
        print("  3. validar as variáveis de ambiente exigidas pelo conjunto selecionado")
        print("  4. executar o Maestro sobre os arquivos listados")

        print("[dry-run] Variáveis exigidas pelo conjunto selecionado:")

        if required:
            for item in required:
                print(f"  - {item}")
        else:
            print("  - nenhuma")

        print(
            "[dry-run] Nenhuma senha, token, hash ou URL "
            "com credencial será exibido."
        )

        return 0

    try:
        ensure_maestro_available()
        env = build_maestro_env(selected)

    except (RuntimeError, OSError) as exc:
        print(f"[erro] {exc}", file=sys.stderr)
        return 2

    print("[maestro] Executando fluxos:")

    for item in selected:
        print(f"  - {item}")

    maestro_cmd = maestro_base_command() + ["test", *selected]

    try:
        result = subprocess.run(
            maestro_cmd,
            cwd=REPO_ROOT,
            env=env,
            check=False,
        )

    except OSError as exc:
        print(
            f"[erro] Não foi possível iniciar o Maestro: {exc}",
            file=sys.stderr,
        )
        return 2

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
