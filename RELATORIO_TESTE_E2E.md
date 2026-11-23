# Relatório de testes E2E – E3 Cenários negativos

## Objetivo

Ampliar a suíte E2E do Fiscalize Mobile além dos dois casos Pytest anteriores e
adicionar um fluxo negativo executado pela interface real do aplicativo com
Maestro.

## Cenários implementados

| Caso | Local | Objetivo | Comportamento esperado |
| --- | --- | --- | --- |
| E2E-NEG-CAMPO | `automation/tests/e2e/ocorrencia/ocorrencia-campo-obrigatorio.yaml` | Tentar enviar uma ocorrência sem o título obrigatório | O app apresenta "Título deve ter no mínimo 5 caracteres", mantém as validações de descrição e categoria e não apresenta "Ocorrência registrada!" |
| E2E-FLUXO-COMPLETO | `automation/tests/e2e/fluxo/fluxo-1-registrar-chamado.yaml` e `fluxo-2-acompanhar-notificar.yaml` | Registrar, acompanhar status e verificar notificação | O chamado é registrado pelo cidadão, atualizado pelo gestor e acompanhado pelo cidadão |
| E2E-NEG-PERMISSAO-UI | Parte negativa de `fluxo-2-acompanhar-notificar.yaml` | Verificar ausência da ação exclusiva do gestor | O cidadão não vê "Atualizar status" |
| E2E-NEG-PERMISSAO-API | `test_cidadao_nao_atualiza_status_via_api` | Verificar bloqueio backend ao cidadão | Atualização de status retorna HTTP 403 |

## Identificação dos casos anteriores

A suíte Pytest anterior coletava dois casos em
`automation/tests/e2e/test_fluxo_registrar_acompanhar_notificar.py`:

- `test_registrar_acompanhar_e_notificar`
- `test_cidadao_nao_atualiza_status_via_api`

O primeiro combina Maestro e API e inclui uma asserção negativa na interface.
O segundo é exclusivamente API e não constitui fluxo negativo executado no app.

## Execuções realizadas

### Validações concluídas

- Branch confirmada: `test/e3-cenarios-negativos-e2e`.
- Estado inicial do Git: limpo.
- Teste de descoberta da suíte:
  - Comando: `python -m pytest automation/tests/test_maestro_ci.py -k "runner_discovers_all_flows" -o addopts="" -v`
  - Resultado: 1 teste selecionado, aprovado.
- Suíte unitária do runner Maestro:
  - Comando: `python -m pytest automation/tests/test_maestro_ci.py -o addopts="" -v`
  - Resultado: 14 testes aprovados.
- Coleta dos testes E2E existentes:
  - Comando: `python -m pytest automation/tests/e2e -o addopts="" -v`
  - Resultado: 2 testes coletados e ignorados por ausência de Maestro/ADB/dispositivo.
- Dry-run do runner:
  - Comando: `python automation/scripts/run_maestro_e2e.py --dry-run`
  - Resultado: 16 fluxos descobertos, incluindo `ocorrencia-campo-obrigatorio.yaml`.
- Validação isolada do novo fluxo:
  - Comando: `python automation/scripts/run_maestro_e2e.py --validate-only automation/tests/e2e/ocorrencia/ocorrencia-campo-obrigatorio.yaml`
  - Resultado: seleção válida; nenhuma variável externa requerida pelo fluxo.

### Tentativa de execução no app

- Comando: `python automation/scripts/run_maestro_e2e.py automation/tests/e2e/ocorrencia/ocorrencia-campo-obrigatorio.yaml`
- Resultado obtido: execução não iniciada; o runner respondeu
  "Maestro CLI não encontrado ou indisponível no PATH."
- Ambiente verificado: Maestro ausente, ADB ausente e nenhum emulador/dispositivo
  Android disponível.
- Por isso, não há evidência desta máquina de que o novo fluxo foi aprovado no
  aplicativo. O teste não foi declarado aprovado sem execução real.

## Resultado individual

| Item | Resultado |
| --- | --- |
| Descoberta ampliada para 16 fluxos | Aprovado |
| Validação do YAML isolado | Aprovado |
| Execução do novo negativo no app | Bloqueado por ausência de Maestro/ADB/dispositivo |
| Regressão dos testes existentes | Não executada integralmente neste ambiente |

## Evidências e comandos

- Saída da tentativa de execução: erro explícito do runner sobre Maestro não
  encontrado no `PATH`.
- O runner não criou evidências de aprovação de tela, pois não iniciou o
  Maestro.
- Os relatórios JUnit/JPG/screenshot só devem ser registrados em uma execução
  real no emulador ou em uma pipeline com emulador configurado.

## Limitações

O ambiente local não possui Android SDK/ADB, Maestro ou dispositivo/emulador
conectado. A pipeline versionada pode executar o cenário em emulador porque
configura PostgreSQL, backend, APK, Maestro e Android API 34.
