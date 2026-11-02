"""Gera metrics.json e os dois relatórios HTML de qualidade em um único comando."""

# Created by AI.
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import metrics  # noqa: E402
import quality_report  # noqa: E402
import runstore  # noqa: E402

# Created by AI.
GITHUB_API = "https://api.github.com"

# Created by AI.
USER_AGENT = "fiscalize-quality-reports"

# Created by AI.
REMOTE_PATTERN = re.compile(r"[:/]([^/:]+/[^/]+?)(?:\.git)?$")


# Created by AI.
def resolve_repo(explicit: str | None) -> str | None:
    """Descobre org/repo a partir do argumento, do ambiente ou do remote origin."""
    if explicit:
        return explicit

    env_repo = os.getenv("GITHUB_REPOSITORY")
    if env_repo:
        return env_repo

    try:
        remote = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None

    match = REMOTE_PATTERN.search(remote)
    return match.group(1) if match else None


# Created by AI.
def _get_json(url: str, token: str | None) -> object:
    """Faz um GET na API do GitHub e devolve o JSON da resposta."""
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/vnd.github+json"},
    )
    if token:
        request.add_header("Authorization", f"Bearer {token}")

    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


# Created by AI.
def fetch_inputs(repo: str, branch: str) -> tuple[dict, list]:
    """Coleta as execuções recentes da branch e as issues abertas de falha."""
    token = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN")
    runs = _get_json(
        f"{GITHUB_API}/repos/{repo}/actions/runs?per_page=30&branch={branch}",
        token,
    )
    issues = _get_json(
        f"{GITHUB_API}/repos/{repo}/issues?labels=falha-ci&state=open&per_page=100",
        token,
    )
    return runs, issues


# Created by AI.
def _fetch_error(error: urllib.error.HTTPError, repo: str) -> str:
    """Traduz o erro HTTP da API em uma mensagem acionável."""
    if error.code == 404:
        return (
            f"Repositório não encontrado ou privado: {repo}. "
            "Confira --repo ou defina GH_TOKEN para acessar repositórios privados."
        )
    if error.code in {403, 429}:
        return (
            "Limite de requisições da API do GitHub atingido (60 por hora sem token). "
            "Aguarde ou defina GH_TOKEN com um token válido."
        )
    if error.code == 401:
        return "Token do GitHub inválido. Verifique a variável GH_TOKEN."
    return f"Falha ao consultar a API do GitHub ({error.code} {error.reason})."


# Created by AI.
def main() -> int:
    """Calcula as métricas a partir dos JUnit XML e grava os relatórios."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reports-dir",
        type=Path,
        default=Path("reports"),
        help="Diretório com os relatórios JUnit XML (padrão: reports).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("reports"),
        help="Base onde a pasta versionada da execução é criada (padrão: reports).",
    )
    parser.add_argument(
        "--label",
        default=None,
        help="Nome da pasta da execução (padrão: data e hora local).",
    )
    parser.add_argument("--runs", type=Path, default=None, help="Export JSON das execuções (M5).")
    parser.add_argument("--issues", type=Path, default=None, help="Export JSON das issues abertas (M6).")
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="Força a coleta de execuções e issues direto da API do GitHub.",
    )
    parser.add_argument(
        "--no-fetch",
        action="store_true",
        help="Não consulta a API do GitHub; M5 e M6 ficam sem dados se não houver arquivos.",
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="org/repo para o --fetch (padrão: GITHUB_REPOSITORY ou o remote origin).",
    )
    parser.add_argument("--default-branch", default=os.getenv("DEFAULT_BRANCH", "main"))
    parser.add_argument("--summary", action="store_true", help="Anexa o resumo ao step summary.")
    parser.add_argument(
        "--no-index",
        action="store_true",
        help="Não atualiza o index.html na raiz de --output-dir.",
    )
    args = parser.parse_args()

    if not args.reports_dir.exists():
        print(
            f"::error::Diretório não encontrado: {args.reports_dir}. "
            "Rode o pytest antes para gerar os arquivos JUnit XML.",
            file=sys.stderr,
        )
        return 1

    runs_path, issues_path = args.runs, args.issues
    fetched: tuple[dict, list] | None = None

    should_fetch = args.fetch or (
        not args.no_fetch and runs_path is None and issues_path is None
    )

    if should_fetch:
        repo = resolve_repo(args.repo)
        if repo is None:
            print(
                "::error::Não foi possível descobrir o repositório. "
                "Informe --repo org/nome ou configure o remote origin.",
                file=sys.stderr,
            )
            return 1
        try:
            fetched = fetch_inputs(repo, args.default_branch)
        except urllib.error.HTTPError as error:
            print(f"::error::{_fetch_error(error, repo)}", file=sys.stderr)
            return 1
        except urllib.error.URLError as error:
            print(f"::error::Falha de rede ao consultar o GitHub: {error.reason}", file=sys.stderr)
            return 1

    runs = metrics.read_runs(runs_path) if runs_path else None
    issues = metrics.read_issues(issues_path) if issues_path else None

    if fetched is not None:
        runs_payload, issues_payload = fetched
        runs = metrics.parse_runs(runs_payload)
        issues = metrics.parse_issues(issues_payload)

    payload = metrics.build_payload(args.reports_dir, runs, issues, args.default_branch)

    run_dir = runstore.new_run_dir(args.output_dir, args.label)

    if fetched is not None:
        inputs_dir = run_dir / "inputs"
        inputs_dir.mkdir()
        (inputs_dir / "runs.json").write_text(
            json.dumps(fetched[0], ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        (inputs_dir / "issues.json").write_text(
            json.dumps(fetched[1], ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    metrics_path = metrics.write_payload(payload, run_dir / "metrics.json")

    markdown = metrics.render_markdown(payload)
    print(markdown)

    if args.summary:
        metrics.emit_summary(markdown)

    technical_path, business_path = quality_report.generate(payload, run_dir)

    if not args.no_index:
        shutil.copyfile(business_path, args.output_dir / "index.html")

    print()
    print(f"Execução: {run_dir}")
    print(f"Métricas: {metrics_path}")
    print(f"Relatório técnico: {technical_path}")
    print(f"Relatório de negócio: {business_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
