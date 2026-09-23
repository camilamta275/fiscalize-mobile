# API Automation Guide

The automation suite contains pytest-based integration tests for the Fiscalize
backend API. The API tests are located in `automation/tests/api/tests/`.

## 1. Prerequisites

- Python 3
- A running Fiscalize backend
- Test user credentials in `automation/data/credentials.json`

The API endpoints default to `http://localhost:3000` in
`automation/tests/api/config/settings.py`.

## 2. Python environment

The suite uses its own virtual environment. From the repository root:

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

In VS Code, select `automation/.venv/bin/python3` as the Python interpreter.
The repository's `.vscode/settings.json` already configures this interpreter as
the default.

## 3. Project structure

```text
automation/
├── pytest.ini
├── requirements.txt
├── data/
│   └── credentials.json
└── tests/
    └── api/
        ├── config/settings.py
        ├── conftest.py
        └── tests/
```

`automation/tests/api/config/settings.py` centralizes the backend URLs.
`automation/tests/api/conftest.py` provides fixtures for generated test values,
configured credentials, and authenticated requests.

## 4. Test data and configuration

The `credentials` fixture loads the `login` object from
`automation/data/credentials.json`. Keep test credentials in that file and do
not commit real user passwords.

To target another backend, update `Endpoints.BASE_URL` in
`automation/tests/api/config/settings.py`.

## 5. Running tests

From `automation/`, with the virtual environment active and the backend
running:

```bash
pytest tests/api/tests
```

Run a single test file:

```bash
pytest tests/api/tests/test_cidadao.py
```

Run a single test:

```bash
pytest tests/api/tests/test_cidadao.py::test_api
```

Run with verbose output:

```bash
pytest tests/api/tests -v
```

`pytest.ini` enables verbose console logging and writes the self-contained HTML
report to `automation/report.html`.

See [tests/api/README.md](tests/api/README.md) for the API-specific setup and
run commands.
