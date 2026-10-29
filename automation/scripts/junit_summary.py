"""Gera um resumo em Markdown de relatórios JUnit XML para o GitHub Actions."""

# Created by AI.
from __future__ import annotations

import argparse
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

MAX_FAILURES = 50
MAX_DETAIL = 300


# Created by AI.
def _text(element: ET.Element | None) -> str:
    """Devolve o texto de um elemento normalizado em uma única linha."""
    if element is None or element.text is None:
        return ""
    return " ".join(element.text.split())


# Created by AI.
def _case_status(case: ET.Element) -> str:
    """Classifica um caso de teste como passed, failed ou skipped."""
    for child in case:
        if child.tag in {"failure", "error"}:
            return "failed"
        if child.tag == "skipped":
            return "skipped"
    return "passed"


# Created by AI.
def read_report(path: Path) -> dict:
    """Lê um relatório JUnit e devolve os totais e as falhas encontradas."""
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))

    failed = 0
    skipped = 0
    duration = 0.0
    failures: list[tuple[str, str]] = []

    for case in cases:
        duration += float(case.get("time") or 0)
        status = _case_status(case)

        if status == "skipped":
            skipped += 1
        elif status == "failed":
            failed += 1
            detail = _text(case.find("failure")) or _text(case.find("error"))
            classname = case.get("classname") or ""
            name = case.get("name") or "?"
            identifier = f"{classname}::{name}" if classname else name
            failures.append((identifier, detail[:MAX_DETAIL]))

    return {
        "name": path.name,
        "total": len(cases),
        "passed": len(cases) - failed - skipped,
        "failed": failed,
        "skipped": skipped,
        "duration": duration,
        "failures": failures,
        "missing": False,
    }


# Created by AI.
def _missing_report(path: Path) -> dict:
    """Representa um relatório que não foi gerado pela execução."""
    return {
        "name": path.name,
        "total": 0,
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "duration": 0.0,
        "failures": [],
        "missing": True,
    }


# Created by AI.
def _render_row(report: dict) -> str:
    """Monta a linha da tabela de um relatório."""
    if report["missing"]:
        return f"| `{report['name']}` | — | — | — | — | ⚠️ não gerado |"
    return (
        f"| `{report['name']}` | {report['total']} | {report['passed']} | "
        f"{report['failed']} | {report['skipped']} | {report['duration']:.1f}s |"
    )


# Created by AI.
def render(reports: list[dict], title: str) -> str:
    """Renderiza o resumo completo em Markdown."""
    lines = [
        f"## {title}",
        "",
        "| Relatório | Total | Passou | Falhou | Ignorado | Tempo |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    lines.extend(_render_row(report) for report in reports)

    failures = [
        (report["name"], identifier, detail)
        for report in reports
        for identifier, detail in report["failures"]
    ]
    executed = sum(report["total"] for report in reports)

    lines.append("")
    if executed == 0:
        lines.append(
            "⚠️ **Nenhum teste foi executado.** Verifique se a suíte foi "
            "coletada; um resultado vazio não deve ser tratado como sucesso."
        )
    elif failures:
        lines.append(f"### Falhas ({len(failures)})")
        lines.append("")
        for report_name, identifier, detail in failures[:MAX_FAILURES]:
            lines.append(f"- `{identifier}` — `{report_name}`")
            if detail:
                lines.append(f"  > {detail.replace('|', chr(92) + '|')}")
        if len(failures) > MAX_FAILURES:
            lines.append(
                f"- … e mais {len(failures) - MAX_FAILURES} falha(s); "
                "consulte o relatório XML anexado."
            )
    else:
        lines.append("Nenhuma falha registrada. ✅")

    return "\n".join(lines)


# Created by AI.
def main() -> int:
    """Lê os relatórios informados e anexa o resumo ao step summary."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", default="Resultados dos testes")
    parser.add_argument("--output", default=os.getenv("GITHUB_STEP_SUMMARY"))
    parser.add_argument("reports", nargs="+", type=Path)
    args = parser.parse_args()

    reports = []
    for path in args.reports:
        if not path.exists():
            reports.append(_missing_report(path))
            continue
        try:
            reports.append(read_report(path))
        except (ET.ParseError, OSError) as error:
            print(f"::warning::Relatório inválido {path}: {error}", file=sys.stderr)
            reports.append(_missing_report(path))

    markdown = render(reports, args.title)
    print(markdown)

    if args.output:
        with open(args.output, "a", encoding="utf-8") as summary:
            summary.write(markdown + "\n")

    return 0


if __name__ == "__main__":
    sys.exit(main())
