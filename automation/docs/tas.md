# Política de manutenção da TAS

- **Projeto:** Fiscalize
- **Escopo:** testes automatizados de API e E2E mantidos em `automation/`
- **Revisão:** mensal e sempre que uma mudança relevante afetar a suíte

## 1. Objetivo e contexto

Esta política define como a equipe investiga, prioriza e acompanha problemas da
solução de automação de testes (TAS). O projeto combina testes de API com pytest
e fluxos E2E; a pipeline já publica resultados e abre/atualiza issues com o
rótulo `falha-ci` quando uma execução falha. As metas de qualidade e a leitura
das métricas M1, M2, M5 e M6 estão em [Métricas de Qualidade](../automation/docs/Métricas%20de%20Qualidade.md),
e o fluxo da pipeline está descrito em [regressao.yml](../.github/workflows/regressao.yml).

Como a equipe mantém um projeto acadêmico, os prazos abaixo são objetivos em
dias úteis, não um SLA de produção. A prioridade deve refletir o risco para os
fluxos cobertos e para a confiança nos resultados; não se deve reduzir o rigor
do teste apenas para recuperar um resultado verde.

## 2. Tratamento e encaminhamento de falhas

Ao identificar uma falha:

1. **Preservar evidências:** registrar o link da execução, branch e commit,
   teste/caso afetado, resultado esperado e observado, logs/relatório e passos
   de reprodução. Não incluir credenciais, tokens ou dados pessoais.
2. **Reproduzir de forma controlada:** repetir o caso isolado e, quando
   necessário, a suíte relevante, mantendo o mesmo commit e anotando mudanças
   de ambiente ou massa de dados. Uma nova execução ajuda a diagnosticar, mas
   não apaga a falha original.
3. **Classificar a causa provável:**

   | Categoria | Indícios e encaminhamento |
   | :--- | :--- |
   | **SUT** (sistema sob teste) | O comportamento real contradiz requisito ou resultado esperado. Encaminhar ao responsável pela área do backend ou mobile; manter a falha visível e associar o requisito/caso. |
   | **TAS** (automação) | Erro no teste, fixture, oráculo, seletor, sincronização ou relatório. Encaminhar à pessoa responsável pela automação e corrigir sem enfraquecer a verificação do requisito. |
   | **Ambiente** | Serviço, banco, dispositivo, dependência ou configuração indisponível/incorreta. Encaminhar a quem mantém o ambiente; registrar o bloqueio e não apresentar o teste não executado como aprovado. |
   | **Variação esperada** | Resultado permitido pelo requisito, dado não determinístico ou condição explicitamente opcional. Confirmar a regra com a pessoa responsável pelo requisito e ajustar a asserção/documentação somente após essa confirmação. |

4. **Registrar e acompanhar:** abrir ou atualizar uma issue no GitHub, evitando
   duplicatas. Para demandas registradas manualmente, usar o formulário
   [Manutenção da TAS](../.github/ISSUE_TEMPLATE/tas-manutencao.yml), que exige
   categoria, prioridade, responsável, prazo, caso afetado, comportamento,
   evidências e encaminhamento. Para falhas de CI já registradas
   automaticamente, manter a issue `falha-ci` vinculada à execução e preencher
   os campos de triagem pendentes em até 1 dia útil. Toda demanda deve informar
   categoria, prioridade, responsável, evidências, data de identificação,
   prazo-alvo, testes/requisitos afetados e estado. Atualizar a issue quando a
   causa ou o prazo mudar.
5. **Resolver e verificar:** corrigir a causa, executar o teste afetado e a
   suíte pertinente, anexar o resultado e fechar a demanda apenas quando houver
   evidência de resolução. Se a correção depender de outra equipe ou ambiente,
   registrar o bloqueio, responsável externo e próxima data de acompanhamento.

Um teste só pode ser marcado como *skipped* quando a dependência necessária
estiver comprovadamente indisponível e a mensagem indicar como corrigir o
bloqueio. *Skipped* não significa aprovado; a execução e seu impacto devem
continuar visíveis nos relatórios.

## 3. Prioridades, responsáveis e prazos-alvo

O responsável pela triagem define a prioridade com base no impacto e pode
reclassificá-la ao obter novas evidências. Os prazos são contados a partir da
identificação, em dias úteis:

| Prioridade | Critério | Triagem/atribuição | Resolução ou plano aprovado |
| :--- | :--- | :--- | :--- |
| **P1 — crítica** | Fluxo principal indisponível, risco de dados incorretos ou gate essencial sem resultado confiável; sem alternativa segura. | Até 1 dia útil; avisar a equipe assim que identificado. | Até 1 dia útil. Se não for viável, registrar contenção, risco aceito e nova data com a equipe. |
| **P2 — alta** | Regressão relevante em fluxo coberto ou falha persistente que bloqueia validação, com alternativa limitada. | Até 1 dia útil. | Até 3 dias úteis. |
| **P3 — normal** | Falha localizada sem bloqueio do fluxo principal, ou problema de manutenção com impacto moderado. | Até 3 dias úteis. | Até 5 dias úteis. |
| **P4 — baixa** | Melhoria, duplicação ou lentidão sem impacto imediato na decisão de qualidade. | Até 5 dias úteis. | Até 10 dias úteis ou priorização explícita na próxima revisão. |

