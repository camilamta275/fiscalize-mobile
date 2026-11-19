"""Gera os relatórios técnico e de negócio em HTML a partir de metrics.json."""

# Created by AI.
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

sys.path.insert(0, str(Path(__file__).resolve().parent))

from runstore import latest_run_dir  # noqa: E402

# Created by AI.
TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

# Created by AI.
STATUS_LABELS = {
    "green": "Verde",
    "amber": "Amarelo",
    "red": "Vermelho",
    "unknown": "Sem dados",
}

# Created by AI.
STATUS_ICONS = {"green": "🟢", "amber": "🟡", "red": "🔴", "unknown": "⚪"}

# Created by AI.
BUSINESS_LABELS = {
    "M1": "Verificações aprovadas",
    "M2": "Verificações executadas",
    "M5": "Estabilidade das execuções",
    "M6": "Falhas aguardando correção",
}

# Created by AI.
# Updated by AI.
BUSINESS_HINTS = {
    "M1": "Das verificações desta rodada, quantas passaram.",
    "M2": "Quantas verificações rodaram.",
    "M5": "Rodadas recentes sem falha.",
    "M6": "Falhas conhecidas ainda abertas.",
}

# Created by AI.
# Textos do relatório de negócio: falam de funcionalidades e impacto, sem termos técnicos.
BUSINESS_BACKLOG_NOTES = {
    "TC02": "A regra de senha incorreta é validada; a mensagem exibida ao usuário ainda não é conferida.",
    "TC03": "O registro funciona, mas o conteúdo salvo e a presença na lista do cidadão ainda não são conferidos por completo.",
    "TC04": "A tela já barra descrições curtas demais, mas o sistema não impede o mesmo erro por outros caminhos.",
    "TC05": "O número de protocolo entregue ao cidadão tem o formato conferido; ainda não é verificado a cada entrega.",
    "TC06": "O acesso do gestor e o bloqueio de ações restritas ao cidadão são testados; ainda não a cada entrega.",
    "TC08": "O aviso ao cidadão sobre mudança de status é testado; ainda não a cada entrega.",
    "TC09": "A mudança de status aparece para o cidadão; o histórico completo do chamado ainda não é conferido.",
    "TC12": "O cadastro e suas regras são validados; o aceite da política de privacidade é testado, mas ainda não a cada entrega.",
    "TC14": "O filtro e a busca na fila do gestor ainda não têm nenhuma verificação.",
    "TC19": "O bloqueio de cadastro de menores de 18 anos é testado; ainda não a cada entrega.",
}

# Created by AI.
BUSINESS_GAPS = {
    "D1": ("O sistema não impede descrições fora do limite quando a regra é contornada fora da tela do app.", "Decidir onde a regra deve valer e passar a verificá-la."),
    "D3": ("O plano de testes se contradiz em dois pontos.", "Alinhar o documento para que todos validem a mesma regra."),
    "D4": ("A numeração dos casos de teste não bate entre os documentos.", "Adotar uma única numeração e corrigir a rastreabilidade."),
    "D5": ("Uma parte das verificações do sistema não executa nenhum teste.", "Criar essas verificações com a equipe do sistema."),
    "D6": ("A verificação rápida feita em cada alteração só confere se o sistema está no ar.", "Trocá-la por uma jornada real do usuário."),
    "D7": ("Os testes que usam o app de verdade existem, mas só rodam quando alguém pede.", "Fazê-los rodar automaticamente e acompanhar o resultado."),
    "D8": ("O bloqueio de menores e o aceite da política de privacidade já existem no app, mas não são verificados a cada entrega.", "Incluir esses cenários na verificação automática."),
}

# Created by AI.
GLOSSARY = [
    ("Pipeline", "Sequência automática que roda as verificações a cada alteração no código."),
    ("Regressão", "Execução completa da suíte, feita diariamente e antes de entregas."),
    ("Quality Gate", "Conjunto de verificações que precisa passar antes de um código ser integrado."),
    ("MFA", "Verificação em duas etapas, com código enviado por e-mail."),
    ("Suíte primária", "Conjunto principal de verificações usado nos indicadores."),
]

# Created by AI.
def load_payload(path: Path) -> dict:
    """Lê o metrics.json produzido pela etapa de coleta automática."""
    return json.loads(path.read_text(encoding="utf-8"))


# Created by AI.
def _summary_line(payload: dict) -> str:
    """Monta a frase de abertura do relatório de negócio."""
    metrics = payload["metrics"]
    executed = int(metrics["M2"]["value"] or 0)
    passed = metrics["M1"]["display"]
    coverage = payload["coverage"]

    if payload["overall"] == "green":
        opening = "As verificações automáticas do produto estão saudáveis."
    elif payload["overall"] == "amber":
        opening = "As verificações automáticas exigem atenção."
    elif payload["overall"] == "red":
        opening = "As verificações automáticas indicam risco para a entrega."
    else:
        opening = "Não foi possível concluir o estado das verificações automáticas."

    return (
        f"{opening} Nesta execução foram realizadas {executed} verificações, "
        f"com {passed} de aprovação. "
        f"A cobertura do backlog priorizado está em {coverage['display']}, "
        f"com {coverage['missing']} funcionalidade(s) ainda sem verificação automática."
    )


