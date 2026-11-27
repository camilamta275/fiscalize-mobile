"""Garante que os relatórios do pytest sempre sejam gerados em automation/reports/."""

# Created by AI.
from pathlib import Path

import pytest

# Created by AI.
REPORTS_DIR = Path(__file__).resolve().parent / "reports"


# Created by AI.
@pytest.hookimpl(tryfirst=True)
def pytest_configure(config: pytest.Config) -> None:
    """Define os caminhos padrão dos relatórios, sem sobrescrever flags explícitas."""
    option = config.option
    if getattr(option, "xmlpath", None) is None:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        option.xmlpath = str(REPORTS_DIR / "api-junit.xml")
    if hasattr(option, "htmlpath") and getattr(option, "htmlpath", None) is None:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        option.htmlpath = REPORTS_DIR / "api-report.html"
