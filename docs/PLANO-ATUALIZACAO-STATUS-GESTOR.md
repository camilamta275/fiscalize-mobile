# Plano de implementação — Atualização de status pelo Gestor no app mobile

> Documento criado para executar a tarefa em outra sessão de chat. Não contém
> alterações de código — é apenas o plano. Execute os passos na ordem e valide
> cada critério de aceite antes de seguir para o próximo.

## 1. Contexto e objetivo

O backend já expõe `PATCH /demands/:id/status` (restrito ao perfil `Gestor`,
em `backend/src/routes/demandRoutes.ts:26-31`), mas nenhuma tela do app mobile
o consome. O gestor não consegue alterar o status de uma ocorrência pelo
aplicativo, embora o endpoint sirva justamente a esse ciclo de vida
(é a única ação de progresso de uma demanda que não é CRUD de conteúdo).

**Objetivo:** um usuário autenticado com `perfil: 'Gestor'` consegue, a partir
da tela de detalhe da ocorrência, alterar o status dela (ex.: "Em Análise" →
"Em Andamento"), com confirmação, e a mudança aparece na lista e no histórico.

**Restrição de escopo:** o backend NÃO deve ser alterado — o endpoint já
suporta a operação. Tudo nesta entrega é lado app, funcionando com o contrato
atual da API.

## 2. Estado atual (fatos verificados)

### 2.1 Backend — contrato exato de `PATCH /demands/:id/status`

- Rota: `backend/src/routes/demandRoutes.ts`
  ```ts
  router.patch('/:id/status', authenticate, requireRole(['Gestor']), demandController.updateStatus);
  ```
- Controller: `backend/src/controllers/demandController.ts`
  ```ts
  const { status_id } = req.body;
  if (!status_id) throw new AppError(400, 'status_id obrigatório');
  const result = await demandService.updateStatus(id, req.user!.id, status_id);
  res.status(200).json(result);
  ```
- Service: `backend/src/services/demandService.ts` (`updateStatus`, linhas ~532-585)
  - Rejeita com 400 `Status inválido.` se o valor não for exatamente um dos
    **valores crus do enum do Prisma** (`backend/prisma/schema.prisma:418-425`):
    ```ts
    const validStatuses = ['Aberto', 'Em_An_lise', 'Em_Andamento', 'Aguardando', 'Resolvido', 'Fechado'];
    ```
  - Guarda efeito colateral: atualiza `chamado.status` + `atualizadoem` e cria
    um `timeline_event` tipo `'status'` ("Status atualizado…"), tudo numa
    transação; depois invalida o cache de métricas (`invalidateMetricsCache`).
  - Resposta de sucesso:
    ```json
    { "id": "<uuid>", "status": "Em Andamento", "updatedAt": "2026-11-06T..." }
    ```
    (o `status` da resposta é o rótulo de exibição, já traduzido por
    `displayStatus()`).

**⚠️ Gotchas que causam bugs se ignorados:**
1. O campo se chama `status_id` mas **não é um id numérico** — é a string crua
   do enum (`status_chamado`), com sublinhados e sem acento/circunflexo:
   `'Em_An_lise'`, `'Em_Andamento'`.
2. O **corpo** usa valores crus, mas a **resposta** (e todo o restante da API
   que o app consome, ver `models/demand.ts`) usa rótulos de exibição
   ("Em Análise", "Em Andamento"). O app deve **mapear** rótulo → valor cru ao
   enviar, e usar o rótulo da resposta ao atualizar a UI.
3. O backend **não valida transições** — qualquer status → qualquer status é
   aceito. Não inventar bloqueios no backend; eventual bloqueio de UI é
   decisão de produto (manter simples: mostrar todos os 6).
4. `authorize`/`requireRole` só libera `Gestor` — um Cidadão recebe 403.
5. Na resposta do login (`/auth/login` → `/auth/me`), o campo é `perfil` com
   valores `'Cidadao' | 'Gestor' | 'Admin'` (sem cedilha). `Admin` também
   recebe 403 no PATCH (o `requireRole` libera só `Gestor`) — não prometer a
   funcionalidade para Admin nesta entrega.

