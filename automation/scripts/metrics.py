"""Consolida os resultados da pipeline nas métricas de qualidade M1, M2, M5 e M6."""

# Created by AI.
from __future__ import annotations

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from junit_summary import read_report  # noqa: E402
from runstore import new_run_dir  # noqa: E402

# Created by AI.
SCHEMA_VERSION = 1

# Created by AI.
# Faixas definidas em automation/docs/Métricas de Qualidade.md.
THRESHOLDS = {
    "M1": {
        "label": "Taxa de sucesso da suíte",
        "description": "Testes aprovados sobre testes executados nas suítes primárias.",
        "target": 0.98,
        "amber": 0.90,
        "target_display": "≥ 98%",
    },
    "M2": {
        "label": "Testes executados",
        "description": "Quantidade de casos executados nas suítes primárias.",
        "target": 1,
        "amber": 1,
        "target_display": "> 0",
    },
    "M5": {
        "label": "Taxa de falha de execução",
        "description": "Execuções com falha sobre execuções da janela recente.",
        "target": 0.0,
        "amber": 0.10,
        "window": 30,
        "target_display": "0% na branch padrão",
    },
    "M6": {
        "label": "Falhas abertas (falha-ci)",
        "description": "Issues abertas com o rótulo falha-ci e idade da mais antiga.",
        "target": 0,
        "amber": 3,
        "max_age_days": 5,
        "target_display": "nenhuma com mais de 5 dias",
    },
}

# Created by AI.
SUITE_LABELS = {
    "unit-junit.xml": "Testes unitários do backend",
    "api-junit.xml": "Jornadas do cidadão e do gestor (API)",
    "api-smoke-junit.xml": "Jornada essencial (smoke de pull request)",
    "regression-junit.xml": "Regressão completa",
    "regression-unit-junit.xml": "Testes unitários (regressão)",
}

# Created by AI.
PRIMARY_SUITES = {"unit-junit.xml", "api-junit.xml", "regression-junit.xml"}

# Created by AI.
# Situação do backlog em automation/docs/Cobertura do Backlog de Automação.md.
BACKLOG_CASES = [
    {
        "id": "TC01",
        "title": "Login do cidadão com credenciais válidas",
        "status": "covered",
        "tests": "test_user_login.py::test_login_user",
        "note": "Inclui o desafio de MFA de novo dispositivo.",
    },
    {
        "id": "TC02",
        "title": "Login com senha incorreta",
        "status": "covered",
        "tests": "test_user_login.py (5 casos)",
        "note": "Regra coberta via API; a mensagem na tela não é verificada.",
    },
    {
        "id": "TC03",
        "title": "Registro completo de chamado",
        "status": "partial",
        "tests": "test_cidadao.py::test_create_demand",
        "note": "Verifica apenas o HTTP 201, sem validar corpo nem listagem.",
    },
    {
        "id": "TC04",
        "title": "Limites de descrição e endereço",
        "status": "missing",
        "tests": "—",
        "note": "Divergência D1: decidir se a validação é no backend ou no app.",
    },
    {
        "id": "TC05",
        "title": "Formato do protocolo gerado",
        "status": "missing",
        "tests": "—",
        "note": "Divergência D2: o plano usa SCH-AAAA-NNNN e o sistema gera DEM-AAAAMMDD-XXXX.",
    },
    {
        "id": "TC06",
        "title": "Login do gestor e rotas restritas",
        "status": "missing",
        "tests": "—",
        "note": "O backend já responde 200 para gestor e 403 para cidadão; falta o teste.",
    },
    {
        "id": "TC08",
        "title": "Notificação in-app de mudança de status",
        "status": "missing",
        "tests": "—",
        "note": "Contraditório no plano: uma seção trata como manual.",
    },
    {
        "id": "TC09",
        "title": "Status e linha do tempo do chamado",
        "status": "missing",
        "tests": "—",
        "note": "Contraditório no plano: uma seção trata como manual.",
    },
    {
        "id": "TC12",
        "title": "Cadastro de novo cidadão",
        "status": "partial",
        "tests": "test_user_creation.py (11 casos)",
        "note": "Cadastro e validações cobertos; o aceite de LGPD não existe no produto.",
    },
    {
        "id": "TC14",
        "title": "Filtro e busca na fila do gestor",
        "status": "missing",
        "tests": "—",
        "note": "O endpoint GET /gestor/chamados?status= existe, mas não tem teste.",
    },
    {
        "id": "TC18",
        "title": "Exportação de dados pessoais",
        "status": "covered",
        "tests": "test_auth_security.py::test_rights_portal_exports_personal_data",
        "note": "Cobre o portal de direitos com MFA para ação crítica.",
    },
    {
        "id": "TC19",
        "title": "Bloqueio de cadastro de menores de 18 anos",
        "status": "missing",
        "tests": "—",
        "note": "A funcionalidade não existe no produto: não há data de nascimento no cadastro.",
    },
]

