# Automation Guide

The automation suite contains integration tests for the Fiscalize backend API
and mobile end-to-end flows. Mobile tests use [Maestro](https://maestro.mobile.dev/)
and must not depend on Appium.

## 1. Prerequisites

- Maestro CLI, configured with an Android emulator or iOS simulator
- A running Fiscalize backend for API and mobile flows
- Test user credentials in `automation/data/credentials.json`, when required
- Python is not required for mobile tests

The API endpoints default to `http://localhost:3000` in
`automation/tests/api/config/settings.py`.

## 2. Mobile tests with Maestro

Store Maestro flows under `automation/tests/mobile/`. Run all mobile flows from
the repository root:

```bash
maestro test automation/tests/mobile
```

Run a single flow:

```bash
maestro test automation/tests/mobile/login.yaml
```

Maestro is responsible for interacting with the mobile application through the
configured emulator or simulator. Do not add Appium fixtures or Python-based
mobile tests.

## 3. Project structure

```text
automation/
├── data/
│   └── credentials.json
└── tests/
    └── api/
        ├── config/settings.py
        ├── conftest.py
        └── tests/
    └── mobile/
        └── *.yaml
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

## 5. Quality Gate e proteção da branch principal

O workflow de regressão em
[`.github/workflows/regressao.yml`](../.github/workflows/regressao.yml) funciona
como Quality Gate para alterações propostas. Os jobs obrigatórios são:

- **Testes unitários**
- **Testes de API**
- **Smoke test**, executado nas verificações de pull request

Configure a proteção da branch principal no GitHub em **Settings > Branches >
Branch protection rules** (ou em **Rulesets**) com as seguintes opções:

1. Exigir um pull request antes do merge.
2. Exigir que os checks passem antes do merge.
3. Adicionar os checks `Testes unitários` e `Testes de API` como obrigatórios.
4. Exigir que a branch esteja atualizada antes do merge, quando aplicável.
5. Restringir o bypass da proteção a administradores e automações autorizadas.

Com essa regra, um pull request não poderá ser integrado enquanto qualquer
check obrigatório falhar. O merge só deve ser realizado depois que todos os
checks forem concluídos com sucesso e as aprovações exigidas estiverem
registradas.

## 6. Running API tests

From `automation/`, with the backend running:

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