# Created by AI.
# Updated by AI.
def _view(payload: dict) -> dict:
    """Prepara os dados derivados usados pelos dois modelos HTML."""
    primary_suites = [suite for suite in payload["suites"] if suite["primary"]]
    complementary_suites = [suite for suite in payload["suites"] if not suite["primary"]]
    total = sum(suite["total"] for suite in primary_suites)
    passed = sum(suite["passed"] for suite in primary_suites)
    failed = sum(suite["failed"] for suite in primary_suites)
    skipped = sum(suite["skipped"] for suite in primary_suites)
    execution_total = total - skipped
    pass_rate = (passed / execution_total * 100) if execution_total else 0
    return {
        "payload": payload,
        "default_branch": payload["default_branch"],
        "metrics": payload["metrics"],
        "metric_order": ["M1", "M2", "M5", "M6"],
        "labels": STATUS_LABELS,
        "icons": STATUS_ICONS,
        "business_labels": BUSINESS_LABELS,
        "business_hints": BUSINESS_HINTS,
        "glossary": GLOSSARY,
        "summary_line": _summary_line(payload),
        "primary_suites": primary_suites,
        "complementary_suites": complementary_suites,
        "failures": payload["failures"],
        "issues": payload["issues"],
        "coverage": payload["coverage"],
        "backlog": payload["backlog"],
        "gaps": payload["gaps"],
        "business_gaps": [
            {"id": gap_id, "summary": summary, "decision": decision}
            for gap_id, (summary, decision) in BUSINESS_GAPS.items()
        ],
        "business_backlog": [
            {**case, "note": BUSINESS_BACKLOG_NOTES.get(case["id"], case["note"])}
            for case in payload["backlog"]
        ],
        "interpretations": payload.get("interpretations", []),
        "history": payload["history"],
        "run": payload["run"],
        "generated_at": payload["generated_at"],
        "execution": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": pass_rate,
        },
    }


# Created by AI.
def render(environment: Environment, template_name: str, view: dict) -> str:
    """Renderiza um dos modelos HTML."""
    return environment.get_template(template_name).render(**view)


# Created by AI.
def generate(
    payload: dict,
    output_dir: Path,
    technical: str = "technical-report.html",
    business: str = "business-report.html",
    index: str | None = "index.html",
) -> tuple[Path, Path]:
    """Grava os dois relatórios HTML e devolve os caminhos gerados."""
    view = _view(payload)

    environment = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    technical_path = output_dir / technical
    business_path = output_dir / business

    technical_path.write_text(
        render(environment, "technical.html.j2", view),
        encoding="utf-8",
    )
    business_path.write_text(
        render(environment, "business.html.j2", view),
        encoding="utf-8",
    )

    if index:
        shutil.copyfile(business_path, output_dir / index)

    return technical_path, business_path


# Created by AI.
def _default_input() -> Path | None:
    """Localiza o metrics.json da execução mais recente em reports/runs."""
    run_dir = latest_run_dir(Path("reports"))
    return run_dir / "metrics.json" if run_dir else None


# Created by AI.
def main() -> int:
    """Lê metrics.json e grava os relatórios técnico e de negócio."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=None,
        help="metrics.json (padrão: a execução mais recente em reports/runs).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Diretório de saída (padrão: o mesmo do --input).",
    )
    parser.add_argument("--technical", default="technical-report.html")
    parser.add_argument("--business", default="business-report.html")
    parser.add_argument("--index", default="index.html", help="Cópia do relatório de negócio para o GitHub Pages.")
    args = parser.parse_args()

    input_path = args.input or _default_input()
    if input_path is None:
        print(
            "::error::Nenhuma execução encontrada em reports/runs. "
            "Rode primeiro: python scripts/metrics.py --reports-dir reports",
            file=sys.stderr,
        )
        return 1

    try:
        payload = load_payload(input_path)
    except FileNotFoundError:
        print(
            f"::error::Arquivo de métricas não encontrado: {input_path}. "
            "Rode primeiro: python scripts/metrics.py --reports-dir reports "
            "--output reports/metrics.json",
            file=sys.stderr,
        )
        return 1

    technical_path, business_path = generate(
        payload,
        args.output_dir or input_path.parent,
        technical=args.technical,
        business=args.business,
        index=args.index,
    )

    print(f"Relatório técnico: {technical_path}")
    print(f"Relatório de negócio: {business_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
