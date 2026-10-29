# Cobertura do Backlog de Automação

<!-- Updated by AI. -->
> **Produto / SUT:** Fiscalize Mobile
> **Equipe / Squad:** 3
> **Data da verificação:** 28/10/2026
> **Referência:** [Plano de Testes e Backlog de Automação](../Plano%20de%20Testes%20e%20Backlog%20de%20Automação.md) (seções 5 e 6)

Este documento responde ao item **"Verificar a cobertura do backlog de automação"** do desafio de evolução da pipeline. Ele confere se cada caso que o planejamento mandou automatizar tem um teste implementado, em que nível esse teste atua e em qual etapa da pipeline ele é executado.

---

## 1. Como a verificação foi feita

1. **Leitura do planejamento:** casos marcados como `Sim` na seção 5 (*Seleção para automação*) e itens da seção 6 (*Backlog de automação*).
2. **Leitura do código:** todos os arquivos em `automation/tests/` e o workflow `.github/workflows/regressao.yml`.
3. **Execução local idêntica ao CI:** PostgreSQL 16 em Docker, backend (submódulo `backend/`, commit `b8d37cb`) com `prisma migrate deploy` + `npm run seed`, e as mesmas variáveis de ambiente do workflow.
4. **Sondagem da API:** chamadas manuais aos endpoints de chamados e do gestor, para confirmar se as regras previstas nos casos ainda não automatizados existem no backend.
5. **Histórico do GitHub Actions:** execuções do workflow `Regressão` e o ruleset da branch `main`.

**Resultado da execução local (`pytest tests`):** `53 passed in 13.51s`, com 0 falhas.

A suíte de MFA não forja estado no banco: ela recupera o código real de seis dígitos a partir do SHA-256 persistido em `otp_challenges` e o submete ao endpoint `POST /auth/2fa/verify`, o mesmo usado pelo app. O único SQL de escrita é o que move `expires_at` para o passado no cenário de expiração.

**Resultado dos testes unitários do backend (`npm test -- --passWithNoTests`):** `No tests found, exiting with code 0`. O backend **não possui testes unitários**, e o job "Testes unitários" passa sem executar nada.

---

## 2. Estratégia de automação definida pela equipe

O plano define a estratégia em duas seções, que **não estão alinhadas entre si**:

| Caso | Seção 5: Automatizar? | Seção 6: está no backlog? | Situação |
| :--- | :--- | :--- | :--- |
| TC01, TC02, TC03, TC04, TC05, TC06 | Sim | Sim | Consistente |
| TC08, TC09 | **Não**, permanece manual | **Sim** (ordens 7 e 8) | ⚠️ Contraditório |
| TC12, TC14, TC18, TC19 | **Sim** | **Não** | ⚠️ Selecionados, mas fora do backlog |
| TC07, TC10, TC11, TC13, TC15, TC16, TC17 | Não | Não | Consistente (manuais) |

Para medir a cobertura, este documento considera **a união das duas listas: 12 casos** (TC01–06, TC08, TC09, TC12, TC14, TC18 e TC19).

---

## 3. Matriz de cobertura: backlog × testes × pipeline

**Legenda:** ✅ Coberto · 🟡 Parcial · ❌ Não implementado

**Etapas da pipeline:** **Push** = jobs `Testes unitários` + `Testes de API` · **PR** = mesmos jobs + *smoke* · **Diário** = job `Suíte completa de regressão` (cron)

