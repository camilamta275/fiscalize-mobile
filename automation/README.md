# Guia de Automação

<!-- Updated by AI. -->
A suíte de automação reúne os testes de integração da API do Fiscalize, escritos
em pytest.

## 1. Pré-requisitos

- Backend do Fiscalize em execução para os testes de API.
- Credenciais de teste em `automation/data/credentials.json`, quando necessário.
- Python 3.12+ (veja [Ambiente Python](#5-ambiente-python)).

Os endpoints da API apontam por padrão para `http://localhost:3000`, definido em
`automation/tests/api/config/settings.py`.

## 2. Estrutura

```text
automation/
├── data/credentials.json
└── tests/
    └── api/
        ├── config/settings.py
        ├── conftest.py
        └── tests/
```

`settings.py` centraliza as URLs do backend e `conftest.py` fornece os fixtures de
valores gerados, credenciais e requisições autenticadas.

## 3. Dados de teste

O fixture `credentials` lê o objeto `login` de
`automation/data/credentials.json`. Mantenha as credenciais de teste nesse arquivo
e nunca versione senhas reais. Para apontar para outro backend, altere
`Endpoints.BASE_URL` em `tests/api/config/settings.py`.

## 4. Quality Gate e proteção da branch principal

O workflow [`regressao.yml`](../.github/workflows/regressao.yml) funciona como
Quality Gate para as alterações propostas. Os checks obrigatórios são **Testes
unitários**, **Testes de API** e, em pull requests, o **Smoke test**.

Em **Settings > Branches > Branch protection rules** (ou **Rulesets**), configure:

- **Testes unitários**
- **Testes de API**, que em pull requests executa antes o **smoke test E2E**

O smoke test E2E percorre a jornada do cidadão pela API (login, abertura de
chamado e consulta de perfil) com os testes `test_login_user`,
`test_create_demand` e `test_get_user_profile`. Como ele roda dentro do job
`Testes de API`, uma falha no smoke bloqueia o merge sem exigir um check extra
no ruleset.

| Evento | Jobs executados | Testes |
| :--- | :--- | :--- |
| `push` (qualquer branch) | Testes unitários · Testes de API | Unitários do backend + `pytest tests/api/tests` |
| `pull_request` | Testes unitários · Testes de API | Os mesmos + smoke test E2E (executado primeiro) |
| `schedule` (`23 6 * * *` = 03:23 em Recife) e `workflow_dispatch` | Suíte completa de regressão | Unitários do backend + `pytest tests` |

O agendamento do GitHub Actions é *best-effort*: o horário pode atrasar ou a
execução pode não ocorrer em períodos de alta demanda. Por isso o cron usa um
minuto fora da hora cheia, e a regressão também pode ser disparada manualmente
em **Actions > Regressão > Run workflow**. Os relatórios de cada execução e a
issue automática de falha estão descritos em [Execution reports](#execution-reports).

Configure a proteção da branch principal no GitHub em **Settings > Branches >
Branch protection rules** (ou em **Rulesets**) com as seguintes opções:

1. Exigir um pull request antes do merge.
2. Exigir que os checks passem antes do merge.
3. Marcar `Testes unitários` e `Testes de API` como obrigatórios.
4. Exigir a branch atualizada antes do merge, quando aplicável.
5. Restringir o bypass a administradores e automações autorizadas.

Com isso, nenhum pull request é integrado enquanto um check obrigatório falhar. O
merge só acontece depois de todos os checks verdes e das aprovações registradas.

## 5. Ambiente Python

A suíte de API roda em `automation/.venv`, ignorado pelo git. Crie o ambiente uma
vez, a partir de `automation/`:

```bash
cd automation
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Os comandos abaixo assumem o ambiente ativo; caso contrário, use
`./.venv/bin/python -m pytest ...`.

## 6. Executando os testes de API

Com o backend no ar em `http://localhost:3000`:

```bash
cd backend && npm run dev
```

Em outro terminal:

```bash
cd automation
source .venv/bin/activate
pytest tests/api/tests
```

A sessão verifica `/health` uma vez. Se o backend estiver indisponível, os testes
são marcados como *skipped* com uma mensagem acionável, em vez de falharem com
erros de conexão repetidos. Depois de criar ou alterar o schema do backend,
aplique as migrações antes de rodar:

```bash
cd backend && npx prisma migrate deploy
```

Para rodar um arquivo, um teste ou com mais detalhe:

```bash
pytest tests/api/tests/test_cidadao.py
pytest tests/api/tests/test_cidadao.py::test_api
pytest tests/api/tests -v
```

### MFA

Todo login exige `deviceId`, e o primeiro login de um dispositivo desconhecido
retorna `mfaRequired` com um código de seis dígitos enviado por e-mail. A suíte não
contorna essa etapa: os fixtures de `tests/api/conftest.py` completam o fluxo real.
Como o backend guarda apenas o SHA-256 do código, os fixtures recuperam o valor
correto e o enviam a `POST /auth/2fa/verify` (e a `/auth/2fa/request-critical` nas
ações críticas). Nenhum estado é forjado: o SQL direto é somente leitura, exceto um
update que expira um desafio para cobrir a regra de expiração.

Requer o driver `psycopg` (instalado por `requirements.txt`) e `DATABASE_URL` em
`backend/.env` ou exportada como `DATABASE_URL`/`FISCALIZE_DATABASE_URL` — o
parâmetro `?schema=`, exclusivo do Prisma, é removido automaticamente. Sem banco ou
sem a migration de MFA, os cenários afetados são *skipped* com mensagem acionável.
`FISCALIZE_TEST_TOKEN` reaproveita um token obtido à mão e
`FISCALIZE_TEST_DEVICE_ID` muda o sufixo do identificador de dispositivo.

## 7. Execução do Maestro

Este runner cobre apenas os cenários sob responsabilidade desta implementação:

- TC02 / senha incorreta para usuário existente;
- teste complementar de conta inexistente;
- login do gestor como cobertura complementar mobile.


### Variáveis exigidas por fluxo

O script valida apenas as variáveis necessárias para os arquivos selecionados:

- `MAESTRO_TC02_EMAIL` — exigida somente para `login-senha-incorreta-usuario-existente.yaml`;
- `MAESTRO_TC06_EMAIL` — exigida somente para `login-gestor.yaml`;
- `MAESTRO_TC06_PASSWORD` — exigida somente para `login-gestor.yaml`;
- `login-senha-incorreta.yaml` não exige credenciais porque usa um e-mail inexistente e senha fixa literais no YAML.

As variáveis devem ser fornecidas no ambiente do processo que executa o Maestro; o script não lê nem grava segredos em arquivos versionados, e não imprime senhas, hashes, tokens ou URLs com credenciais.

### Requisitos de ambiente

Antes da execução real, o ambiente local precisa ter o Maestro disponível no PATH. Este runner não executa banco, migrações nem seed, e não instala dependências automaticamente.

### Execução do dry-run

```bash
cd automation
python scripts/run_maestro_e2e.py --dry-run
```

O `--dry-run` valida os arquivos selecionados, mostra as etapas previstas e interrompe antes de qualquer execução do Maestro. Ele não altera o banco, não executa migrações nem seed e não exige segredos.

### Execução real (somente após validação manual)

```bash
cd automation
python scripts/run_maestro_e2e.py automation/tests/e2e/login/login-senha-incorreta-usuario-existente.yaml automation/tests/e2e/login/login-senha-incorreta.yaml automation/tests/e2e/login/login-gestor.yaml
```

A execução real deve acontecer somente em ambiente validado e com o Maestro disponível no PATH. O runner não executa `npm install`, `prisma migrate deploy`, `npm run seed` ou qualquer preparação de banco; essas etapas ficam fora do escopo deste script.

### Observações sobre o Maestro

Com base na versão instalada do CLI, o comando `maestro test` aceita `-e/--env` para injetar variáveis de ambiente no fluxo e o YAML lê esses valores com `${NOME_DA_VARIAVEL}`. Este runner injeta as variáveis no ambiente do processo filho para evitar expor segredos na linha de comando visível do sistema.

## 8. Relatórios de execução

O `pytest.ini` já escreve dois relatórios em `automation/reports/` (criado
automaticamente): o HTML autocontido `api-report.html` e o JUnit XML
`api-junit.xml`. Localmente não é preciso passar flags; o workflow passa os próprios
caminhos `--html`/`--junitxml`, que sobrescrevem esses padrões para manter um
relatório por job.

O workflow publica esses arquivos como artefatos, com a estrutura
`fiscalize-mobile/reports/` e, nos jobs de API, o log do backend. O
`junit_summary.py` transforma os XML em tabela Markdown no resumo da execução, o
`jest_to_junit.py` converte o JSON do Jest em JUnit XML e, quando um job falha, o
workflow abre ou atualiza uma issue `falha-ci` com o link da execução e dos
artefatos.

## 8. Relatórios de qualidade

Cada execução relevante (push, pull request e agendamento) consolida as métricas e
gera dois HTML autocontidos:

- `technical-report.html` — resultado por suíte, falhas detalhadas com traceback e logs
  capturados, metas, cobertura
  do backlog, lacunas, issues `falha-ci` abertas e histórico recente.
- `business-report.html` — panorama para público não técnico: status geral,
  indicadores, riscos e decisões recomendadas.

Ambos saem no artefato `relatorios-qualidade` e, na branch padrão, no GitHub Pages
(`index.html` é o relatório de negócio; habilite o Pages com a branch `gh-pages`).
As definições, metas e métricas descartadas estão em
[Métricas de Qualidade](docs/Métricas%20de%20Qualidade.md).

### Execuções versionadas

Cada geração cria uma pasta nova em `reports/runs/`, então nada é sobrescrito:

```text
reports/
  api-junit.xml, api-report.html     # saída do pytest
  index.html                         # relatório de negócio da execução mais recente
  runs/
    2026-11-02_19-56-17/
      metrics.json
      technical-report.html
      business-report.html
      index.html
```

O nome é a data e hora local; use `--label` para escolher (no CI é `run-<número>`)
e duas execuções no mesmo segundo recebem `-2`, `-3`. O diretório `reports/` é
ignorado pelo git, então o histórico fica local.

Depois de rodar o pytest, um comando gera tudo:

```bash
cd automation
python scripts/quality_reports.py
```

Por padrão, esse comando consulta a API pública do GitHub para preencher M5
(estabilidade das execuções) e M6 (falhas aguardando correção). Use
`--no-fetch` em ambientes sem rede ou informe `--runs` e `--issues` para usar
exports locais.

Para rodar as duas etapas separadas (por exemplo, para inspecionar o
`metrics.json` antes):

```bash
cd automation
python scripts/metrics.py --reports-dir reports
python scripts/quality_report.py
```

Sem `--output`, o `metrics.py` cria uma execução nova em `reports/runs/`; sem
`--input`, o `quality_report.py` usa a mais recente, então as duas etapas caem na
mesma pasta.

### Preenchendo M5 e M6

M5 (taxa de falha) e M6 (issues `falha-ci` abertas) vêm da API do GitHub. Use
`--fetch` para coletar as duas sem exportar arquivos:

```bash
cd automation
python scripts/quality_reports.py --fetch
```

O repositório vem de `GITHUB_REPOSITORY` ou do remote `origin`; `--repo org/nome`
sobrescreve. Repositórios públicos dispensam autenticação (60 requisições por hora,
suficientes para as duas chamadas); defina `GH_TOKEN` para repositórios privados ou
limite maior. As respostas brutas ficam em `inputs/runs.json` e
`inputs/issues.json` dentro da execução, permitindo regenerá-la depois.

Para exportar manualmente:

```bash
GH_HOST=github.com gh api "repos/ORG/REPO/actions/runs?per_page=30&branch=main" > runs.json
GH_HOST=github.com gh api "repos/ORG/REPO/issues?labels=falha-ci&state=open&per_page=100" > issues.json
python scripts/quality_reports.py --runs runs.json --issues issues.json
```

Sem esses dados, M5 e M6 ficam "Sem dados" e o status geral é rebaixado para
amarelo, nunca verde. `--summary` anexa a tabela Markdown ao resumo do GitHub
Actions.

Veja [tests/api/README.md](tests/api/README.md) para detalhes específicos da suíte
de API.
