# Guia de Automacao

A automacao valida a API com Pytest e os fluxos mobile Android com Maestro.
Os testes ficam em `automation/tests/`; configuracoes e credenciais de teste em
`automation/tests/api/config/` e `automation/data/`.

## Estrutura

```text
automation/
├── data/credentials.json
├── tests/
│   ├── api/
│   └── e2e/
├── scripts/
└── reports/
```

## Testes de API

### Preparar

Com Python 3.12+:

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Inicie o backend em outro terminal:

```bash
cd backend
npm run dev
```

A API deve estar disponivel em `http://localhost:3000`. Mantenha credenciais
sinteticas em `data/credentials.json` e nunca versione dados reais.

### Executar

```bash
cd automation
source .venv/bin/activate
pytest tests/api/tests
```

Para rodar um arquivo ou teste:

```bash
pytest tests/api/tests/test_cidadao.py
pytest tests/api/tests/test_cidadao.py::test_api
```

Se houver alteracao no schema ou migracao do banco:

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

Alguns cenarios exigem MFA e banco de dados configurado. Defina
`DATABASE_URL` no backend ou exporte `FISCALIZE_DATABASE_URL`; sem esses
pre-requisitos, os cenarios afetados podem ser ignorados com orientacao.

## Testes E2E mobile

Os fluxos Maestro ficam em `automation/tests/e2e/`. Eles usam o app Android
real, emulador e backend real. A suíte principal cobre registro de chamado,
acompanhamento pelo cidadão, atualização pelo gestor e notificação.

### Preparar o ambiente

- Emulador Android iniciado e reconhecido por `adb devices`.
- JDK 21 e Android SDK configurados.
- Maestro instalado no `PATH`.
- App instalado no emulador com o pacote `br.com.fiscalize.mobile`.
- Backend iniciado e com dados seed.

No macOS, o app pode ser instalado com:

```bash
cd mobile
npm install
npx expo run:android
```

Se necessario, configure `JAVA_HOME`, `ANDROID_HOME` e `ANDROID_SDK_ROOT`
para o JDK e o SDK instalados. Nao use JDK 26 para o build.

### Executar localmente

```bash
cd automation
E2E_OBRIGATORIO=1 python -m pytest tests/e2e -o addopts="" -v
```

Com `E2E_OBRIGATORIO=1`, ausencia de Maestro, `adb` ou dispositivo faz a
execucao falhar em vez de produzir verde sem teste real.

Para executar todos os fluxos YAML Maestro encontrados em `tests/e2e/`:

```bash
cd automation
maestro test tests/e2e
```

Para validar apenas um fluxo Maestro diretamente:

```bash
cd automation
maestro test tests/e2e/register/register-navigation.yaml
```

### Variaveis dos fluxos selecionados

O runner de login pode exigir:

- `MAESTRO_TC02_EMAIL`
- `MAESTRO_TC06_EMAIL`
- `MAESTRO_TC06_PASSWORD`

Forneca os valores no ambiente do processo. Não os grave em arquivos versionados.

## CI

O workflow `.github/workflows/e2e.yml` sobe PostgreSQL, migra e popula o backend,
gera o APK Android, inicia um emulador e executa a suíte E2E real. Ele roda em
pushes para `main`, sob demanda e diariamente.

O workflow `.github/workflows/regressao.yml` concentra os testes unitários,
testes de API e o smoke test de API usado como gate em pull requests.

## Relatorios

O Pytest gera relatórios em `automation/reports/`:

- `api-report.html`
- `api-junit.xml`
- `e2e-junit.xml`, quando executado no workflow E2E

O workflow publica os relatórios como artefatos e resume falhas no GitHub Actions.