### 2.2 Mobile — o que já existe e será reaproveitado

- O usuário autenticado (com `perfil`) já vem de `useSession()`
  (`mobile/src/contexts/session-context.tsx`), tipado em
  `mobile/src/models/usuario.ts` (`Perfil = 'Cidadao' | 'Gestor' | 'Admin'`).
- O app já **suporta** login de Gestor (backend aceita, seed cria
  `gestor@fiscalize.gov.br` / `Gestor@123456` — `backend/prisma/seed.ts:510-541`),
  mas nenhuma tela habilita fluxo de gestor: hoje um Gestor vê todos os
  chamados na lista (o filtro `cidadaoid` só se aplica a `Cidadao`),
  porém recebe **403** ao tentar criar (`POST /demands` é `Cidadao`-only) ou
  editar (`PUT /demands/:id` é `Cidadao`-only).
- O `demandStore` (`mobile/src/contexts/demand-context.tsx`) já tem os padrões
  a seguir: `patchListItem(detail)` para write-back parcial na lista e
  `setDetails` (remoção de item) para invalidar o cache do detalhe — copiar
  essas duas funções como padrão.
- Componentes de UI prontos para reuso:
  - `components/ui/screen-header.tsx` — header com slot `right`.
  - `components/ui/button.tsx` — variantes `primary/secondary/ghost/danger`.
  - `components/ui/status-badge.tsx` + `STATUS_TONES` — cores por status.
  - `views/demands-list-view.tsx` — `FilterModal` (modal de seleção estilo
    bottom-sheet com lista de opções) — **padrão visual a copiar** para o
    seletor de status.
  - `components/demand-options-menu.tsx` — menu ⋮ + modal de confirmação
    (adicionado na entrega da exclusão) — referência de interação.
- Erros de API: `models/api-error.ts` (`ApiError(status, message)`); o
  `api-client` lança `ApiError` com mensagem já amigável — cada ViewModel só
  repassa `caught.message`.

### 2.3 Lacunas a fechar nesta tarefa

1. Nenhum serviço mobile chama `PATCH /demands/:id/status`.
2. A tela de detalhe (`views/demand-detail-view.tsx`) não tem seletor de status.
3. Não há travas por perfil: o FAB "nova ocorrência"
   (`views/demands-list-view.tsx:225-240`) e o botão "Editar ocorrência"
   (`views/demand-detail-view.tsx:213-222`) aparecem para Gestor, que recebe
   403 ao usar. Aproveitar a entrega para escondê-los por papel.

## 3. Decisões de design (aceitar ou ajustar antes de codar)

| Tema | Decisão |
|---|---|
| Onde entra a ação | Tela de detalhe da ocorrência (a lista continua só leitura). |
| UI da ação | Botão **"Atualizar status"** no bloco final do detalhe (só para Gestor), abrindo um `FilterModal`-like com os 6 status + botão de confirmação. Para gestor, o botão substitui o "Editar ocorrência". |
| Posição do "Atualizar status" | Onde hoje fica o botão de editar (`canEdit`), atrás de um novo guard `isGestor`. |
| Confirmação | Cheque simples: o modal do seletor já É a escolha explícita (selecionar status e confirmar) — sem segunda caixa de confirmação. |
| Cidadão | Não vê nenhuma ação de status (o que já acontece). |
| Erros | Inline no próprio modal (padrão do menu de exclusão: modal permanece aberto com a mensagem). |
| Status inicial do seletor | Status atual pré-selecionado. |

## 4. Passo a passo de implementação

### Passo 0 — Leitura obrigatória (para o agente executor)

