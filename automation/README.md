# Mobile Automation Guide

This guide covers setting up and running the Appium + pytest mobile automation
suite located in `automation/`.

## 1. Prerequisites

### Node.js and Appium

```bash
npm install -g appium
appium --version
```

### UiAutomator2 Driver (Android)

```bash
appium driver install uiautomator2
```

### Appium Inspector

Download and install from:
https://github.com/appium/appium-inspector/releases

Use it to inspect elements and validate capabilities before wiring up a new
page object. Example desired capabilities for the inspector:

```json
{
  "platformName": "Android",
  "appium:deviceName": "emulator-5554",
  "appium:automationName": "UiAutomator2",
  "appium:appPackage": "com.app.package.android",
  "appium:appActivity": "com.app.package.android.view.activities.SplashActivity"
}
```

### Android emulator / device

Have an emulator running (or a physical device connected via ADB) before
starting the Appium server or running tests. `adb devices` should list it.

## 2. Python environment

The suite lives in `automation/` and uses its own virtual environment.

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Key dependencies (see `automation/requirements.txt`):
- `Appium-Python-Client` — Appium/WebDriver client
- `selenium` — `WebDriverWait` / `expected_conditions` used by page objects
- `pytest`, `pytest-html`, `pytest-metadata` — test runner and HTML reporting

### VS Code

If you open this repo (`fiscalize-mobile`) as the VS Code workspace, select
the automation venv as the Python interpreter so Pylance resolves `pytest`
and `appium` imports correctly:

`Cmd+Shift+P` → **Python: Select Interpreter** → `automation/.venv/bin/python3`

This is already configured as the default in `.vscode/settings.json` at the
repo root.

## 3. Project structure

```
automation/
├── conftest.py       # pytest fixtures: driver (Appium session), load_data_mobile
├── logger.py          # shared logger used across tests/pages
├── pytest.ini         # pytest config (test path, HTML report, logging)
├── requirements.txt
├── data/
│   └── data.json      # test fixture data (passwords, login credentials)
├── pages/
│   └── base_page.py    # BasePage with common Appium/Selenium helpers
└── tests/
    └── test.py
```

`BasePage` (`pages/base_page.py`) wraps common actions used by page objects:
`find_element`, `click_element`, `send_keys_to_element`, `scroll`,
`is_element_displayed`, etc. New page objects should subclass it.

## 4. Configuring capabilities

The Appium session capabilities are defined in the `driver` fixture in
`automation/conftest.py`. Before running against a different app build,
update:

- `appium:appPackage`
- `appium:appWaitActivity`
- `appium:deviceName` (if not using `emulator-5554`)

```python
options.load_capabilities({
    "platformName": "Android",
    "appium:deviceName": "emulator-5554",
    "appium:automationName": "UiAutomator2",
    "appium:appPackage": "com.app.package",
    "appium:appWaitActivity": "com.app.package.MainActivity",
    ...
})
```

The Appium server itself must be running separately in a terminal (`appium`) on
`http://127.0.0.1:4723` before tests execute — the fixture connects to that
address.

```bash
appium
```

## 5. Running tests

From `automation/`, with the venv active and Appium server + emulator running:

```bash
pytest
```

`pytest.ini` already sets:
- `testpaths = tests`
- an HTML report at `automation/report.html` (`--html=report.html --self-contained-html`)
- console logging at `INFO` level

Run a single test file or test:

```bash
pytest tests/test.py
pytest tests/test.py::test_name
```

## 6. Test data

Shared test data (e.g. login credentials, password validation cases) lives in
`automation/data/data.json` and is loaded via the `load_data_mobile` fixture
in `conftest.py`.