| Ordem no backlog | Caso | Condição verificada | Nível no plano | Teste(s) implementado(s) | Etapas | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | TC01 | Login do cidadão com credenciais válidas | Sistema | `test_user_login.py::test_login_user` (conclui o desafio OTP via `login_with_mfa`) | Push · PR · Diário | ✅ Regra coberta via API, incluindo o MFA de novo dispositivo. O redirecionamento para "Meus Chamados" (UI) não é verificado |
| 2 | TC02 | Login com senha incorreta | Sistema | `test_user_login.py::test_login_user_invalid_password`, `test_login_user_invalid_email`, `test_login_user_empty_*` (3) | Push · PR · Diário | ✅ Regra coberta via API. A mensagem exibida na tela não é verificada |
| 3 | TC04 | Descrição ≥ 20 e endereço ≥ 5 caracteres | Componente | — | — | ❌ Ver divergência D1 |
| 4 | TC05 | Protocolo gerado no formato definido | Sistema | — | — | ❌ Ver divergência D2 |
| 5 | TC03 | Registro completo de chamado | Sistema | `test_cidadao.py::test_create_demand` | Push · PR · Diário | 🟡 Só verifica o HTTP 201. Não valida o corpo (status `Aberto`, protocolo) nem a presença do chamado em "Meus Chamados" |
| 6 | TC06 | Login do gestor e acesso às rotas restritas | Sistema | — | — | ❌ O backend suporta (`/gestor/dashboard` → 200 para gestor, 403 para cidadão), mas não há teste |
| 7 | TC08 | Notificação in-app de mudança de status | Sistema | — | — | ❌ Contraditório no plano (seção 5 = manual) |
| 8 | TC09 | Status e timeline do chamado | Sistema | — | — | ❌ Contraditório no plano (seção 5 = manual) |
| — | TC12 | Cadastro de novo cidadão (+ aceite LGPD) | Integração | `test_user_creation.py` (11 testes: sucesso, e-mail inválido ×3, campos ausentes/vazios ×4, e-mail duplicado, senha curta, nome com caracteres especiais) | Push · PR · Diário | 🟡 Cadastro e validações cobertos. O aceite LGPD não foi implementado no produto (RNF-SEC-07) |
| — | TC14 | Filtro e busca na fila do gestor | Integração | — | — | ❌ O backend suporta (`GET /gestor/chamados?status=`), mas não há teste |
| — | TC18 | Exportação de dados pessoais | Integração | `test_auth_security.py::test_rights_portal_exports_personal_data` (com `mfaToken` via `critical_mfa_token`) | Push · PR · Diário | ✅ |
| — | TC19 | Bloqueio de cadastro de menores de 18 anos | Unidade | — | — | ❌ A funcionalidade não existe no produto (sem data de nascimento no cadastro) |

### Resumo da cobertura

| Recorte | Total | ✅ Coberto | 🟡 Parcial | ❌ Não implementado |
| :--- | :---: | :---: | :---: | :---: |
| Backlog (seção 6) | 8 | 2 (TC01, TC02) | 1 (TC03) | 5 (TC04, TC05, TC06, TC08, TC09) |
| União seções 5 + 6 | 12 | 3 (TC01, TC02, TC18) | 2 (TC03, TC12) | 7 |

**Conclusão:** a implementação ainda **não reflete integralmente a estratégia definida**. Os casos de autenticação e cadastro estão bem cobertos, mas o fluxo de chamados (TC03–TC05) e o perfil Gestor (TC06, TC14) ainda dependem de verificação manual.

---

## 4. Testes implementados fora do backlog

Estes testes existem e rodam na pipeline, mas não correspondem a nenhum item do backlog. Eles vieram dos requisitos de segurança e LGPD (ver `AUDITORIA-REQUISITOS-SEGURANCA.md`). Recomenda-se incluí-los no plano para que a rastreabilidade fique completa.

| Teste | Requisito / caso relacionado |
| :--- | :--- |
| `test_mfa_otp.py` (17 testes) | RNF-SEC-04: MFA por OTP em novo dispositivo e ações críticas — ver 4.1 |
| `test_auth_security.py::test_register_rejects_password_outside_policy` | RNF-SEC-02: política de senha |
| `test_auth_security.py::test_login_locks_account_after_five_consecutive_failures` | RNF-SEC-02: bloqueio após 5 falhas |
| `test_auth_security.py::test_refresh_token_rotates_and_rejects_reuse` | RNF-SEC-03: rotação de refresh token |
| `test_auth_security.py::test_rights_portal_reads_profile` / `test_rights_portal_updates_profile` | RNF-SEC-11: portal do titular |
| `test_auth_security.py::test_rights_portal_anonymizes_personal_data` / `test_rights_portal_deletes_account` | RNF-SEC-08 / **TC17**, agora com `mfaToken`; o plano manteve TC17 como manual, mas já está automatizado |
| `test_auth_security.py::test_user_can_change_password` + 3 cenários negativos | Alteração de senha (sem caso no plano), agora com `mfaToken` |
| `test_get_user.py` (2 testes) | Perfil `/auth/me` com e sem token |
| `test_user_logout.py` (3 testes) | Logout (sem caso no plano) |
| `test_cidadao.py::test_api` | *Health check* da API, usado hoje como "smoke" |

### 4.1 Suíte de MFA (RNF-SEC-04)