# Created by AI.
KNOWN_GAPS = [
    {
        "id": "D1",
        "summary": "O backend não valida os limites do TC04.",
        "decision": "Definir se a validação fica no backend ou no app e automatizar o caso.",
    },
    {
        "id": "D2",
        "summary": "O formato do protocolo no TC05 está errado no plano.",
        "decision": "Atualizar o caso para o formato DEM-AAAAMMDD-XXXX e automatizar via API.",
    },
    {
        "id": "D3",
        "summary": "Seções 5 e 6 do plano são contraditórias.",
        "decision": "Alinhar as duas seções do plano de testes.",
    },
    {
        "id": "D4",
        "summary": "A numeração de casos não bate entre os documentos.",
        "decision": "Adotar a numeração da rodada 2 e corrigir a matriz de rastreabilidade.",
    },
    {
        "id": "D5",
        "summary": "O job de testes unitários executa zero testes.",
        "decision": "Criar testes unitários no backend; exige alteração no repositório do backend.",
    },
    {
        "id": "D6",
        "summary": "O smoke de pull request cobre apenas o health check.",
        "decision": "Substituir por uma jornada real e mantê-lo como check obrigatório.",
    },
    {
        "id": "D7",
        "summary": "Não há testes mobile; nenhuma ferramenta E2E mobile está configurada.",
        "decision": "Definir a ferramenta (Maestro) e criar os fluxos, ou registrar formalmente que o E2E será via API.",
    },
    {
        "id": "D8",
        "summary": "TC19 e o aceite de LGPD do TC12 não têm funcionalidade no produto.",
        "decision": "Manter fora da automação até a funcionalidade existir.",
    },
]

# Created by AI.
STATUS_ICONS = {"green": "🟢", "amber": "🟡", "red": "🔴", "unknown": "⚪"}

# Created by AI.
STATUS_LABELS = {
    "green": "Verde",
    "amber": "Amarelo",
    "red": "Vermelho",
    "unknown": "Desconhecido",
}

# Created by AI.
STATUS_ORDER = {"green": 0, "unknown": 1, "amber": 2, "red": 3}


# Created by AI.
def _worst(statuses: list[str]) -> str:
    """Devolve o pior status da lista, tratando ausência de dados como amarelo."""
    known = [status for status in statuses if status]
    if not known:
        return "unknown"
    worst = max(known, key=lambda status: STATUS_ORDER.get(status, 1))
    return "amber" if worst == "unknown" else worst


# Created by AI.
def _format_value(metric_id: str, value: float | int | None) -> str:
    """Formata o valor da métrica para exibição nos relatórios."""
    if value is None:
        return "—"
    if metric_id in {"M1", "M5"}:
        return f"{value * 100:.1f}%".replace(".", ",")
    return str(int(value))


# Created by AI.
def _metric(metric_id: str, value: float | int | None, status: str, note: str = "") -> dict:
    """Monta o registro de uma métrica com valor, meta e status."""
    spec = THRESHOLDS[metric_id]
    return {
        "id": metric_id,
        "label": spec["label"],
        "description": spec["description"],
        "value": value,
        "display": _format_value(metric_id, value),
        "target": spec["target_display"],
        "status": status,
        "note": note,
    }