- `mobile/AGENTS.md` (Expo v57 — consultar docs em https://docs.expo.dev/versions/v57.0.0/ antes de codar).
- `AGENTS.md` da raiz (regras de atribuição de IA e de git — ver seção 6).

### Passo 1 — Mapeamento de status e guardas de perfil

Arquivo: `mobile/src/models/demand.ts`
- Adicionar o mapa rótulo → valor cru do enum (a lista do backend em
  `demandService.updateStatus` é a fonte da verdade):
  ```ts
  // Created by AI.
  /** status_chamado cru do Prisma, aceito por PATCH /demands/:id/status —
   *  o app exibe os rótulos, mas o backend exige os valores do enum. */
  export const STATUS_API_VALUES = {
    'Aberto': 'Aberto',
    'Em Análise': 'Em_An_lise',
    'Em Andamento': 'Em_Andamento',
    'Aguardando': 'Aguardando',
    'Resolvido': 'Resolvido',
    'Fechado': 'Fechado',
  } as const satisfies Record<DemandStatus, string>;
  ```
- (não renomear nada existente; `ALL_STATUSES` da lista de telas continua onde está).

Arquivo: `mobile/src/models/usuario.ts`
- Adicionar helpers de perfil (unitários, sem estado):
  ```ts
  // Created by AI.
  export function isGestor(perfil: Perfil | undefined): boolean {
    return perfil === 'Gestor';
  }
  export function isCidadao(perfil: Perfil | undefined): boolean {
    return perfil === 'Cidadao';
  }
  ```

**Aceite:** `tsc` limpo; nenhum uso existente quebra.

### Passo 2 — Serviço

Arquivo: `mobile/src/services/demand-service.ts`
- Atualizar o doc-comment do módulo (remover a frase de que não há update de
  status, hoje diz "There's no remove…" — já foi reescrito; manter coerência).
- Novo tipo e função:
  ```ts
  // Created by AI.
  /** Somente Gestor (requireRole(['Gestor']) em demandRoutes.ts). */
  export function updateStatus(id: string, status: DemandStatus): Promise<DemandStatusUpdate> {
    return request<DemandStatusUpdate>(`/demands/${id}/status`, {
      method: 'PATCH',
      body: { status_id: STATUS_API_VALUES[status] },
    });
  }
  ```
- Tipo da resposta (colocar em `models/demand.ts` ou junto do serviço, seguindo
  a convenção do arquivo — modelos em `models/`, payloads no serviço; aqui
  `models/demand.ts` já abriga os tipos da entidade):
  ```ts
  // Created by AI.
  export type DemandStatusUpdate = { id: string; status: DemandStatus; updatedAt: string };
  ```

**Aceite:** chamada manual via curl do backend `PATCH` com
`{ "status_id": "Em_Andamento" }` confirma que o shape do cliente coincide.

### Passo 3 — Store (`demandStore`)

Arquivo: `mobile/src/contexts/demand-context.tsx`
- Nova ação `updateDemandStatus(id, status)`:
  1. chama `demandService.updateStatus(id, status)`;
  2. `patchListItem({ id, status, updatedAt } as ...)` — reutilizar o helper
     existente `pickListFields` não se aplica aqui (é parcial demais); o
     mesmo padrão de `patchListItem(demand)` serve: atualizar **apenas**
     `status` e `updatedAt` do item correspondente em `list.items`;
  3. invalidar o detalhe em cache (`setDetails` removendo a chave `id`) —
     o `timeline_event` criado no backend precisa ser recarregado no próximo
     foco, igual ao que `updateDemand` já faz com o comentário "the detail's
     timeline gained an event the PUT response doesn't carry".
- Incluir `updateDemandStatus` no `DemandContextValue`, no `useMemo` e no array
  de dependências (mesma mecânica das ações existentes).

**Aceite:** após a ação, o card da lista exibe o novo status sem refetch; abrir
o detalhe mostra o evento novo no histórico.

### Passo 4 — ViewModel do detalhe

Arquivo: `mobile/src/viewmodels/use-demand-detail-view-model.ts`
- Estado novo: `isUpdatingStatus` + `statusError: string | null`.
- Ação `updateStatus(status: DemandStatus)`:
  1. `setIsUpdatingStatus(true); setStatusError(null);`
  2. `await updateDemandStatus(demandId, status);`
  3. `catch` → `setStatusError(caught instanceof ApiError ? caught.message : 'Erro inesperado ao atualizar o status.')` e **rethrow** (a View decide: mostrar no modal);
  4. `finally` → `setIsUpdatingStatus(false)`.
- Expor no retorno: `{ ..., isUpdatingStatus, statusError, updateStatus }`.

**Aceite:** falha 400/403 aparece como `statusError` sem crash; sucesso não
seta erro.

### Passo 5 — View do detalhe

Arquivo: `mobile/src/views/demand-detail-view.tsx`
- Consumir do ViewModel: `isUpdatingStatus, statusError, updateStatus` e de
  `useSession()`: `const { usuario } = useSession();`
- `const isGestorUser = isGestor(usuario?.perfil);`
- Guardas de papel:
  - Botão "Editar ocorrência" (bloco `canEdit`) → renderizar só
    `if (canEdit && !isGestorUser)`.
  - Novo bloco para gestor, no mesmo lugar do botão de edição:
    - Botão `"Atualizar status"` (variant `secondary`, ícone `Icons.refresh`) →
      `setIsStatusPickerOpen(true)`.
    - Modal estilo `FilterModal` (copiar o componente interno de
      `views/demands-list-view.tsx` — ele é um `Modal transparent` + lista de
      opções; extraí-lo para `components/ui/option-sheet.tsx` **só se** for
      reuso trivial e sem mexer na lista; caso contrário, escrever um modal
      equivalente localmente, precedência para "copiado localmente com nomes
      próprios" para não inflar o escopo):
      - opções: os 6 `DemandStatus` com os rótulos de `STATUS_TONES[status].label`;
      - estado local: `statusDraft` (pré-selecionado com `demand.status`);
      - rodapé: `Button` "Cancelar" (secondary) + `Button` "Atualizar"
        (primary, `loading={isUpdatingStatus}`);
      - erro: `{statusError ? <InlineMessage message={statusError} /> : null}`
        dentro do modal (o modal permanece aberto em falha — mesmo padrão do
        `demand-options-menu.tsx`).
    - Após sucesso: fechar o modal (o store já atualizou os caches; a tela usa
      `demand` do cache, que refletiu `status` novo). O histórico novo aparece
      quando o usuário volta à tela (o `useFocusEffect` do ViewModel já
      refetch em foco e o cache do detalhe foi invalidado).
- `accessibilityRole="button"` + labels adequados nos pressables novos.

**Aceite visual/funcional (simulador ou Expo Go):**
1. Logar como `gestor@fiscalize.gov.br` (`Gestor@123456`) → abrir uma
   ocorrência → "Atualizar status" → mudar de "Aberto" para "Em Andamento" →
   lista e detalhe mostram o novo status; histórico traz
   "Status atualizado".
2. Logar como Cidadão → detalhe NÃO mostra botão de status; FAB e "Editar"
   aparecem como hoje.
3. Logar como Gestor → FAB "nova ocorrência" NÃO aparece; "Editar" não aparece.
4. Forçar erro: matar o backend e tentar atualizar → modal permanece aberto
   com `Não foi possível conectar a http://...`. 

### Passo 6 — Guardas de lista (papel)

Arquivo: `mobile/src/views/demands-list-view.tsx`
- FAB (linha ~225): `isGestorUser ? null : <Pressable ...>`.
- (não tocar em filtros — para gestor, a lista de TODOS os chamados já vem do
  backend sem filtro de cidadão; o título "Meus Chamados" pode ganhar
  variant por perfil num follow-up — NÃO fazer nesta entrega.)

**Aceite:** gestor não vê o FAB; cidadão vê.

## 5. Testes de API (suíte de automação)

Arquivo novo: `automation/tests/api/tests/test_demand_status.py` (seguir o
padrão de `test_public_demand_privacy.py` / `test_rate_limiting.py` — helpers
de `conftest` e `settings.py`).

Cenários mínimos (com usuário seed do backend):
1. `PATCH /demands/:id/status` com token **Gestor** e `status_id: "Em_Andamento"`
   → 200; corpo tem `status: "Em Andamento"`; resposta persistida
   (`GET /demands/:id` como gestor confirma status novo + evento de timeline).
2. Token **Cidadão** (seed) no mesmo endpoint → **403**
   (`requireRole(['Gestor'])`).
3. `status_id` inválido (`"xyz"`) com token Gestor → **400** "Status inválido."
4. Sem token → **401**.

Como a suíte exige a API no ar (`localhost:3000`) e usa seeds/credenciais de
`automation/data`, revisar `automation/README.md` seção de ambiente antes de
rodar. `pytest` deve emitir os relatórios padrão (`reports/api-report.html`,
`reports/api-junit.xml` — já configurados no `pytest.ini`).

**Aceite:** os 4 cenários passam contra um banco de teste com seed.

## 6. Regras do repositório (AGENTS.md — leitura obrigatória)

- **Atribuição inline**: toda unidade de código criada pela IA recebe
  `// Created by AI.` acima da declaração; toda unidade existente alterada
  recebe `// Updated by AI.` (se já houver `Created by AI.`, linha seguinte
  `Updated by AI.`). Ver exemplos em `contexts/demand-context.tsx`.
- **Proibido sem autorização humana explícita**: `git commit`, `git push`,
  merges e qualquer escrita em histórico/remoto — inclusive no submódulo
  `backend/`. O agente deve **preparar** as mudanças e perguntar antes de
  commitar.
- **Registro de uso de IA**: após a atividade, ANEXAR um bloco
  `## Registro da atividade 0096` (o último é 0095) em
  `USO_IA/Raphael-Miranda.md`, mesmo formato das entradas anteriores
  (tool/modelo usado, finalidade, etapa, tipo de contribuição, confirmação de
  revisão humana, arquivos alterados, resumo ≤ 200 caracteres).
- Não alterar código que não seja do escopo acima (não refatorar a tela de
  lista além do guard do FAB).

## 7. Checklist de validação final

- [ ] `cd mobile && npx tsc --noEmit` — sem erros.
- [ ] `cd mobile && npx expo lint` — **não deve trazer erros NOVOS** (erros
      pré-existentes em `session-context.tsx:63`, `use-demands-list-view-model.ts:99`
      e warning de `ScrollView` em `demands-list-view.tsx:10` podem ser ignorados
      — já existem antes desta tarefa).
- [ ] `cd backend && npx tsc --noEmit` — sem erros (só se algo no backend for tocado).
- [ ] Cenários manuais 1-4 do Passo 5 executados no Expo Go/emulador.
- [ ] 4 testes pytest passando (ou hospedados com evidência de execução no
      relatório `reports/api-junit.xml`).
- [ ] Comentários de atribuição em todas as unidades novas/alteradas.
- [ ] Registro `0096` adicionado em `USO_IA/Raphael-Miranda.md`.

## 8. Fora de escopo (marcar para follow-up, não implementar agora)

- Endpoints `PUT /gestor/chamados/:id/status` e companhia (`gestorRoutes.ts`) —
  outro fluxo de gestor (fila, equipe, transferência). Nesta entrega usar
  APENAS `PATCH /demands/:id/status` (mesma família de rotas que o app já usa).
- Validação de transições de status no backend (ex.: Proibir pular "Aberto" →
  "Fechado"). Hoje o backend aceita qualquer transição.
- `autor` do `timeline_event` de status gravado como `userId` cru (outros
  eventos gravam o nome). Não tocar aqui.
- Painel/dashboard de gestor (fila por gestor, estatísticas —
  `GET /gestor/dashboard`).
- Atualizar o README principal para documentar o fluxo de gestor no app.
