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

From `automation/`, with the backend running at `http://localhost:3000`:

```bash
cd ../backend
npm run dev
```

Then, in another terminal:

```bash
cd automation
pytest tests/api/tests
```

The API test session checks `/health` once before running. If the backend is
unavailable, tests are marked as skipped with an actionable message instead of
failing with repeated connection errors. To use another URL, update
`Endpoints.BASE_URL` in `tests/api/config/settings.py`.

After creating or updating the backend schema, apply migrations before running
the suite:

```bash
cd ../backend
npx prisma migrate deploy
```

### MFA preconditions

Every login requires a `deviceId`, and the first login from an unknown device
returns `mfaRequired` with an emailed six-digit code. The suite does **not**
bypass that step: the fixtures in `tests/api/conftest.py` complete the real
flow end to end.

The test process cannot read the mailbox, but the backend stores only the
SHA-256 of a six-digit numeric code. Since that search space is small, the
fixtures recover the exact code that would have been emailed and submit it to
`POST /auth/2fa/verify`, the same endpoint the app uses. Critical actions do the
same with `/auth/2fa/request-critical`. No database state is forged: the only
direct SQL is read-only, plus one update that moves a challenge's expiration
into the past to cover the expiry rule.

This requires:

- the `psycopg` driver (`pip install -r requirements.txt`);
- `DATABASE_URL` available in `backend/.env`, or exported as `DATABASE_URL` or
  `FISCALIZE_DATABASE_URL` (the Prisma-only `?schema=` parameter is stripped
  automatically).

When the database is unreachable or the MFA migration is missing, the affected
scenarios are skipped with an actionable message instead of failing. Set
`FISCALIZE_TEST_TOKEN` to reuse a token obtained manually, and
`FISCALIZE_TEST_DEVICE_ID` to change the device identifier suffix used by the
fixtures.

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

### Execution reports

The GitHub Actions workflow writes JUnit XML and self-contained HTML reports to
`automation/reports/` (ignored by git) and publishes them as run artifacts. Each
artifact is laid out as `fiscalize-mobile/reports/`, with the XML/HTML files and,
for the API jobs, the backend log. To reproduce locally:

```bash
cd automation
mkdir -p reports
pytest tests/api/tests \
  --junitxml=reports/api-junit.xml \
  --html=reports/api-report.html \
  --self-contained-html
```

`scripts/junit_summary.py` renders those XML files as a Markdown table (used in
the workflow step summary) and `scripts/jest_to_junit.py` converts the Jest JSON
output of the backend unit tests into JUnit XML. The workflow also opens or
updates a `falha-ci` issue when any job fails, linking the run and its artifacts.

See [tests/api/README.md](tests/api/README.md) for the API-specific setup and
run commands.