# Created by AI.
# Updated by AI.
def read_suites(reports_dir: Path) -> list[dict]:
    """Lê os relatórios JUnit XML encontrados e devolve as suítes normalizadas."""
    suites: dict[str, dict] = {}

    if reports_dir.exists():
        for path in sorted(reports_dir.rglob("*-junit.xml")):
            if path.name in suites:
                continue
            try:
                report = read_report(path)
            except (ET.ParseError, OSError) as error:
                print(f"::warning::Relatório inválido {path}: {error}", file=sys.stderr)
                continue

            report["label"] = SUITE_LABELS.get(path.name, path.name)
            report["primary"] = path.name in PRIMARY_SUITES
            report["failures"] = [
                {"test": identifier, "detail": detail}
                for identifier, detail in report["failures"]
            ]
            suites[path.name] = report

    return list(suites.values())


# Created by AI.
def _primary_totals(suites: list[dict]) -> tuple[int, int, int]:
    """Soma total, aprovados e ignorados apenas das suítes primárias."""
    primary = [suite for suite in suites if suite["primary"]]
    total = sum(suite["total"] for suite in primary)
    passed = sum(suite["passed"] for suite in primary)
    skipped = sum(suite["skipped"] for suite in primary)
    return total, passed, skipped


# Created by AI.
def _metric_m1(suites: list[dict]) -> dict:
    """Calcula M1: taxa de sucesso das suítes primárias."""
    total, passed, skipped = _primary_totals(suites)
    executed = total - skipped

    if executed <= 0:
        return _metric("M1", None, "red", "Nenhum teste executado nas suítes primárias.")

    ratio = passed / executed
    if ratio < THRESHOLDS["M1"]["amber"]:
        status = "red"
    elif ratio < THRESHOLDS["M1"]["target"]:
        status = "amber"
    else:
        status = "green"

    return _metric("M1", ratio, status, f"{passed} de {executed} executados passaram.")


# Created by AI.
def _metric_m2(suites: list[dict]) -> dict:
    """Calcula M2: quantidade de testes executados nas suítes primárias."""
    total, _passed, _skipped = _primary_totals(suites)

    if total <= 0:
        return _metric("M2", 0, "red", "Nenhum caso coletado: resultado vazio não é sucesso.")

    return _metric("M2", total, "green", f"{len([s for s in suites if s['primary']])} suíte(s) primária(s).")


# Created by AI.
def parse_runs(payload: object) -> list[dict]:
    """Normaliza o JSON da API de execuções em uma lista de execuções."""
    raw = payload.get("workflow_runs", []) if isinstance(payload, dict) else payload
    runs = []
    for item in raw:
        runs.append(
            {
                "id": item.get("id"),
                "conclusion": item.get("conclusion") or "unknown",
                "event": item.get("event") or "",
                "branch": item.get("head_branch") or "",
                "created_at": item.get("created_at") or "",
                "url": item.get("html_url") or "",
                "title": item.get("display_title") or "",
            }
        )
    return runs


# Created by AI.
def read_runs(path: Path) -> list[dict] | None:
    """Lê o histórico de execuções exportado pela API do GitHub."""
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        print(f"::warning::Histórico de execuções inválido {path}: {error}", file=sys.stderr)
        return None

    return parse_runs(payload)


# Created by AI.
def _metric_m5(runs: list[dict] | None, default_branch: str) -> dict:
    """Calcula M5: taxa de falha de execução na janela recente."""
    if runs is None:
        return _metric("M5", None, "unknown", "Histórico de execuções não disponível.")

    window = runs[: THRESHOLDS["M5"]["window"]]
    if not window:
        return _metric("M5", None, "unknown", "Nenhuma execução no histórico.")

    failed = [run for run in window if run["conclusion"] == "failure"]
    rate = len(failed) / len(window)
    main_failures = [
        run
        for run in failed
        if run["branch"] == default_branch and run["event"] in {"push", "schedule", "workflow_dispatch"}
    ]

    if main_failures:
        status = "red"
        note = f"{len(main_failures)} falha(s) na branch {default_branch}."
    elif rate > THRESHOLDS["M5"]["amber"]:
        status = "amber"
        note = f"{len(failed)} de {len(window)} execuções falharam."
    else:
        status = "green"
        note = f"{len(failed)} de {len(window)} execuções falharam."

    return _metric("M5", rate, status, note)


