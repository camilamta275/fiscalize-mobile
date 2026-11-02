"""Versiona cada execução dos relatórios de qualidade em reports/runs/<execução>."""

# Created by AI.
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

# Created by AI.
RUNS_DIRNAME = "runs"

# Created by AI.
LABEL_PATTERN = re.compile(r"[^A-Za-z0-9._-]+")


# Created by AI.
def sanitize_label(label: str) -> str:
    """Normaliza o rótulo da execução para uso seguro como nome de pasta."""
    cleaned = LABEL_PATTERN.sub("-", label).strip("-.")
    return cleaned or datetime.now().strftime("%Y-%m-%d_%H-%M-%S")


# Created by AI.
def new_run_dir(base: Path, label: str | None = None) -> Path:
    """Cria e devolve uma pasta nova para a execução, sem sobrescrever as anteriores."""
    stamp = sanitize_label(label) if label else datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    runs_dir = base / RUNS_DIRNAME

    candidate = runs_dir / stamp
    suffix = 2
    while candidate.exists():
        candidate = runs_dir / f"{stamp}-{suffix}"
        suffix += 1

    candidate.mkdir(parents=True)
    return candidate


# Created by AI.
def latest_run_dir(base: Path) -> Path | None:
    """Devolve a execução mais recente que já contém um metrics.json."""
    runs_dir = base / RUNS_DIRNAME
    if not runs_dir.exists():
        return None

    candidates = [
        path
        for path in runs_dir.iterdir()
        if path.is_dir() and (path / "metrics.json").exists()
    ]
    if not candidates:
        return None

    return max(candidates, key=lambda path: (path.stat().st_mtime, path.name))
