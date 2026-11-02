# Métricas de Qualidade

<!-- Created by AI. -->
<!-- Updated by AI. -->
Este documento é a fonte única das metas de qualidade da pipeline do Fiscalize.
Os scripts `automation/scripts/metrics.py` e `automation/scripts/quality_report.py`
aplicam exatamente as faixas descritas aqui.

**Em uma frase:** quatro métricas verificam se a suíte passa, se ela realmente
executa, se a pipeline é estável e se as falhas são corrigidas. O pior status
entre elas define o semáforo do produto.

## 1. Métricas monitoradas

| ID | Métrica | Fórmula | Fonte | Meta |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Taxa de sucesso da suíte | `passed / (total − skipped)` nas suítes primárias | JUnit XML | ≥ 98% |
| **M2** | Testes executados | `total` de casos das suítes primárias | JUnit XML | > 0 (zero é falha) |
| **M5** | Taxa de falha de execução | execuções com falha / execuções da janela (30 da branch padrão) | API de execuções | 0% na branch padrão; ≤ 10% na janela |
| **M6** | Falhas abertas (`falha-ci`) | issues abertas com o rótulo `falha-ci` e idade da mais antiga | Issues do repositório | nenhuma com mais de 5 dias |

**Suítes primárias:** `unit-junit.xml`, `api-junit.xml` e `regression-junit.xml`.
`api-smoke-junit.xml` e `regression-unit-junit.xml` são complementares e ficam
fora de M1/M2 para não contar duas vezes (o smoke é subconjunto da API e a
regressão já inclui os unitários).

**Por que estas quatro:**

- **M1 sem M2 é vaidade.** O job unitário roda com `--passWithNoTests` e fica
  verde com zero testes; M2 transforma "nada executado" em falha.
- **M5 separa os dois tipos de falha.** Falha na branch padrão é defeito que
  escapou do gate; falha em pull request é o gate funcionando. A meta é zero na
  padrão.
- **M6 fecha o ciclo.** A abertura automática de issues detecta a falha; M6 mede
  se alguém agiu sobre ela.
- **Quatro é o limite de leitura.** Tendência e cobertura aparecem nos relatórios
  como contexto, não como gate.

## 2. Regras de status

| Status | M1 | M2 | M5 | M6 |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 Verde | ≥ 98% | > 0 | 0% de falha na padrão e ≤ 10% na janela | nenhuma issue aberta |
| 🟡 Amarelo | 90%–98% | — | ≤ 10% na janela, sem falha na padrão | 1 a 3 issues, nenhuma com mais de 5 dias |
| 🔴 Vermelho | < 90% | = 0 | qualquer falha na padrão ou > 10% na janela | 4 ou mais issues, ou qualquer uma com mais de 5 dias |

O status geral é o pior entre M1, M2, M5 e M6. Quando falta dado (arquivo de
execuções ou de issues ausente), a métrica fica `desconhecida` e o geral é
rebaixado para amarelo, nunca para verde.

## 3. Risco de cobertura (contexto, não gate)

A cobertura do backlog priorizado é exibida como risco, sem alterar o status:
`(casos cobertos + 0,5 × casos parciais) / total`. Situação atual: 3 cobertos,
2 parciais e 7 não implementados entre 12 casos — **33%**.

## 4. Métricas descartadas

| Métrica | Motivo | Quando reconsiderar |
| :--- | :--- | :--- |
| Cobertura de código (backend e mobile) | O backend só tem testes de integração via HTTP e o app Expo não tem infraestrutura de teste | Depois de criar testes unitários e de componente |
| Cobertura do backlog como gate | O backlog tem lacunas de produto (TC19 não existe) e meta absoluta incentiva gaming | Com o backlog estável e 100% implementável |
| Mutation score e análise estática | Lentos, caros ou sem ferramenta no stack | Com suíte unitária madura ou Sonar |
| LOC, commits, velocidade, bugs por desenvolvedor | Não medem qualidade e incentivam comportamento artificial | Nunca como métrica de qualidade |
| Latência, carga, uptime | Não há requisito não funcional, SLA ou produção monitorada | Se surgir meta de desempenho ou observabilidade |
| Cobertura de 100% como meta | Gera testes vazios e manipulação do indicador | Nunca como meta absoluta |
| Taxa de sucesso do job unitário isolada | Fica verde com zero testes; substituída por M2 | Após resolver a lacuna D5 |

## 5. Quando roda e onde sai

- **A cada push, pull request e agendamento diário**, no job `Relatórios de
  qualidade` — sem intervenção manual.
- **Insumos:** JUnit XML dos artefatos, API de execuções do GitHub e issues
  `falha-ci`. O único insumo versionado é este documento e a lista de casos do
  backlog usada no risco de cobertura.
- **Saídas:** `metrics.json`, `technical-report.html` e `business-report.html`,
  publicados como artefato `relatorios-qualidade` e no GitHub Pages.
- **Histórico:** cada geração cria `reports/runs/<execução>/`, então nenhuma
  execução anterior é sobrescrita; `reports/index.html` aponta para a mais
  recente.
- **Localmente:** `python scripts/quality_reports.py`, a partir de
  `automation/`, gera as três saídas de uma vez.
- **Rastreabilidade:** a abertura automática de issues alimenta M6; a coleta de
  artefatos alimenta M1 e M2; este documento define as metas; `metrics.py`
  coleta e `quality_report.py` apresenta.