`test_mfa_otp.py` cobre o ciclo completo do OTP por e-mail, em 17 cenários.

**Login em novo dispositivo**

- exige `deviceId` no login;
- retorna `mfaRequired` + `challengeToken` para dispositivo desconhecido;
- aceita o código correto e abre sessão, tornando o dispositivo confiável;
- rejeita código errado e incrementa `attempts`;
- descarta o desafio após 5 tentativas erradas;
- rejeita reutilização do desafio (single-use);
- rejeita `deviceId` divergente;
- rejeita desafio expirado;
- rejeita código malformado e desafio inexistente.

**Ações críticas**

- exige autenticação para solicitar OTP;
- rejeita ação crítica desconhecida;
- exige verificação recente para trocar senha, exportar, anonimizar ou excluir;
- rejeita token de verificação inexistente;
- vincula o token à ação (token de senha não serve para exclusão);
- vincula o token ao usuário;
- garante uso único do token.

A recuperação do código é feita a partir do hash armazenado, sem ler e-mail e sem gravar `trusted`/`verified_at` diretamente. Isso exige o driver `psycopg` e `DATABASE_URL` disponível (ver `automation/README.md`).

---

## 5. Divergências encontradas

| ID | Divergência | Evidência | Encaminhamento sugerido |
| :--- | :--- | :--- | :--- |
| D1 | **O backend não valida os limites do TC04.** O app mobile valida (descrição ≥ 20, mas endereço ≥ **10**, e não 5 como no plano). | `POST /demands` com descrição de 13 e endereço de 3 caracteres retornou **201**. O app usa `use-demand-form-view-model.ts`, linhas 189 e 197. | Decidir com a equipe: (a) adicionar a validação no backend e testar via API, ou (b) testar no mobile (teste de componente). Corrigir no plano o limite do endereço (5 ou 10). |
| D2 | **O formato do protocolo no TC05 está errado.** O plano usa `SCH-AAAA-NNNN`, mas o sistema gera `DEM-AAAAMMDD-XXXX`. | Resposta real: `"protocolo": "DEM-20261020-DFP1"` | Atualizar o TC05 para o regex `^DEM-\d{8}-[A-Z0-9]{4}$` e automatizar via API. |
| D3 | Seções 5 e 6 do plano contraditórias (TC08, TC09, TC12, TC14, TC18, TC19). | Seção 2 deste documento | Alinhar as duas seções. |
| D4 | A numeração TC12–TC15 da matriz de rastreabilidade (seção 4.5 do plano) não bate com o documento de casos (rodada 2). | Ex.: na 4.5, TC13 = "Criação de conta"; na rodada 2, TC13 = "Redefinição de senha". | Adotar a numeração da rodada 2 e corrigir a 4.5. |
| D5 | O job "Testes unitários" não executa nenhum teste. | `No tests found, exiting with code 0`; o relatório JUnit tem 0 casos e o resumo do CI alerta "Nenhum teste foi executado" | Criar testes unitários (ex.: `passwordPolicy.ts`). Isso exige alteração no repositório do backend. |
| D6 | O "smoke" executado antes do merge é apenas o *health check*, não um teste ponta a ponta. | `regressao.yml`, step "Executar smoke test antes do merge" | Substituir por 1 a 3 fluxos reais (ex.: login → criar chamado → consultar). |
| D7 | Não há testes mobile. O README define Maestro (`automation/tests/mobile/*.yaml`), mas a pasta não existe, e `tests/e2e` contém código Appium com *placeholders*. | `automation/tests/e2e/conftest.py` (`com.app.package`) | Remover `tests/e2e` (Appium) e criar os fluxos Maestro, ou registrar formalmente que o E2E será via API. |
| D8 | TC19 e o aceite LGPD do TC12 não têm funcionalidade correspondente no produto. | `AUDITORIA-REQUISITOS-SEGURANCA.md` (RNF-SEC-07 e RNF-SEC-10) | Manter fora da automação até a funcionalidade existir e registrar isso no plano. |

---

## 6. Execução na pipeline

O workflow `Regressão` já está ativo e protege a `main` pelo ruleset **"Quality Gate - Fiscalize"**, que exige PR e os checks `Testes unitários` e `Testes de API` aprovados, com a branch atualizada.

