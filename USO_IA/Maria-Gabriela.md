# Uso de IA — Gabriela Damásio

## Registro da atividade 0000

- **Revisado por (nome do usuário que está fazendo as edições):** Gabriela Damásio
- **Arquivo / Arquivos alterado(s):** `mobile/src/components/ui/button.tsx`, `mobile/src/views/login-view.tsx`, `mobile/app.config.ts`, `automation/tests/e2e/login-validation.yaml`, `USO_IA/Gabriela-Damasio.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Adicionado testID no botão de login, configuração Android via Expo e fluxo Maestro para validar mensagens do formulário.
- **Tratamento de dados pessoais:** Não houve uso de dados pessoais de usuários do aplicativo; o fluxo usa valores sintéticos.
- **Alterado pela IA (nome da IA, versão da IA):** Copilot SDK no VS Code (versão não informada)
- **Finalidade do uso da IA:** Implementar e verificar um teste E2E mobile de validação do formulário de login.
- **Etapa da atividade:** Implementação e validação.
- **Tipo de contribuição da IA:** Alteração do componente de botão, configuração Expo, criação de fluxo Maestro e registro da atividade.

## Registro da atividade 0001

- **Revisado por (nome do usuário que está fazendo as edições):** Gabriela Damásio
- **Arquivo / Arquivos alterado(s):** `automation/scripts/run_maestro_e2e.py`, `automation/README.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Ajustei o runner Maestro para executar os cenários sob minha responsabilidade, remover credenciais hardcoded e documentar o dry-run e as validações locais sem executar seed.
- **Tratamento de dados pessoais:** Não houve uso de dados pessoais; apenas contas e valores sintéticos locais de teste foram considerados.
- **Alterado pela IA (nome da IA, versão da IA):** Copilot SDK no VS Code (versão não informada)
- **Finalidade do uso da IA:** Revisar e corrigir o script de execução do Maestro e registrar o comportamento seguro/documentado do runner.
- **Etapa da atividade:** Revisão e correção.
- **Tipo de contribuição da IA:** Ajuste de segurança no script, validação do dry-run e revisão da documentação.

## Registro da atividade 0002

- **Revisado por (nome do usuário que está fazendo as edições):** Gabriela Damásio
- **Arquivo / Arquivos alterado(s):** `etl/flow_etl.py`, `etl/requirements.txt`, `etl/src/load.py`, `etl/src/spark_session.py`, `etl/src/spark_transform.py`, `etl/test_spark_transform.py`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Integrada a transformação de dados com Apache Spark nas camadas Silver e Gold, com orquestração Prefect e cargas no SQLite e Neon.
- **Tratamento de dados pessoais:** Não foram fornecidos dados pessoais identificáveis à IA. A validação da execução foi compartilhada por meio de logs operacionais e contagens agregadas de registros.
- **Alterado pela IA (nome da IA, versão da IA):** ChatGPT (GPT-6)
- **Finalidade do uso da IA:** Apoiar a integração do Apache Spark ao pipeline ETL, a implementação e organização das transformações, a orquestração das etapas com Prefect e a correção de problemas identificados durante a execução.
- **Etapa da atividade:** Implementação, integração, depuração e validação.
- **Tipo de contribuição da IA:** Apoio na implementação das transformações Silver e Gold com Spark; configuração e encerramento da sessão Spark; integração das cargas com SQLite e PostgreSQL (Neon); ajuste das dependências; apoio à criação e execução de testes; correção de incompatibilidade de tipos na carga de dados populacionais para o Neon; e desativação do cache automático do Prefect nas tarefas que recebem DataFrames Spark, evitando erros de serialização durante o cálculo da chave de cache. A execução completa da ETL foi validada, com todas as tarefas e o fluxo finalizados no estado `Completed()`.