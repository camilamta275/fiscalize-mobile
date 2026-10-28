"""Converte a saída JSON do Jest em um relatório JUnit XML."""

# Created by AI.
from __future__ import annotations

import argparse
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

# Created by AI.
MAX_MESSAGE = 500


# Created by AI.
def _seconds(milliseconds: float | int | None) -> str:
    """Converte a duração do Jest (ms) para o formato do JUnit (s)."""
    return f"{(milliseconds or 0) / 1000:.3f}"


# Created by AI.
def _add_assertion(suite: ET.Element, file_name: str, assertion: dict) -> tuple[int, int, int, float]:
    """Adiciona um caso de teste e devolve total, falhas, ignorados e tempo."""
    case = ET.SubElement(
        suite,
        "testcase",
        classname=file_name,
        name=assertion.get("fullName") or assertion.get("title") or "?",
        time=_seconds(assertion.get("duration")),
    )

    status = assertion.get("status")
    if status == "failed":
        messages = "\n".join(assertion.get("failureMessages") or [])
        first_line = messages.splitlines()[0] if messages else "Falha sem mensagem"
        failure = ET.SubElement(case, "failure", message=first_line[:MAX_MESSAGE])
        failure.text = messages
        return 1, 1, 0, (assertion.get("duration") or 0) / 1000

    if status in {"pending", "skipped", "todo", "disabled"}:
        ET.SubElement(case, "skipped")
        return 1, 0, 1, (assertion.get("duration") or 0) / 1000

    return 1, 0, 0, (assertion.get("duration") or 0) / 1000


# Created by AI.
def convert(payload: dict) -> ET.Element:
    """Converte o JSON do Jest em uma árvore JUnit."""
    suites = ET.Element("testsuites", name="jest")
    total = failures = skipped = 0
    total_time = 0.0

    for result in payload.get("testResults", []):
        file_name = result.get("name", "jest")
        suite = ET.SubElement(suites, "testsuite", name=file_name)
        suite_total = suite_failures = suite_skipped = 0
        suite_time = 0.0

        for assertion in result.get("assertionResults", []):
            case_total, case_failures, case_skipped, case_time = _add_assertion(
                suite, file_name, assertion
            )
            suite_total += case_total
            suite_failures += case_failures
            suite_skipped += case_skipped
            suite_time += case_time

        # O Jest marca a suíte inteira como falha quando o arquivo não compila
        # ou não pode ser carregado; nesse caso não há assertionResults.
        if result.get("status") == "failed" and not result.get("assertionResults"):
            message = result.get("message") or "Arquivo de teste não pôde ser executado"
            case = ET.SubElement(
                suite,
                "testcase",
                classname=file_name,
                name="<suíte>",
                time="0.000",
            )
            failure = ET.SubElement(case, "failure", message=message.splitlines()[0][:MAX_MESSAGE])
            failure.text = message
            suite_total += 1
            suite_failures += 1

        suite.set("tests", str(suite_total))
        suite.set("failures", str(suite_failures))
        suite.set("errors", "0")
        suite.set("skipped", str(suite_skipped))
        suite.set("time", f"{suite_time:.3f}")

        total += suite_total
        failures += suite_failures
        skipped += suite_skipped
        total_time += suite_time

    suites.set("tests", str(total))
    suites.set("failures", str(failures))
    suites.set("errors", "0")
    suites.set("skipped", str(skipped))
    suites.set("time", f"{total_time:.3f}")
    return suites


# Created by AI.
def main() -> int:
    """Converte o arquivo de origem e grava o JUnit no destino."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    if not args.source.exists():
        print(f"::warning::JSON do Jest não encontrado em {args.source}", file=sys.stderr)
        return 0

    try:
        payload = json.loads(args.source.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        print(f"::warning::Não foi possível ler {args.source}: {error}", file=sys.stderr)
        return 0

    suites = convert(payload)
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(suites).write(args.destination, encoding="utf-8", xml_declaration=True)
    print(f"JUnit gerado em {args.destination} ({suites.get('tests')} casos).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