| Evento | Jobs executados | Testes executados hoje |
| :--- | :--- | :--- |
| `push` (qualquer branch) | Testes unitários · Testes de API | Unitários do backend (0) + `pytest tests/api/tests` (53) |
| `pull_request` | Testes unitários · Testes de API (+ step smoke) | Os mesmos + `test_cidadao.py::test_api` |
| `schedule` (`0 3 * * *` = 00:00 em Recife) | Os três jobs, incluindo Suíte completa de regressão | Unitários + `pytest tests` (53) |
| falha em qualquer job | `notify-failure` | — (abre ou atualiza issue `falha-ci`) |

Cada job publica relatórios JUnit XML e HTML em `automation/reports/` e os envia como artefato (`relatorios-unit`, `relatorios-api`, `relatorios-regression`), com a árvore `fiscalize-mobile/reports/`. O resumo consolidado aparece no *job summary*. Em caso de falha, o job `notify-failure` abre ou atualiza uma issue com a etiqueta `falha-ci`, usando o título `[CI] Falha em "Regressão" — <branch>` como chave de deduplicação.

**Evidências no GitHub Actions** (`camilamta275/fiscalize-mobile`):

| Execução | Evento | Resultado |
| :--- | :--- | :--- |
| [#40790519877](https://github.com/camilamta275/fiscalize-mobile/actions/runs/40790519877) | push (28/10) | ✅ success (53 testes + artefatos) |
| [#40789702893](https://github.com/camilamta275/fiscalize-mobile/actions/runs/40789702893) | push (28/10) | ✅ success (primeira execução com relatórios) |
| [#40785330825](https://github.com/camilamta275/fiscalize-mobile/actions/runs/40785330825) | pull_request (28/10) | ✅ success |
| [#39392156219](https://github.com/camilamta275/fiscalize-mobile/actions/runs/39392156219) | schedule (20/10, iniciou 08:16 UTC) | ✅ success |
| [#39223780338](https://github.com/camilamta275/fiscalize-mobile/actions/runs/39223780338) | schedule (19/10, iniciou 08:34 UTC) | ✅ success |
| [#39109186020](https://github.com/camilamta275/fiscalize-mobile/actions/runs/39109186020) | schedule (18/10, iniciou 07:50 UTC) | ✅ success |
| [#39069762052](https://github.com/camilamta275/fiscalize-mobile/actions/runs/39069762052) | pull_request (PR #15) | ❌ failure (testes de API falhando antes da correção) |
| [#39070261539](https://github.com/camilamta275/fiscalize-mobile/actions/runs/39070261539) | pull_request (PR #15, após correção) | ✅ success |

> Nas execuções de 18–20/10, as agendadas para 03:00 UTC começaram entre 07:50 e 08:34 UTC, confirmando na prática a política *best-effort* do agendamento do GitHub Actions.

---

## 7. Próximos passos (priorizados pelo backlog)

| Prioridade | Ação | Fecha | Exige alterar o backend? |
| :---: | :--- | :--- | :---: |
| 1 | Automatizar TC05 via API, com o formato corrigido (`DEM-AAAAMMDD-XXXX`) | TC05, D2 | Não |
| 2 | Fortalecer TC03: validar corpo da resposta, status `Aberto` e presença em `GET /demands` | TC03 | Não |
| 3 | Automatizar TC06: login do gestor + `/gestor/dashboard` (200) e cidadão bloqueado (403) | TC06 | Não |
| 4 | Automatizar TC14: `GET /gestor/chamados?status=Aberto` retorna apenas chamados abertos | TC14 | Não |
| 5 | Definir onde validar o TC04 (backend ou mobile) e automatizar | TC04, D1 | Depende da decisão |
| 6 | Substituir o smoke de PR por 1 a 3 fluxos ponta a ponta e marcá-lo como check obrigatório | D6, D7 | Não |
| 7 | Alinhar seções 5/6 e numeração do plano; incluir os testes de segurança no backlog | D3, D4 | Não |
| 8 | Criar testes unitários no backend | D5 | **Sim** |

> Este documento deve ser atualizado sempre que a suíte de testes ou o workflow mudar. A última atualização foi em 28/10/2026.

<!-- Created by AI. -->
## 8. Histórico de atualizações

| Data | Mudança |
| :--- | :--- |
| 20/10/2026 | Versão inicial: 36 testes, sem MFA, sem artefatos de relatório. |
| 28/10/2026 | 53 testes (17 de MFA), backend `b8d37cb`, relatórios JUnit/HTML, artefatos e issue automática em falhas. |