# Created by AI.
def parse_issues(payload: object) -> list[dict]:
    """Normaliza o JSON da API de issues, mantendo só as falhas abertas."""
    raw = payload if isinstance(payload, list) else payload.get("issues", [])
    issues = []
    for item in raw:
        labels = [label.get("name", "") for label in item.get("labels", [])]
        if "falha-ci" not in labels or item.get("state") != "open":
            continue
        issues.append(
            {
                "number": item.get("number"),
                "title": item.get("title") or "",
                "url": item.get("html_url") or "",
                "created_at": item.get("created_at") or "",
                "age_days": _age_days(item.get("created_at") or ""),
            }
        )
    return issues


# Created by AI.
def read_issues(path: Path) -> list[dict] | None:
    """Lê as issues abertas exportadas pela API do GitHub."""
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        print(f"::warning::Lista de issues inválida {path}: {error}", file=sys.stderr)
        return None

    return parse_issues(payload)


# Created by AI.
def _age_days(created_at: str) -> float | None:
    """Converte a data de criação em idade em dias."""
    if not created_at:
        return None
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError:
        return None
    return (datetime.now(timezone.utc) - created).total_seconds() / 86400


# Created by AI.
def _metric_m6(issues: list[dict] | None) -> dict:
    """Calcula M6: issues de falha abertas e idade da mais antiga."""
    if issues is None:
        return _metric("M6", None, "unknown", "Lista de issues não disponível.")

    count = len(issues)
    ages = [issue["age_days"] for issue in issues if issue["age_days"] is not None]
    oldest = max(ages) if ages else None

    max_age = THRESHOLDS["M6"]["max_age_days"]
    if count == 0:
        status = "green"
        note = "Nenhuma falha em aberto."
    elif count > THRESHOLDS["M6"]["amber"] or (oldest is not None and oldest > max_age):
        status = "red"
        note = (
            f"Falha em aberto há mais de {max_age} dias."
            if oldest is not None and oldest > max_age
            else f"{count} falhas em aberto."
        )
    else:
        status = "amber"
        note = f"{count} falha(s) em aberto; a mais antiga há {oldest:.0f} dia(s)." if oldest is not None else f"{count} falha(s) em aberto."

    return _metric("M6", count, status, note)


# Created by AI.
def _coverage() -> dict:
    """Resume a cobertura do backlog exibida como risco nos relatórios."""
    total = len(BACKLOG_CASES)
    covered = sum(1 for case in BACKLOG_CASES if case["status"] == "covered")
    partial = sum(1 for case in BACKLOG_CASES if case["status"] == "partial")
    missing = sum(1 for case in BACKLOG_CASES if case["status"] == "missing")
    ratio = (covered + 0.5 * partial) / total if total else 0.0

    if ratio < 0.5:
        status = "red"
    elif ratio < 0.8:
        status = "amber"
    else:
        status = "green"

    return {
        "total": total,
        "covered": covered,
        "partial": partial,
        "missing": missing,
        "ratio": ratio,
        "display": f"{ratio * 100:.0f}%".replace(".", ","),
        "status": status,
    }


# Created by AI.
def _run_metadata() -> dict:
    """Monta os metadados da execução a partir do ambiente do GitHub Actions."""
    server = os.getenv("GITHUB_SERVER_URL", "https://github.com")
    repository = os.getenv("GITHUB_REPOSITORY", "")
    run_id = os.getenv("GITHUB_RUN_ID", "")
    url = f"{server}/{repository}/actions/runs/{run_id}" if run_id and repository else ""

    return {
        "id": run_id,
        "number": os.getenv("GITHUB_RUN_NUMBER", ""),
        "event": os.getenv("GITHUB_EVENT_NAME", ""),
        "branch": os.getenv("GITHUB_REF_NAME", ""),
        "sha": os.getenv("GITHUB_SHA", ""),
        "repository": repository,
        "url": url,
    }


