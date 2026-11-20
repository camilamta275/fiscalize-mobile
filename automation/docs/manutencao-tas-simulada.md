# Demonstração simulada de manutenção da TAS

> **Exercício simulado:** os resultados abaixo foram construídos para demonstrar
> o fluxo. Não correspondem a uma execução real nem a uma issue criada no GitHub.
> Não use este registro como evidência de defeito do produto.

## 1. Identificação e registro

- **Data simulada:** 16/11/2026
- **Caso existente usado no exemplo:** `automation/tests/api/tests/test_user_login.py::test_login_user`
- **Commit:** o mesmo nas cinco execuções simuladas; identificador omitido.
- **Execução de referência:** `SIMULADO-API-001` (identificador fictício).
- **Resultados simulados:** uma falha por timeout e quatro aprovações em cinco
  execuções comparáveis.
- **Issue simulada:** `[TAS] [SIMULADO] resultado intermitente no teste de login`
- **Estado:** aberta para investigação; sem número real de issue.

No GitHub, o registro seria iniciado pelo formulário
[Manutenção da TAS](../../.github/ISSUE_TEMPLATE/tas-manutencao.yml), mantendo o
link da execução e os resultados observados. O formulário exige classificação,
prioridade, responsável, prazo, caso afetado, comportamento e evidências.

## 2. Classificação e encaminhamento

| Campo | Registro do exercício |
| :--- | :--- |
| Categoria | **TAS — suspeita**, pois o timeout isolado ainda não prova defeito no SUT; encaminhar primeiro à pessoa responsável pela automação e reclassificar com os logs. |
| Instabilidade | **Suspeita, não confirmada:** resultado discordante; uma falha em cinco não atinge o critério de duas falhas em dez execuções comparáveis. |
| Prioridade | **P2 — alta:** o caso cobre autenticação, fluxo principal, e a oscilação dificulta validar mudanças. |
| Responsável | **Pessoa responsável pela TAS (papel designado para este exercício simulado; sem usuário GitHub real).** |
| Prazo-alvo | **19/11/2026**, três dias úteis após a identificação simulada. |
| Próxima ação | Conferir log e fixture, repetir o caso até completar dez execuções comparáveis e verificar se timeout tem origem no teste, ambiente ou SUT. |
| Risco e contenção | Manter a falha visível no CI; reexecuções não apagam o primeiro resultado. Não colocar o teste em quarentena sem a aprovação e as salvaguardas da política. |

## 3. Critério de conclusão

Manter a issue aberta até anexar a análise dos logs, os resultados das dez
execuções e a causa provável. Se houver pelo menos duas falhas em dez, tratar a
instabilidade como confirmada e corrigir a causa ou aprovar formalmente uma
quarentena temporária conforme a [política da TAS](../tas.md). Se não houver
reincidência, registrar a evidência, manter a ocorrência inicial no histórico e
fechar somente após revisão do responsável.

## 4. Rastro demonstrado

**Caso identificado → execução e resultados registrados → categoria TAS
provisória e prioridade P2 → responsável e prazo definidos → investigação
encaminhada sem mascarar a falha.**

Este arquivo é evidência de uma demonstração simulada para apresentação. Para
uma ocorrência real, deve-se abrir a issue pelo formulário e substituir os
identificadores simulados por links e resultados reais, sem incluir dados
sensíveis.
