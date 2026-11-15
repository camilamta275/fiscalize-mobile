# Orquestração da Pipeline ETL com Prefect

<!-- Updated by AI. -->

## 1. Objetivo

Esta atividade tem como objetivo utilizar o **Prefect** para orquestrar a pipeline ETL do projeto Fiscalize. A orquestração organiza as etapas de extração, transformação e carregamento dos dados, respeitando suas dependências e permitindo acompanhar a execução, visualizar logs e identificar possíveis falhas.

O fluxo foi implementado no arquivo `etl/flow_etl.py`, utilizando *tasks* para representar as etapas da pipeline e um *flow* para coordenar sua execução.

## 2. Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- Python 3.11;
- Git, para clonar o repositório;
- Visual Studio Code ou outro editor de código;
- Acesso às bases de dados utilizadas pelo projeto, incluindo MongoDB, PostgreSQL operacional do backend e Neon PostgreSQL;
- Arquivo `.env` configurado com as variáveis de ambiente necessárias.

O SQLite é utilizado para o armazenamento local dos dados processados.

## 3. Obter o projeto

Caso o repositório ainda não esteja disponível na máquina, clone-o utilizando o terminal:

```powershell
git clone https://github.com/camilamta275/fiscalize-mobile.git
```

Entre na pasta do projeto e, em seguida, na pasta da pipeline ETL:

```powershell
cd fiscalize-mobile
cd etl
```

Se o repositório já estiver clonado, basta abrir o terminal na pasta `etl`.

## 4. Criar e ativar o ambiente virtual

O ambiente virtual permite instalar as dependências do projeto sem interferir nas demais instalações do Python.

No terminal do PowerShell, dentro da pasta `etl`, execute:

```powershell
python -m venv .venv
```

Ative o ambiente virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

Após a ativação, o terminal deverá apresentar `(.venv)` antes do caminho atual.

Caso o PowerShell bloqueie a ativação do ambiente virtual, verifique as políticas de execução configuradas no sistema. Como alternativa, também é possível ativar o ambiente pelo terminal do Prompt de Comando utilizando `.venv\Scripts\activate.bat`.

## 5. Instalar as dependências

Com o ambiente virtual ativado, atualize o instalador de pacotes e instale as dependências declaradas no arquivo `requirements.txt`:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

O arquivo deve incluir o Prefect, as bibliotecas utilizadas pela pipeline e o driver PostgreSQL necessário à conexão com o Neon. Na configuração utilizada durante o desenvolvimento, o driver é `psycopg[binary]`.

Caso essa dependência ainda não esteja no arquivo, instale-a com:

```powershell
python -m pip install "psycopg[binary]"
```

É importante registrar essa dependência no `requirements.txt` para que outras pessoas consigam reproduzir a execução.

## 6. Configurar as variáveis de ambiente

Na pasta `etl`, crie um arquivo chamado `.env` com base no modelo `.env.example`, caso ele esteja disponível.

Esse arquivo deve conter as variáveis necessárias para acessar os bancos de dados. Entre elas, estão:

- `MONGODB_URI`: endereço de conexão com o MongoDB;
- `DATABASE_URL`: endereço de conexão com o banco PostgreSQL no Neon;
- `BACKEND_DATABASE_URL`: endereço de conexão com o PostgreSQL operacional do backend, usado somente para leitura pelo sync dos chamados. Use o mesmo valor do `DATABASE_URL` de `backend/.env`.

Os valores devem corresponder às credenciais e aos endereços fornecidos para o ambiente utilizado pelo projeto.

**Importante:** não compartilhe credenciais e não envie o arquivo `.env` ao GitHub. O arquivo deve ser excluído do controle de versão pelo `.gitignore`. No repositório, mantenha apenas o `.env.example`, sem senhas ou outros segredos reais.

## 7. Configurar e iniciar o servidor Prefect

O Prefect disponibiliza uma interface web para acompanhar os fluxos e as tarefas executadas.

Dentro da pasta `etl`, com o ambiente virtual ativado, configure o endereço local da API:

```powershell
python -m prefect config set PREFECT_API_URL="http://127.0.0.1:4200/api"
```

Em seguida, inicie o servidor:

```powershell
python -m prefect server start
```

Mantenha esse terminal aberto enquanto estiver utilizando o painel. Por padrão, a interface web fica disponível em:

[http://127.0.0.1:4200](http://127.0.0.1:4200)

Se aparecer uma mensagem informando que a porta 4200 já está em uso, pode haver um servidor Prefect em execução. Nesse caso, verifique se a interface já está acessível antes de tentar iniciar outro servidor.

## 8. Executar a pipeline orquestrada

Abra um segundo terminal no VS Code, entre na pasta `etl` e ative novamente o ambiente virtual:

```powershell
cd caminho\para\fiscalize-mobile\etl
.\.venv\Scripts\Activate.ps1
```

Se o terminal já estiver na pasta correta, não é necessário executar o comando `cd` novamente.

Execute o fluxo:

```powershell
python flow_etl.py
```

O Prefect iniciará a execução do fluxo `ETL Fiscalize`, registrando o estado de cada tarefa e exibindo os logs no terminal.

Ao final, uma execução concluída com sucesso deverá apresentar uma mensagem semelhante a:

```text
Flow run 'nome-da-execucao' - Finished in state Completed()
```

O nome da execução pode variar a cada tentativa.

## 9. Como a pipeline funciona

O fluxo foi organizado para processar os dados dos chamados e combiná-los com informações climáticas e populacionais.

### 9.1. Sincronização e leitura dos chamados

A tarefa `Sincronizar chamados do backend` executa `SyncChamados.run()`: lê os chamados do PostgreSQL operacional do backend (via `BACKEND_DATABASE_URL`) e atualiza a coleção `chamados_raw` no MongoDB de forma idempotente. O sync nunca escreve no banco do backend.

Em seguida, a tarefa `ler_chamados` lê `chamados_raw` e calcula o intervalo de datas que o clima precisa cobrir. O arquivo `data/chamados.json` é apenas um fixture legado e não participa da execução.

### 9.2. Extração dos dados

A tarefa `garantir_clima` verifica se a série climática já carregada cobre o intervalo dos chamados. Se não cobrir (ou se a coleção estiver vazia), consulta a Open-Meteo e grava a carga bruta em `clima_raw`. Caso contrário, reaproveita os dados existentes sem chamar a API.

A tarefa `garantir_populacao` baixa a população do IBGE apenas quando `populacao_ibge_raw` estiver vazia.

A tarefa `extrair_mongo` consulta as coleções do MongoDB utilizadas pela pipeline:

- `clima_raw`: dados climáticos;
- `populacao_ibge_raw`: dados populacionais.

### 9.3. Camada silver

A tarefa `construir_silver` monta as tabelas normalizadas:

- `silver_chamado`: um registro por chamado, com bairro normalizado e data local de Recife;
- `silver_clima_diario`: uma linha por dia, com temperatura e precipitação;
- `silver_bairro_populacao`: um registro por bairro do Recife.

### 9.4. Camada gold

A tarefa `construir_gold` gera as tabelas do dashboard exclusivamente a partir da silver:

- `chamados_clima`: chamados enriquecidos com clima;
- `chamados_populacao`: chamados agregados por bairro com população e chamados por 1.000 habitantes;
- `chamados_clima_diario`: chamados agregados por dia, junto com temperatura e precipitação.

### 9.5. Carregamento dos resultados

As tabelas silver e gold são carregadas em dois destinos:

- **SQLite:** armazenamento local;
- **Neon PostgreSQL:** armazenamento no banco PostgreSQL.

O carregamento no Neon apaga as linhas e insere a nova carga na mesma transação, sem `DROP TABLE`/`TRUNCATE`. O carregamento só acontece depois que os dados correspondentes foram preparados.

## 10. Acompanhamento da execução no Prefect

Após iniciar o fluxo, acesse:

[http://127.0.0.1:4200](http://127.0.0.1:4200)

No painel, é possível acompanhar o histórico das execuções, consultar o estado do fluxo, visualizar as tarefas e acessar seus logs.

Os estados permitem identificar se uma execução foi concluída com sucesso ou se ocorreu alguma falha. Quando uma tarefa configurada para repetição falha, o Prefect também registra as tentativas realizadas.

Durante o desenvolvimento, ocorreu uma falha no carregamento da tabela `chamados_clima` no Neon porque o usuário da conexão não tinha permissão para removê-la. O Prefect registrou o erro e realizou as tentativas de repetição configuradas. O carregamento foi ajustado para apagar as linhas e inserir a nova carga na mesma transação, sem `DROP TABLE`/`TRUNCATE`, e passou a concluir com sucesso para usuários com `INSERT` e `DELETE`.

Esse caso demonstra a importância do monitoramento: além de coordenar as tarefas, o Prefect ajuda a localizar a etapa que falhou e fornece informações para investigar a causa.

## 11. Resultado esperado

Ao concluir a execução, espera-se que:

- O fluxo `ETL Fiscalize` seja registrado pelo Prefect;
- As tarefas sejam executadas respeitando suas dependências;
- A coleção `chamados_raw` seja atualizada com os chamados atuais do backend;
- As camadas silver e gold sejam construídas a partir dos dados sincronizados;
- As tabelas `silver_chamado`, `silver_clima_diario` e `silver_bairro_populacao` sejam carregadas no SQLite e no Neon;
- As tabelas `chamados_clima`, `chamados_populacao` e `chamados_clima_diario` sejam carregadas no SQLite e no Neon;
- O painel Streamlit consiga exibir chamados por bairro e a relação entre clima e chamados por dia;
- O estado final do fluxo seja `Completed`, caso todas as etapas terminem sem erros;
- O histórico e os logs estejam disponíveis no painel para acompanhamento e análise de falhas.

Com essa implementação, a pipeline existente passa a ser executada por meio de um fluxo orquestrado, facilitando seu acompanhamento, sua manutenção e a identificação de problemas durante o processamento.
