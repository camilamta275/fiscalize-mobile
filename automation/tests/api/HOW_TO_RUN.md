## 1. Install test dependencies (first time only)

From the `automation/` folder, using its own virtual environment:

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Run the tests

From the `automation/` folder, with the venv active:

```bash
pytest tests/api
```

Run a single file:

```bash
pytest tests/api/test_cidadao.py
```

Run a single test:

```bash
pytest tests/api/test_cidadao.py::test_api
```

Run with more output (useful when something fails and you want to see the
actual response body):

```bash
pytest tests/api -v
```