# Created by AI.
def build_payload(reports_dir: Path, runs: list[dict] | None, issues: list[dict] | None, default_branch: str) -> dict:
    """Monta o documento metrics.json consumido pelos relatórios."""
    suites = read_suites(reports_dir)
    metrics = {
        "M1": _metric_m1(suites),
        "M2": _metric_m2(suites),
        "M5": _metric_m5(runs, default_branch),
        "M6": _metric_m6(issues),
    }
    failures = [
        {"suite": suite["label"], "test": failure["test"], "detail": failure["detail"]}
        for suite in suites
        for failure in suite["failures"]
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "run": _run_metadata(),
        "default_branch": default_branch,
        "metrics": metrics,
        "overall": _worst([metric["status"] for metric in metrics.values()]),
        "suites": suites,
        "failures": failures,
        "issues": issues or [],
        "coverage": _coverage(),
        "backlog": BACKLOG_CASES,
        "gaps": KNOWN_GAPS,
        "history": (runs or [])[: THRESHOLDS["M5"]["window"]],
    }


# Created by AI.
def render_markdown(payload: dict) -> str:
    """Gera um resumo curto em Markdown para o step summary do GitHub Actions."""
    lines = [
        "## Relatórios de qualidade",
        "",
        "| Métrica | Valor | Meta | Status |",
        "| --- | ---: | --- | :--- |",
    ]
    for metric in payload["metrics"].values():
        lines.append(
            f"| {metric['id']} · {metric['label']} | {metric['display']} | "
            f"{metric['target']} | {STATUS_ICONS[metric['status']]} {STATUS_LABELS[metric['status']]} |"
        )

    lines.extend(
        [
            "",
            f"**Status geral:** {STATUS_ICONS[payload['overall']]} {STATUS_LABELS[payload['overall']]}",
            f"**Risco de cobertura do backlog:** {payload['coverage']['display']} "
            f"({payload['coverage']['covered']} cobertos, {payload['coverage']['partial']} parciais, "
            f"{payload['coverage']['missing']} não implementados).",
            "",
            "Relatórios: `technical-report.html` e `business-report.html` (artefato `relatorios-qualidade`).",
        ]
    )
    return "\n".join(lines)


# Created by AI.
def write_payload(payload: dict, path: Path) -> Path:
    """Grava o metrics.json, criando o diretório de destino se necessário."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return path


# Created by AI.
def emit_summary(markdown: str) -> None:
    """Anexa o resumo ao step summary do GitHub Actions, quando existir."""
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write(markdown + "\n")


# Created by AI.
def main() -> int:
    """Lê os insumos da pipeline, calcula as métricas e grava metrics.json."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reports-dir", type=Path, required=True)
    parser.add_argument("--runs", type=Path, default=None)
    parser.add_argument("--issues", type=Path, default=None)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Arquivo metrics.json (padrão: reports/runs/<execução>/metrics.json).",
    )
    parser.add_argument("--label", default=None, help="Nome da pasta da execução (padrão: data e hora local).")
    parser.add_argument("--default-branch", default=os.getenv("DEFAULT_BRANCH", "main"))
    parser.add_argument("--summary", action="store_true", help="Anexa o resumo ao step summary.")
    args = parser.parse_args()

    runs = read_runs(args.runs) if args.runs else None
    issues = read_issues(args.issues) if args.issues else None
    payload = build_payload(args.reports_dir, runs, issues, args.default_branch)

    output = args.output or (new_run_dir(Path("reports"), args.label) / "metrics.json")
    write_payload(payload, output)

    markdown = render_markdown(payload)
    print(markdown)
    print(f"\nMétricas: {output}")

    if args.summary:
        emit_summary(markdown)

    return 0


if __name__ == "__main__":
    sys.exit(main())
