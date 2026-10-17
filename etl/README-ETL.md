# ETL Fiscalize — População e Clima

ETLs desenvolvidas para enriquecer os dados de chamados urbanos do Fiscalize com fontes públicas externas: condições climáticas (Open-Meteo) e população por bairro (Censo IBGE 2022). Os dados brutos são gravados no MongoDB e os dados já cruzados/transformados no SQLite.

## Pré-requisitos

- Python 3.10.
- Dependências listadas em [requirements.txt](requirements.txt): `black`, `requests`, `pymongo`, `python-dotenv`, `pandas`, `beautifulsoup4`, `sqlalchemy`, `psycopg2-binary`.
- Acesso ao cluster MongoDB do projeto (ver [Variáveis de ambiente](#variáveis-de-ambiente) abaixo).

## Estrutura de pastas

```
etl/
├── data/
│   └── chamados.json       # chamados fictícios usados como entrada dos dois ETLs
├── notebooks/
│   ├── clima.ipynb         # rascunho exploratório do ETL de clima
│   └── populacao.ipynb     # rascunho exploratório do ETL de população
├── src/
│   ├── extract.py          # Extract: busca dados na Open-Meteo e no IBGE
│   ├── transform.py        # Transform: organiza, padroniza e cruza os dados
│   └── load.py              # Load: grava dados brutos no MongoDB e dados cruzados no SQLite
|   └── seed_mongo.py      # Seed: funções que extraem da API e populam o Mongo
├── run_etl.py               # ponto de entrada do pipeline (Extract -> Transform -> Load), em main()
├── requirements.txt
├── .env.example              # modelo de variáveis de ambiente (sem credenciais reais)
└── .env                       # variáveis de ambiente reais (não versionado)
```

Os notebooks em `notebooks/` são rascunhos exploratórios: reimplementam a lógica de `src/` manualmente (inclusive com a lista de chamados fictícios colada diretamente no notebook), mas **não fazem parte do pipeline executável** — não são chamados por `run_etl.py`. Servem como material de referência de como o pipeline foi desenhado.

## Configuração do ambiente

### 1. Criar e ativar o ambiente virtual

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux/Mac**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 3. Variáveis de ambiente

O pipeline lê a variável `MONGODB_URI` (via `python-dotenv` + `os.getenv`, em [src/extract.py](src/extract.py) e [src/load.py](src/load.py)) para conectar ao MongoDB. É a única variável de ambiente que o código atualmente utiliza — o nome do banco (`FISCALIZE_ETL`) e o do arquivo SQLite (`fiscalize_etl.db`) estão fixos no código, não vêm de variável de ambiente.

Para configurar:

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Preencha `MONGODB_URI` no `.env` com a connection string do cluster MongoDB Atlas do projeto (`smart-city`). Peça a connection string a um responsável pelo projeto, ou obtenha-a diretamente no MongoDB Atlas em **Database > Connect**, caso já tenha acesso ao cluster.

3. Preencha `DATABASE_URL` no `.env` com a connection string do banco Neon (Postgres) do projeto. Peça a connection string a um responsável pelo projeto, ou obtenha-a diretamente no painel do Neon em **Connection Details**, caso já tenha acesso ao projeto.

4. **Nunca** commite o `.env` com valores reais ele já está listado no `.gitignore` da raiz do repositório.

## Como executar o pipeline

O script `run_etl.py` usa caminhos relativos (`data/chamados.json` e o arquivo `fiscalize_etl.db`), então **precisa ser executado com o diretório de trabalho dentro de `etl/`**.

```bash
cd etl
python run_etl.py
```

Hoje, `main()` em [run_etl.py](run_etl.py) executa dois etls `run_populacao()` e `run_clima()`.

## ETL de Clima

### Objetivo

Relacionar os chamados urbanos às condições climáticas do período em que foram registrados, permitindo analisar possíveis relações entre ocorrências urbanas e fatores como chuva e temperatura.

### Fonte

**Open-Meteo** — API pública de dados meteorológicos.

- Documentação: https://open-meteo.com/en/docs
- API: https://archive-api.open-meteo.com/v1/archive

### Modelo de tabela final

| chamado | categoria | data | precipitação | temperatura |
|---|---|---|---|---|
| 001 | Buraco | ... | 12.4 mm | 26.8 °C |
| 002 | Buraco | ... | 18.2 mm | 25.9 °C |
| 003 | Sinalização | ... | 0 mm | 29.1 °C |

### Fluxo

```text
1. Extract
   └── Open-Meteo — dados climáticos

2. Transform
   ├── Organizar dados climáticos
   ├── Padronizar datas
   └── Preparar DataFrames

3. Merge
   └── Chamados + dados climáticos

4. Análise
   └── Relação entre chamados, precipitação e temperatura

5. Load
   ├── MongoDB → clima_raw
   └── SQLite  → chamados_clima
```

Destinos: MongoDB → coleção `clima_raw` (dados brutos); SQLite → tabela `chamados_clima` (dados cruzados).

## ETL de População

### Objetivo

Relacionar a quantidade de chamados urbanos à população de cada bairro, permitindo comparar os bairros considerando seu tamanho populacional. A principal métrica gerada é a quantidade de chamados para cada 1.000 habitantes.

### Fonte

**IBGE — Censo Demográfico 2022**, utilizando o arquivo de população por bairro disponibilizado no diretório público do IBGE.

- Agregados por bairro: https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/
- Arquivo: `Agregados_por_bairros_demografia_BR.zip`

### Modelo de tabela final

| Bairro | Chamados | População | Chamados por 1.000 |
|---|---:|---:|---:|
| BOA VIAGEM | 2 | 125755 | 0.02 |
| IMBIRIBEIRA | 1 | ... | ... |
| AFOGADOS | 1 | ... | ... |

### Fluxo

```text

1. Extract
   └── IBGE — população por bairro Dados brutos (17.576 registros)

2. Transform
   ├── Selecionar dados necessários
   ├── Filtrar bairros de Recife
   ├── Padronizar nomes
   └── Preparar DataFrame

3. Merge
   └── Chamados + população

4. Análise
   └── Chamados por 1.000 habitantes

5. Load
   ├── MongoDB → populacao_ibge_raw
   └── SQLite  → chamados_populacao
```

Destinos: MongoDB → coleção `populacao_ibge_raw` (dados brutos); SQLite → tabela `chamados_populacao` (dados cruzados).

## Troubleshooting

**`FileNotFoundError: [Errno 2] No such file or directory: 'data/chamados.json'`**
O script foi executado fora da pasta `etl/`. Rode `cd etl` antes de `python run_etl.py` (ver [Como executar o pipeline](#como-executar-o-pipeline)).

**Erro ao conectar no MongoDB (timeout, autenticação, etc.)**
Confira se o arquivo `.env` existe dentro de `etl/` e se `MONGODB_URI` está preenchida com uma connection string válida (ver [Variáveis de ambiente](#variáveis-de-ambiente)).

**`ModuleNotFoundError: No module named 'src'`**
Confirme que o ambiente virtual está ativado e que as dependências foram instaladas (`pip install -r requirements.txt`), e que o comando está sendo executado a partir de `etl/`.
