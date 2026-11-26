# Uso de IA — Ana Sofia

## Registro da atividade 0000

Após o término da atividade, preencher todos os campos abaixo:

- **Revisado por (nome do usuário que está fazendo as edições):**
- **Arquivo / Arquivos alterado(s):**
- **Breve resumo do que foi feito (200 caracteres ou menos):**
- **Tratamento de dados pessoais:** Não houve / Houve (descrever e justificar)
- **Alterado pela IA (nome da IA, versão da IA):**
- **Finalidade do uso da IA:**
- **Etapa da atividade:**
- **Tipo de contribuição da IA:**
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0001

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/docs/Cobertura do Backlog de Automação.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Verificação da cobertura do backlog de automação: cruzamento do plano com os testes implementados, execução local da suíte e mapeamento por etapa da pipeline.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais reais; foram usados apenas os dados sintéticos do seed e de `automation/data/credentials.json`.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Opus 5.5)
- **Finalidade do uso da IA:** Verificar se os testes previstos no planejamento foram implementados e documentar o alinhamento entre backlog, testes e pipeline.
- **Etapa da atividade:** Desafio de evolução da pipeline: item 2, verificação da cobertura do backlog de automação.
- **Tipo de contribuição da IA:** Análise do plano, do código de testes e do workflow; execução local da suíte e sondagem da API; redação do documento de cobertura.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0002

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/tests/e2e/ocorrencia/ocorrencia-protocolo.yaml`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Criação do teste E2E Maestro do TC05: cria ocorrência e valida o protocolo no formato SCH-AAAA-NNNN na lista Meus Chamados.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais reais; foram usados apenas os dados sintéticos do seed.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Implementar o teste E2E do TC05 (geração de protocolo) previsto no backlog de automação.
- **Etapa da atividade:** Testes automatizados: implementação de testes E2E em Maestro.
- **Tipo de contribuição da IA:** Análise do plano de testes e do código do app e do backend; escrita do fluxo Maestro. O teste ainda não foi executado em dispositivo.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0003

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/tests/e2e/ocorrencia/ocorrencia-protocolo.yaml`, `automation/docs/Plano de Testes e Backlog de Automação.md`, `automation/docs/Saidas do Plano de Testes e Backlog/Casos de teste IA/saída-rodada-2.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Alinhamento do TC05 ao backend: formato do protocolo trocado de SCH-AAAA-NNNN para DEM-AAAAMMDD-XXXX no plano de testes, na saída da rodada 2 e no teste E2E.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Corrigir a divergência de formato do protocolo entre o plano de testes e o backend, por decisão do grupo de alterar o plano em vez do backend.
- **Etapa da atividade:** Testes automatizados: implementação de testes E2E em Maestro.
- **Tipo de contribuição da IA:** Edição dos documentos do plano de testes e do fluxo Maestro. O teste ainda não foi executado em dispositivo.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0004

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/tests/e2e/fluxo/fluxo-1-registrar-chamado.yaml`, `automation/tests/e2e/fluxo/fluxo-2-acompanhar-notificar.yaml`, `automation/tests/e2e/test_fluxo_registrar_acompanhar_notificar.py`, `.github/workflows/e2e.yml`, `automation/scripts/metrics.py`, `automation/scripts/quality_report.py`, `automation/scripts/templates/business.html.j2`, `automation/README.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Suíte E2E do fluxo registrar, acompanhar e notificar com negativo de permissão, workflow de E2E com app e backend reais e leitura de risco por métrica no relatório.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais reais; foram usados apenas os dados sintéticos do seed.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Atender ao feedback do Projeto Integrador sobre o critério de E2E (fluxo completo, execução na pipeline, cenários negativos) e sobre a interpretação de riscos no relatório de negócio.
- **Etapa da atividade:** Testes automatizados: testes E2E em Maestro, pipeline de E2E e melhoria do relatório de resultados e riscos.
- **Tipo de contribuição da IA:** Análise do repositório, escrita dos fluxos Maestro, do orquestrador, do workflow e das funções de interpretação do relatório. Os YAMLs passaram no maestro check-syntax e o relatório foi gerado com dados de teste; os fluxos E2E e o workflow ainda não foram executados em dispositivo nem no GitHub Actions.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0005

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/scripts/metrics.py`, `automation/scripts/quality_report.py`, `automation/docs/Métricas de Qualidade.md`, `automation/README.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Métrica M5 convertida de taxa de falha para estabilidade das execuções (100% é o ideal), alinhando nome, valor, meta, textos de risco e documentação.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Corrigir a inconsistência entre o nome (estabilidade) e o valor exibido (taxa de falha, onde 0% era o ideal) na métrica M5 do relatório.
- **Etapa da atividade:** Testes automatizados: melhoria do relatório de resultados e riscos.
- **Tipo de contribuição da IA:** Edição do cálculo, das faixas, dos textos e da documentação da M5; verificação com quatro cenários de execuções (100%, 95%, 50% e falha na branch padrão).
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo
## Registro da atividade 0006

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `automation/scripts/metrics.py`, `automation/scripts/quality_report.py`, `automation/scripts/templates/business.html.j2`, `automation/docs/Métricas de Qualidade.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Relatório de negócio: nível da estabilidade (alto, médio, baixo) por valor, linguagem sem termos técnicos, rótulos de período nos cartões e textos de risco mais curtos.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Tornar o relatório de negócio coerente e legível para o público de negócio, sem jargão de programação e sem contradição entre a rodada atual e o histórico.
- **Etapa da atividade:** Testes automatizados: melhoria do relatório de resultados e riscos.
- **Tipo de contribuição da IA:** Edição do cálculo de nível da M5, dos textos de interpretação e do modelo HTML; verificação com cenários de dados de teste e conferência do texto gerado.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo

## Registro da atividade 0008

- **Revisado por (nome do usuário que está fazendo as edições):** Ana Sofia
- **Arquivo / Arquivos alterado(s):** `mcp/servidor.py`, `mcp/README.md`
- **Breve resumo do que foi feito (200 caracteres ou menos):** Exercício 1 do servidor MCP: nova ferramenta contar_linhas, que valida o nome da tabela contra as tabelas do banco antes de montar o SQL de contagem.
- **Tratamento de dados pessoais:** Não houve tratamento de dados pessoais.
- **Alterado pela IA (nome da IA, versão da IA):** Claude Code (Claude Sonnet 5.5)
- **Finalidade do uso da IA:** Implementar o Exercício 1 da atividade do servidor MCP da aula 10 (ferramenta contar_linhas).
- **Etapa da atividade:** Desenvolvimento: servidor MCP de consulta ao banco do ETL.
- **Tipo de contribuição da IA:** Escrita da ferramenta e teste em memória com um banco simulado (contagem correta e nome de tabela inválido recusado). Não foi testado contra o Neon real, por falta de credenciais no ambiente.
- **Confirmação de revisão crítica e responsabilidade humana:** Confirmo (conferido por Ana Sofia contra a branch MCP atualizada, incluindo o trabalho da Camila)