O **relator** abre a demanda e fornece evidências; o **responsável pela TAS**
coordena a triagem e a correção da automação; o **responsável pelo SUT/ambiente**
investiga falhas do respectivo componente; e outro integrante revisa a mudança
quando possível. A pessoa que implementa a correção não deve encerrar a demanda
sem evidência verificável. Se não houver responsável disponível, a equipe
atribui um responsável e registra essa decisão na issue.

Nenhum prazo autoriza ignorar falha de segurança, de dados ou de requisito.
Qualquer exceção ao gate exige decisão explícita da equipe, justificativa, risco,
medida compensatória, responsável e data para reavaliar; não pode ser aplicada
silenciosamente.

## 4. Gestão de testes instáveis

Considera-se **suspeito de instabilidade** um teste que alterna entre aprovado
e reprovado sem mudança de código ou requisito, sob as mesmas condições. A
classificação deve ser baseada em evidência, não em uma única repetição:

- Reexecutar o teste isolado e registrar commit, ambiente, resultado e logs.
- Abrir demanda de manutenção quando houver resultados discordantes em
  execuções comparáveis; tratá-la como confirmada se ocorrerem pelo menos duas
  falhas em dez execuções comparáveis. Investigar também uma falha única se
  houver impacto P1/P2.
- Procurar causas como espera por tempo fixo, compartilhamento de estado,
  dependência externa, ordem de execução e dados não isolados. Preferir espera
  por condição e massa independente por execução.
- Reexecução manual ou automática é evidência diagnóstica: uma aprovação
  posterior não transforma a primeira falha em sucesso nem elimina o registro.
- Não remover, ignorar ou tornar não bloqueante um teste apenas para deixar a
  pipeline verde. Quarentena é excepcional: exige issue, justificativa, risco,
  responsável, prazo máximo de 10 dias úteis e aprovação da equipe. O teste
  deve continuar executável e reportado como instável; se a quarentena retirar
  o bloqueio, deve haver verificação compensatória documentada. Ao vencer o
  prazo, a equipe corrige, restaura o bloqueio ou aprova nova decisão com risco
  explícito.

## 5. Revisões periódicas

- **Semanalmente:** revisar issues abertas com título `[TAS]` e issues
  `falha-ci`, verificando responsável, prioridade, idade e prazo. A métrica M6
  acompanha especificamente as issues `falha-ci` e considera crítica uma issue
  aberta há mais de cinco dias; escalonar antes de ultrapassar esse limite.
- **Mensalmente:** revisar a suíte e as tendências dos relatórios: taxa de
  falha/instabilidade (M5 e execuções repetidas), testes ignorados, duração,
  duplicação e rastreabilidade. Comparar a duração com a mediana das dez
  execuções anteriores disponíveis; investigar aumento superior a 20% em duas
  revisões consecutivas.
- **Em toda mudança relevante de requisito, arquitetura ou pipeline:** verificar
  se os casos afetados continuam válidos e se sua rastreabilidade está
  atualizada.

Na revisão mensal, verificar também se M1 continua dentro da meta de 98%, se M2
confirma que testes realmente foram executados e se as issues abertas estão
acompanhadas. Cada caso automatizado deve apontar para um requisito ou ID do
backlog/caso de teste. Registrar decisões, responsável e ações no acompanhamento
da equipe; ausência de dados deve ser anotada como lacuna, nunca presumida como
estabilidade.

## 6. Descontinuação e remoção de testes

Um teste pode ser proposto para remoção somente quando houver justificativa
verificável, como requisito removido/alterado, cenário fora do escopo atual,
cobertura duplicada sem valor adicional ou impossibilidade técnica persistente
com risco maior que o benefício. Instabilidade, lentidão ou falha do teste,
isoladamente, não justificam sua exclusão.

A proposta deve indicar o caso e requisito afetados, motivo, evidência, cobertura
que será perdida, risco residual e alternativa de cobertura (se aplicável). A
decisão cabe ao responsável pelo SUT/requisito junto ao responsável pela TAS e
deve ser revisada por outro integrante quando possível. Registrar a decisão na
issue e na mudança revisada; atualizar o backlog e a rastreabilidade. Se não
houver alternativa para um fluxo crítico, a remoção requer aceite explícito do
risco pela equipe e plano para restabelecer a cobertura.

## 7. Histórico e revisão desta política

As issues de manutenção e seus links para execuções constituem o histórico das
falhas e decisões. A equipe revisa esta política mensalmente ou quando o fluxo
de CI, a composição da TAS ou as métricas mudarem. Alterações devem explicar o
motivo e manter a distinção entre defeito do produto, defeito da automação e
limitação do ambiente.

Uma aplicação simulada da política está documentada em
[Demonstração de manutenção da TAS](evidencias/manutencao-tas-simulada.md).
