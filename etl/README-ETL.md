# ETL Fiscalize — População e Clima

ETLs desenvolvidas para enriquecer os dados de chamados urbanos do Fiscalize
com fontes públicas externas: condições climáticas (Open-Meteo) e população
por bairro (Censo IBGE 2022). Os dados brutos são gravados no MongoDB e os
dados transformados são carregados no SQLite e no Neon.

## Pré-requisitos

- Python 3.10.
- Dependências listadas em [requirements.txt](requirements.txt), incluindo
  `streamlit` para o dashboard.
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
│   ├── config.py           # carrega o .env uma única vez
│   ├── extract.py          # Extract: busca dados na Open-Meteo e no IBGE
│   ├── transform.py        # Transform: organiza, padroniza e cruza os dados
│   └── load.py              # Load: grava dados brutos no MongoDB e dados cruzados no SQLite
|   └── seed_mongo.py      # Seed: funções que extraem da API e populam o Mongo
├── run_etl.py               # ponto de entrada do pipeline (Extract -> Transform -> Load), em main()
├── ../dashboard/app.py      # dashboard Streamlit conectado ao Neon
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

O arquivo [src/config.py](src/config.py) lê o `.env` uma única vez e expõe
`MONGODB_URI`, `DATABASE_URL`, `MONGO_DATABASE`, `SQLITE_DATABASE` e o caminho
dos chamados. Os demais módulos importam essas configurações sem chamar
`os.getenv` ou `load_dotenv` novamente.

Para configurar:

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Preencha `MONGODB_URI` no `.env` com a connection string do cluster MongoDB Atlas do projeto (`smart-city`). Peça a connection string a um responsável pelo projeto, ou obtenha-a diretamente no MongoDB Atlas em **Database > Connect**, caso já tenha acesso ao cluster.

3. Preencha `DATABASE_URL` no `.env` com a connection string do banco Neon (Postgres) do projeto. Peça a connection string a um responsável pelo projeto, ou obtenha-a diretamente no painel do Neon em **Connection Details**, caso já tenha acesso ao projeto.

4. **Nunca** commite o `.env` com valores reais ele já está listado no `.gitignore` da raiz do repositório.

## Como executar o pipeline

Os caminhos são resolvidos a partir da pasta `etl/`, portanto o pipeline pode
ser executado a partir da raiz:

```bash
python etl/run_etl.py
```

O `main()` executa os dois ETLs. Como as funções usam por padrão os dados brutos
já armazenados, uma carga inicial pode ser feita chamando `run_clima(True)` ou
`run_populacao(True)` em um script Python.

## Histórico da camada bronze e auditoria

Cada carga bruta recebe `data_extracao` em UTC no momento da inserção no
MongoDB. O método de carga não apaga documentos antigos. Ao extrair uma
coleção, o pipeline seleciona somente os documentos pertencentes à maior
`data_extracao`, isto é, à carga mais recente.

O pipeline imprime contagens para auditoria:

- clima: documento bruto, registros climáticos transformados e chamados no
  destino;
- população: registros da carga bronze, registros após o filtro de Recife e
  bairros agregados na tabela final.

As contagens não precisam ser iguais. Na população, o IBGE entrega registros
de vários locais, a transformação mantém apenas Recife e a tabela final
agrega os dez chamados por bairro. No clima, um documento bruto contém listas
diárias; cada item da lista vira uma linha transformada, e o destino mantém
uma linha por chamado.

Não são usados índices fixos para descartar itens da fonte. A carga de clima
é validada para conter um documento completo, e todas as listas diárias são
convertidas em linhas.

## Dados ausentes

O IBGE pode representar ausência com campos vazios, `-`, `N/A`, `NA` ou `...`.
Esses marcadores são lidos como nulos e valores numéricos inválidos são
convertidos para `NaN`; eles não são convertidos para zero. Na Open-Meteo,
`0` de precipitação é preservado como zero porque significa ausência de chuva,
enquanto um valor ausente da fonte permanece nulo.

## Dashboard

O dashboard lê a tabela final `chamados_populacao` diretamente do Neon.
Ele oferece filtro por bairro, métricas de chamados/população e gráfico de
chamados por bairro.

A partir da raiz do repositório:

```bash
python -m streamlit run dashboard/app.py
```

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

**`FileNotFoundError` ao abrir `chamados.json`**
Confira se o arquivo está em `etl/data/chamados.json` e execute
`python etl/run_etl.py` a partir da raiz.

**Erro ao conectar no MongoDB (timeout, autenticação, etc.)**
Confira se o arquivo `.env` existe dentro de `etl/` e se `MONGODB_URI` está preenchida com uma connection string válida (ver [Variáveis de ambiente](#variáveis-de-ambiente)).

**`ModuleNotFoundError: No module named 'src'`**
Confirme que o ambiente virtual está ativado, que as dependências foram
instaladas (`pip install -r etl/requirements.txt`) e que o comando foi
executado conforme as instruções acima.

**Dados brutos sem `data_extracao`**
Se a coleção tiver apenas cargas antigas sem `data_extracao`, execute uma nova
carga pela função de seed para gerar documentos marcados. Quando houver uma
carga marcada, documentos legados são preservados, mas a transformação usa
somente a carga marcada mais recente.

**`must be owner of table` ao carregar no Neon**
O usuário da `DATABASE_URL` precisa ser proprietário das tabelas finais quando
o carregamento usa `if_exists="replace"`. Se o proprietário for outro usuário,
use no `.env` a connection string do proprietário ou peça ao responsável pelo
Neon para conceder a permissão necessária e alinhar o proprietário da tabela.

### Impedimento registrado para continuidade

Em 21/10/2026, a conexão configurada conseguiu acessar o Neon, mas a carga
falhou ao substituir `chamados_clima`:

```text
psycopg.errors.InsufficientPrivilege:
must be owner of table chamados_clima
```

Diagnóstico realizado sem expor a senha: o usuário conectado foi
`time_desenvolvimento` e o proprietário da tabela foi `neondb_owner`.
O próximo responsável deve obter a `DATABASE_URL` do proprietário ou alinhar
as permissões/propriedade no Neon. Depois disso, executar novamente:

```bash
python etl/run_etl.py
```
