# Plano de implementação — ETL com os dados reais do Fiscalize

> Objetivo: fazer os chamados registrados no app/backend chegarem ao ETL, com endereço estruturado e coordenadas, para que o cruzamento com clima (Open-Meteo) e população (IBGE) use dados reais em vez do JSON fictício.

## Contexto para a próxima sessão (handoff)

Decisões já fechadas — não reabrir sem pedido explícito:

1. `numero` é opcional **apenas no chamado**; no cadastro do cidadão continua obrigatório.
2. `latitude`/`longitude` existem **apenas no chamado**. São obtidas automaticamente: CEP → ViaCEP + geocodificação; ou “usar minha localização atual” → GPS. O usuário só vê os valores em campos cinza, somente leitura.
3. `bairro` é obrigatório na abertura do chamado e deve ser normalizado para casar com o IBGE.
4. `complemento` é opcional no chamado.
5. O cadastro do cidadão **não** ganha coordenadas.
6. O dashboard **não** será alterado.
7. O sync é uma task do Prefect executada antes do ETL (se não houver Prefect em produção, usar cron).
8. O ETL usa `BACKEND_DATABASE_URL` no `etl/.env`, preenchido com o mesmo valor do `DATABASE_URL` do backend. O `DATABASE_URL` do ETL continua apontando para o Neon de destino.

Ordem de implementação: **Backend/Prisma → Mobile → Sync → ETL → validação**.

---

## 1. Situação atual (diagnóstico)

| Ponto | Hoje | Consequência |
|---|---|---|
| Entrada de chamados no ETL | `etl/data/chamados.json`, com registros fictícios (`etl/run_etl.py:29-31` e `etl/flow_etl.py:13-24`) | O ETL nunca vê os chamados reais |
| Banco do backend | PostgreSQL via Prisma (`backend/prisma/schema.prisma`) | É a fonte da verdade dos chamados |
| MongoDB do ETL | Banco `FISCALIZE_ETL`, coleções `clima_raw` e `populacao_ibge_raw` | Guarda só dados brutos externos, não chamados |
| Endereço do chamado | Apenas `chamado.endereco` (texto livre) | Não há CEP, bairro, número nem cidade estruturados |
| Bairro | Só existe em `cidadao.bairro` | O ETL de população não consegue agrupar chamados por bairro |
| Coordenadas | `chamado.latitude/longitude` existem, mas podem ser `0,0` | Clima não pode usar localização; dados inválidos passam despercebidos |
| Cadastro do cidadão | Tem ViaCEP no app (`mobile/src/views/register-view.tsx:62-85`) | Serve de padrão para o endereço do chamado; não precisa de coordenadas |
| Número no endereço | Obrigatório no cadastro (`authController.ts:24`) e no chamado | O chamado precisa permitir endereço sem número |
| Clima no ETL | Janela fixa `2026-02-01` a `2026-02-28` e ponto fixo de Recife (`etl/src/seed_mongo.py:32-37`) | Não cobre as datas reais dos chamados |
| População no ETL | Filtra Recife e usa `NM_BAIRRO` | Depende de o bairro do chamado bater com o nome do IBGE |

**Resumo:** o ETL está pronto para consumir um contrato simples de chamados, mas esse contrato hoje é alimentado por um JSON fictício. O trabalho é criar o caminho real: **backend → Mongo (`chamados_raw`) → ETL**.

---

## 2. Arquitetura alvo

```text
┌──────────────────────────────┐
│ App mobile                   │
│ cadastro + novo chamado      │
│ CEP (ViaCEP) + GPS           │
└──────────────┬───────────────┘
               │ HTTP (JSON)
               ▼
┌──────────────────────────────┐
│ Backend (Express + Prisma)   │
│ PostgreSQL                   │
│ cidadao / chamado / categoria│
└──────────────┬───────────────┘
               │ leitura somente (SQL, usuário read-only)
               ▼
┌──────────────────────────────┐
│ Sync Python (ETL)            │
│ backend → Mongo              │
│ coleção: chamados_raw        │
│ + data_extracao              │
│ + campos derivados           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ MongoDB FISCALIZE_ETL        │
│ chamados_raw                 │  ◄── novo
│ clima_raw                    │
│ populacao_ibge_raw           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ ETL (extract → transform)    │
│ clima por data               │
│ população por bairro         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ SQLite + Neon (PostgreSQL)   │
│ chamados_clima               │
│ chamados_populacao           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Dashboard Streamlit          │
└──────────────────────────────┘
```

### Decisões de arquitetura

| ID | Decisão | Justificativa |
|---|---|---|
| D1 | O backend continua sendo a fonte da verdade; o ETL **nunca escreve** no banco do backend | Evita acoplamento e risco de corromper dados operacionais |
| D2 | O ETL lê o backend com um usuário **read-only** e grava o resultado no Mongo (`chamados_raw`) | Mantém o padrão “bronze” já usado em clima/população e reaproveita a seleção da carga mais recente |
| D3 | O JSON `etl/data/chamados.json` deixa de ser a entrada de produção | Ele pode continuar existindo apenas como fixture de teste/offline |
| D4 | Endereço estruturado passa a existir **no chamado**; as coordenadas ficam **somente no chamado** | O ETL precisa do bairro e das coordenadas do local da ocorrência; o cadastro do cidadão não precisa armazená-las |
| D5 | `chamado.bairro` é obrigatório e vira um **snapshot** do bairro no momento do registro | Se o cidadão mudar de endereço depois, o chamado antigo continua no bairro correto para o ETL |
| D6 | O sync copia apenas campos analíticos (sem descrição, nome, rua, número, foto) | Minimiza exposição de dados pessoais no Mongo/ETL |
| D7 | O ETL passa a usar a **data local de Recife** (`America/Recife`) para cruzar clima | Evita erro de um dia em chamados registrados à noite (UTC × UTC-3) |
| D8 | Coordenadas do chamado são **automáticas** (CEP/geocodificação ou GPS), nunca digitadas | Evita erro humano e garante que o ETL receba coordenadas válidas |

---

## 3. Passo 1 — Modelo de dados (Prisma + migração)

### 3.1 Novos campos

**`chamado`** (`backend/prisma/schema.prisma`):

```prisma
cep         String? @db.VarChar(9)
rua         String? @db.VarChar(150)
numero      String? @db.VarChar(20)   // opcional
bairro      String? @db.VarChar(100)  // obrigatório na API; nullable por causa dos registros antigos
cidade      String? @db.VarChar(100)
estado      String? @db.VarChar(2)
complemento String? @db.VarChar(150)  // opcional
```

**`cidadao` não recebe latitude/longitude.** As coordenadas existem apenas em `chamado.latitude` e `chamado.longitude`, que já existem no schema atual.

Manter `chamado.endereco` como texto composto (compatibilidade com telas, listagens e API atual). O endereço composto passa a ser gerado no backend por uma função única.

Adicionar índice:

```prisma
@@index([bairro], map: "idx_chamado_bairro")
```

### 3.2 Migração

Nome sugerido: `add_chamado_address_fields`.

Passos:

1. Alterar o schema.
2. Rodar `npx prisma migrate dev --name add_chamado_address_fields` no `backend/`.
3. Na migração SQL, incluir backfill:
   - `chamado.bairro = cidadao.bairro` quando `chamado.bairro IS NULL`;
   - `chamado.cidade/estado = cidadao.cidade/estado` quando fizer sentido;
   - normalizar o bairro preenchido (`TRIM` + `UPPER`) para facilitar o match com o IBGE;
   - não preencher `rua/numero/complemento` de chamados antigos (não há como saber se o endereço do chamado é o do cadastro).
4. Rodar `npx prisma generate`.

### 3.3 Dados antigos

- Chamados com `latitude = 0` e `longitude = 0` devem ser tratados como **coordenada ausente** no sync (`coordenada_valida = false`), não como ponto no Golfo da Guiné.
- O ETL não deve quebrar por causa deles: apenas registra em log e mantém o chamado na contagem por bairro quando o bairro existir.

---

## 4. Passo 2 — Backend: contrato de endereço e coordenadas

### 4.1 Utilitário único de endereço

Criar `backend/src/utils/address.ts`:

```ts
export type AddressInput = {
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  complemento?: string | null;
};

export function composeAddress(address: AddressInput): string;

// Created by AI.
export function normalizeBairro(value: string | null): string | null;
```

Regras:

- `numero` vazio/null é simplesmente omitido (sem `, null` ou `, undefined`).
- Formato: `Rua, [número,] Bairro, Cidade - UF, CEP 00000000[, complemento]`.
- Normalizar `estado` para maiúsculo e `cep` para somente dígitos.
- `normalizeBairro` faz `trim` → maiúsculas → remove acentos (NFKD) → colapsa espaços.

Reutilizar em `authService.register`, `authService.updateProfile`, `demandService.create` e `demandService.update`.

### 4.2 Cadastro do cidadão

O cadastro **não muda** em regras:

- `numero` continua **obrigatório** no cadastro (`authController.register`).
- No `updateMe` (edição do cadastro), também exigir `numero`, porque a regra “opcional” vale **somente** para o chamado. Hoje o `updateMe` aceita vazio; isso deve ser ajustado.
- `cidadao` **não** ganha latitude/longitude.
- O único ajuste é reutilizar `composeAddress` em `authService.register` e `authService.updateProfile` para gerar `cidadao.endereco` do mesmo jeito que o chamado, mantendo o padrão visual das duas telas.

`mobile/src/models/usuario.ts` permanece sem coordenadas.

### 4.3 Chamado

`backend/src/controllers/demandController.ts`:

- `create`: aceitar os campos estruturados (`cep`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `complemento`, `latitude`, `longitude`).
- `location` pode continuar sendo aceito, mas deixa de ser obrigatório quando o endereço estruturado vier completo; o backend compõe `endereco`.
- `numero` é opcional.
- `complemento` é opcional.
- `bairro` é **obrigatório** (rejeitar vazio/só espaços) e deve ser salvo já normalizado.
- `latitude/longitude` são **obrigatórios na criação** e vêm do preenchimento automático do app (CEP/geocodificação ou GPS), nunca de digitação. Rejeitar `0,0` e coordenadas fora de limites plausíveis do Brasil.
- `update`: aceitar os mesmos campos; atualizar `bairro` e coordenadas junto com `endereco`.

`backend/src/services/demandService.ts`:

- `create`: gravar `cep`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `complemento`, `endereco` composto, `latitude`, `longitude`.
- `update`: atualizar os mesmos campos e registrar `dadosantigos`/`dadosnovos` da timeline com o endereço estruturado.
- Serialização de resposta (`create`, `update`, `list`, `findById`): incluir `bairro`, `cep`, `rua`, `numero`, `cidade`, `estado`, `complemento`, `latitude`, `longitude`.

Contrato sugerido (flat, espelhando o cadastro):

```json
{
  "title": "Buraco na via",
  "description": "Buraco grande em frente ao número 100.",
  "category_id": 1,
  "cep": "51020000",
  "rua": "Rua dos Navegantes",
  "numero": "100",
  "bairro": "Boa Viagem",
  "cidade": "Recife",
  "estado": "PE",
  "complemento": null,
  "latitude": -8.1264,
  "longitude": -34.9036
}
```

> `location` deixa de ser obrigatório, mas continua sendo devolvido nas respostas como `location` (endereço composto) para não quebrar telas existentes.

### 4.4 Swagger e testes

- Atualizar `backend/src/config/swagger.ts` com os novos campos.
- Testes de integração:
  - criar chamado com número e sem número;
  - criar chamado sem `bairro` → 400;
  - criar chamado sem coordenadas → 400;
  - criar chamado com `complemento` vazio → 201;
  - atualizar endereço e conferir `bairro`/coordenadas;
  - cadastro continua exigindo `numero` (sem mudança);
  - `/auth/me` **não** retorna coordenadas (não existem no cadastro).

---

## 5. Passo 3 — Mobile: endereço estruturado no chamado (reaproveitando o padrão do cadastro)

### 5.1 Serviços e componentes compartilhados

Criar:

- `mobile/src/services/address-service.ts`
  - `lookupCep(cep)`: ViaCEP, com timeout e normalização para 8 dígitos. Devolve `rua`, `bairro`, `cidade`, `uf`.
  - `geocodeAddress(address)`: `Location.geocodeAsync` para obter `latitude`/`longitude` a partir do endereço retornado pelo CEP. É o caminho automático quando o usuário digita o CEP.
  - `getCurrentAddress()`: permissão foreground → `getCurrentPositionAsync` → `reverseGeocodeAsync`. É o caminho automático quando o usuário aceita geolocalizar.
- `mobile/src/components/address-fields.tsx`
  - Campos: CEP, Rua, Número (opcional no chamado), Bairro, Cidade, UF, Complemento.
  - Busca automática do CEP ao completar 8 dígitos.
  - Botão “Usar minha localização atual”.
  - Dois campos **somente leitura** (`editable={false}`), com fundo cinza, mostrando `latitude` e `longitude` assim que forem obtidas.
  - Estados de carregamento e erros por campo.
- `mobile/src/hooks/use-address-form.ts`
  - Centraliza estado dos campos, busca de CEP, geocodificação, captura de GPS e validação.
  - Evita duplicar a lógica em cadastro, edição de perfil e chamado.
  - Expõe `coords` e `isResolvingCoords` para o formulário do chamado.

> Consultar a documentação versionada do Expo 57 (`https://docs.expo.dev/versions/v57.0.0/sdk/location/`) antes de implementar. As APIs usadas são `requestForegroundPermissionsAsync`, `getCurrentPositionAsync`, `reverseGeocodeAsync` e `geocodeAsync`. No Android, geocodificação exige permissão foreground.

> **Importante:** o ViaCEP devolve o endereço, mas **não** devolve latitude/longitude. Por isso, depois do CEP, o app chama `Location.geocodeAsync` (geocodificador do próprio dispositivo). Se no futuro for necessário geocodificar no servidor, a alternativa é usar Nominatim/OpenStreetMap no backend — mas isso adiciona uma dependência externa e não é necessário para o escopo atual.

### 5.2 Fluxo de preenchimento (sem digitar coordenadas)

1. **CEP**
   - Usuário digita 8 dígitos.
   - App chama ViaCEP e preenche `rua`, `bairro`, `cidade`, `uf`.
   - Se o CEP não tiver logradouro, o usuário completa rua/bairro manualmente.
   - Em seguida, o app chama `geocodeAsync` com o endereço montado para obter `latitude`/`longitude`.
2. **Localização atual**
   - App pede permissão (somente ao tocar no botão).
   - Captura coordenadas e faz reverse geocode.
   - Preenche `rua`, `número` (quando disponível), `bairro`, `cidade`, `estado`, `cep`.
   - As coordenadas capturadas substituem as obtidas pelo CEP.
   - Se o `postalCode` vier com hífen, normaliza para 8 dígitos.
   - No iOS, `region` pode vir como nome do estado; nesse caso, usar o ViaCEP a partir do `postalCode` para obter a UF.
3. **Exibição das coordenadas**
   - O formulário do chamado mostra dois campos `latitude` e `longitude` **somente leitura**, em cinza.
   - Os valores aparecem assim que o CEP for geocodificado ou o GPS for capturado.
   - O usuário não digita, não edita e não apaga esses valores.
4. **Chamado**
   - Não permitir salvar sem coordenadas válidas.
   - Bairro obrigatório.
   - Endereço estruturado obrigatório, exceto `numero` e `complemento`.
   - Se a geocodificação do CEP falhar, o usuário precisa tocar em “Usar minha localização atual” para liberar o botão de salvar.

### 5.3 Telas

| Arquivo | Mudança |
|---|---|
| `mobile/src/views/register-view.tsx` | Opcional: usar `AddressFields` para padronizar; número continua obrigatório; **sem** coordenadas |
| `mobile/src/viewmodels/use-register-view-model.ts` | Manter `numero` obrigatório; **sem** latitude/longitude |
| `mobile/src/views/profile-edit-view.tsx` | Opcional: usar `AddressFields`; número continua obrigatório; **sem** coordenadas |
| `mobile/src/views/demand-form-view.tsx` | Substituir o campo único “Endereço” pelo `AddressFields`; botão de localização; campos de latitude/longitude somente leitura em cinza |
| `mobile/src/viewmodels/use-demand-form-view-model.ts` | Estado do endereço estruturado + coordenadas automáticas; validação; payload novo; preencher no modo edição |
| `mobile/src/services/demand-service.ts` | `DemandInput` com os novos campos, incluindo `latitude`/`longitude` |
| `mobile/src/models/demand.ts` | `Demand`/`DemandDetail` com `bairro`, `cep`, `rua`, `numero`, `cidade`, `estado`, `complemento`, `latitude`, `longitude` |
| `mobile/src/services/auth-service.ts` | **Sem mudança** (cadastro não recebe coordenadas) |
| `mobile/app.json` | Ajustar o texto de permissão de localização para cobrir o preenchimento automático do chamado |

### 5.4 Regras de validação no app

| Campo | Cadastro | Chamado |
|---|---|---|
| CEP | Obrigatório (8 dígitos) | Obrigatório (8 dígitos) |
| Rua | Obrigatório | Obrigatório |
| Número | **Obrigatório** | **Opcional** |
| Bairro | Obrigatório | **Obrigatório** |
| Cidade | Obrigatório | Obrigatório |
| UF | Obrigatório (2 letras) | Obrigatório (2 letras) |
| Complemento | Opcional | **Opcional** |
| Latitude/Longitude | **Não se aplica** | **Obrigatório, automático e somente leitura** |

**Tratamento do bairro para o IBGE:** normalizar no backend e reforçar no sync/ETL (o app envia o valor como o usuário digitou):

```text
1. trim
2. uppercase
3. remover acentos (NFKD + remoção de combining marks)
4. colapsar espaços múltiplos
5. aplicar aliases conhecidos (ex.: "BOA VIAGEM" -> "BOA VIAGEM")
```

O valor normalizado é o que o ETL usa no merge com o IBGE. O valor original pode ficar em `bairro_original` no documento bronze, apenas para auditoria.

---

## 6. Passo 4 — Sincronização backend → MongoDB

### 6.1 Novo módulo

Criar `etl/src/sync_chamados.py` (ou `sync_backend.py`) com a classe `SyncChamados`:

1. Conectar ao PostgreSQL do backend usando `BACKEND_DATABASE_URL`, cujo valor é **o mesmo `DATABASE_URL` do backend** (usuário **read-only**).
2. Ler os chamados com uma query única, já com `categoria` e o bairro resolvido.
3. Converter `Decimal` → `float`, `timestamp` → ISO 8601 UTC.
4. Calcular `data_chamado` (data local em `America/Recife`).
5. Normalizar o bairro (maiúsculas, sem acentos, espaços colapsados).
6. Gravar/atualizar na coleção `chamados_raw` do Mongo.
7. Registrar o resumo da execução apenas em **log** (sem tabela `sync_runs`, para não criar escopo extra).
8. Expor um resumo no console: lidos, gravados, sem bairro, sem coordenada válida, bairros não encontrados no IBGE.

### 6.2 Query base

```sql
SELECT
  c.id,
  c.protocolo,
  cat.nome        AS categoria,
  c.subcategoria,
  c.bairro,
  c.cidade,
  c.estado,
  c.latitude,
  c.longitude,
  c.criadoem,
  c.status,
  c.prioridade
FROM chamado c
JOIN categoria cat ON cat.id = c.categoriaid
```

> Não trazer `cidadaoid`, `descricao`, `endereco`, `rua`, `numero`, `complemento`, `fotourl`. Esses campos não são necessários para clima/população e aumentam o risco de exposição de dados pessoais.

Fallback de bairro para chamados antigos:

```sql
COALESCE(NULLIF(c.bairro, ''), cid.bairro) AS bairro
LEFT JOIN cidadao cid ON cid.id = c.cidadaoid
```

### 6.3 Documento bronze (`chamados_raw`)

```json
{
  "_id": "uuid-do-chamado",
  "id": "uuid-do-chamado",
  "protocolo": "DEM-20260203-AB12",
  "categoria": "Infraestrutura",
  "subcategoria": "Buraco na pista",
  "bairro": "BOA VIAGEM",
  "bairro_original": "Boa Viagem",
  "cidade": "Recife",
  "estado": "PE",
  "latitude": -8.1264,
  "longitude": -34.9036,
  "coordenada_valida": true,
  "criadoem": "2026-02-03T14:22:00Z",
  "data_chamado": "2026-02-03",
  "status": "Aberto",
  "prioridade": "Alta",
  "data_extracao": "2026-11-07T17:00:00Z",
  "synced_at": "2026-11-07T17:00:00Z"
}
```

### 6.4 Estratégia de carga

- **Upsert por `_id`** (`bulk_write` com `UpdateOne(..., upsert=True)`), não `insert_many`.
- Todos os documentos recebem o mesmo `data_extracao` da execução.
- Documentos que não existem mais no backend (hard delete) são removidos com `delete_many({_id: {$nin: ids}})`.
- A seleção da “carga mais recente” do ETL continua funcionando sem alteração.
- Vantagem: o Mongo não cresce indefinidamente com uma cópia completa por execução; o histórico de execuções fica no log.

### 6.5 Configuração

O backend já guarda a conexão operacional em `DATABASE_URL` (`backend/.env`). O ETL **também** já usa uma variável chamada `DATABASE_URL`, mas ela aponta para o **Neon de destino**, que é outro banco. Por isso as duas não podem ter o mesmo nome dentro do `etl/.env`.

**Opção recomendada (menor impacto):** manter uma variável separada no `etl/.env`, preenchida com o valor do `DATABASE_URL` do backend.

Adicionar em `etl/src/config.py`:

```python
# Updated by AI.
BACKEND_DATABASE_URL = _required_setting("BACKEND_DATABASE_URL")
```

Adicionar em `etl/.env.example`:

```dotenv
# PostgreSQL do backend (somente leitura).
# Copie o valor do DATABASE_URL que já existe em backend/.env.
BACKEND_DATABASE_URL=postgresql://usuario_readonly:senha@host:5432/Fiscalize
```

O `DATABASE_URL` do `etl/.env` continua sendo o Neon, sem mudança. Em produção (Railway ou outro ambiente), basta configurar `BACKEND_DATABASE_URL` com a mesma connection string usada pelo backend.

**Alternativa (não recomendada agora):** renomear a variável de destino do ETL para `NEON_DATABASE_URL` e passar a usar `DATABASE_URL` para o backend. Isso exigiria alterar `etl/src/config.py`, o `.env` do ETL e o `dashboard/app.py`; é mais invasivo e não traz benefício.

Nunca usar o usuário dono do banco no sync. Criar uma role com `GRANT SELECT` apenas nas tabelas necessárias (`chamado`, `categoria`, `cidadao`).

### 6.6 Execução

```bash
# a partir da pasta etl/, com o venv do ETL ativo
python -m src.sync_chamados
```

Alternativa: criar `etl/sync_chamados.py` como entrypoint e rodar `python etl/sync_chamados.py` a partir da raiz (o diretório do script entra no `sys.path`, então `from src...` funciona). Ou executar via task no Prefect, antes da extração do ETL.

---

## 7. Passo 5 — Mudanças no ETL

### 7.1 Entrada de chamados

`etl/run_etl.py`:

- Remover `busca_chamados()` lendo JSON.
- Criar `busca_chamados(ext)` que:
  - chama `ext.extract_collection_from_mongo("chamados_raw")`;
  - remove `_id`, `data_extracao`, `synced_at`;
  - devolve `list[dict]`.
- Usar `busca_chamados(ext)` tanto em `run_clima` quanto em `run_populacao`.
- Ordem do `run_clima`:
  1. ler chamados do Mongo;
  2. calcular `min(data_chamado)` e `max(data_chamado)`;
  3. garantir a carga de clima para esse intervalo;
  4. ler `clima_raw`, transformar e cruzar.

`etl/flow_etl.py`:

- Adicionar task `sincronizar_chamados` (opcional, controlada por parâmetro).
- Substituir `ler_chamados()` por `extrair_mongo("chamados_raw")`.
- Manter as tasks de clima, população, SQLite e Neon.

### 7.2 Clima com intervalo dinâmico

`etl/src/seed_mongo.py`:

- Trocar a assinatura para receber `data_inicio`, `data_fim`, `latitude` e `longitude`.
- Defaults: ponto central de Recife (`-8.0631, -34.8711`) e timezone `America/Recife`.
- Manter a chamada única à API e o armazenamento em `clima_raw` com `data_extracao`.

`etl/run_etl.py`:

- `carregar_da_api=True` força uma nova carga.
- Se `carregar_da_api=False`, validar se `clima_raw` cobre `[min, max]`; se não cobrir, buscar automaticamente o intervalo faltante (ou o intervalo completo).
- Arredondar o intervalo para incluir um dia antes e um dia depois, para segurança.

### 7.3 Transformação

`etl/src/transform.py`:

- `merge_chamados_clima`:
  - usar `data_chamado` quando existir; senão converter `criadoem` para `America/Recife` antes de extrair a data.
  - manter `how="left"` e a distinção entre precipitação `0` (válido) e ausente (`NaN`).
  - selecionar apenas as colunas do modelo conceitual antes da carga (`id`, `categoria`, `subcategoria`, `bairro`, `data`, `temperatura`, `precipitacao`), sem coordenadas exatas.
- `merge_chamados_populacao`:
  - normalizar `bairro` dos chamados e do IBGE com a mesma função;
  - manter chamados sem bairro em uma linha `NAO INFORMADO` (população nula) ou reportá-los em log, para não sumirem silenciosamente;
  - calcular `chamados_por_1000` somente quando `populacao > 0`;
  - reportar bairros sem correspondência no IBGE.

Criar `etl/src/normalize.py`:

```python
import unicodedata


# Created by AI.
def normalize_bairro(value: str | None) -> str | None:
    if value is None:
        return None

    texto = " ".join(str(value).strip().upper().split())
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return texto or None
```

Opcional: `etl/data/bairro_aliases.json` para divergências que a normalização não resolve. O sync usa a mesma função antes de gravar `chamados_raw`, e o `transform_populacao` usa a mesma função no `NM_BAIRRO` do IBGE. Assim os dois lados chegam ao merge com o mesmo formato. Guardar o valor original em `bairro_original` no bronze apenas para auditoria.

### 7.4 Carga

`etl/src/load.py`:

- Adicionar `upsert_mongo(records, collection_name, id_field="_id")` para o sync.
- Manter `load_mongo` para clima/população (histórico por inserção).
- Manter `load_sqlite` e `load_neon` como estão.

### 7.5 Documentação e dependências

- Atualizar `etl/README-ETL.md`:
  - nova coleção `chamados_raw`;
  - nova variável `BACKEND_DATABASE_URL`;
  - ordem de execução (sync → ETL);
  - JSON apenas como fixture.
- Atualizar `etl/ORQUESTRCAO_PREFECT.md`.
- `etl/requirements.txt` já tem `sqlalchemy`, `psycopg2-binary` e `psycopg`; não é necessário adicionar dependência.

---

## 8. Passo 6 — Como clima e IBGE se relacionam com os chamados reais

Esta é a parte conceitual que costuma confundir. As duas fontes entram por **chaves diferentes**:

| Fonte | Chave de ligação | O que é acrescentado ao chamado |
|---|---|---|
| Open-Meteo (clima) | **data** do chamado | temperatura média e precipitação do dia |
| IBGE (população) | **bairro** do chamado | população do bairro e chamados por 1.000 habitantes |

As coordenadas servem para **qualificar** o chamado (saber onde ele ocorreu, escolher o ponto/clima e permitir análises espaciais), mas não substituem essas chaves.

### 8.1 Clima (Open-Meteo)

**O que é:** uma API HTTP pública de dados meteorológicos históricos. O ETL chama:

```text
https://archive-api.open-meteo.com/v1/archive
  ?latitude=-8.0631
  &longitude=-34.8711
  &start_date=2026-02-01
  &end_date=2026-02-28
  &daily=temperature_2m_mean,precipitation_sum
  &timezone=America/Recife
```

**O que a API devolve:** um documento com listas paralelas:

```json
{
  "daily": {
    "time": ["2026-02-01", "2026-02-02", "..."],
    "temperature_2m_mean": [27.1, 26.8, "..."],
    "precipitation_sum": [0.0, 12.4, "..."]
  }
}
```

**O que o ETL faz:**

1. O `sync` grava os chamados reais no Mongo.
2. O ETL lê os chamados e descobre o menor e o maior `data_chamado`.
3. Busca no Open-Meteo exatamente esse intervalo (ou reutiliza `clima_raw` se já cobrir).
4. A transformação “explode” as listas em uma linha por data:

   | data | temperatura | precipitacao |
   |---|---|---:|---:|
   | 2026-02-03 | 26,8 | 12,4 |
   | 2026-02-04 | 27,2 | 0,0 |

5. O merge é por data:

   ```text
   chamado (criado em 2026-02-03)  ──LEFT JOIN──  clima (2026-02-03)
   ```

6. Cada chamado recebe a temperatura e a chuva **do dia em que foi registrado**.

**Como as coordenadas chegam ao ETL:**

- O usuário **não digita** latitude/longitude.
- Se ele informa o CEP, o app usa ViaCEP para preencher o endereço e `geocodeAsync` para obter as coordenadas.
- Se ele aceita a geolocalização, o app usa `getCurrentPositionAsync` (GPS) e reverse geocode para preencher o endereço.
- O formulário exibe latitude/longitude em campos somente leitura, em cinza, apenas para conferência.
- O backend exige coordenadas válidas na criação do chamado; o sync as copia para `chamados_raw`.

**Por que a coordenada importa aqui:**

- Hoje todos os chamados são de Recife, então uma única série climática da cidade basta.
- Se no futuro houver chamados de outras cidades, a coordenada permite buscar uma série por cidade/bairro (ou agrupar por coordenadas arredondadas).
- A coordenada também permite análises futuras (ex.: chuva vs. buracos por região).

**Cuidados:**

- A API de arquivo tem atraso para os últimos dias; dias muito recentes podem vir nulos. O ETL deve preservar `NaN` e não inventar zero.
- Precipitação `0` é um valor válido (não choveu); ausência de dado é `NaN`.
- Usar `America/Recife` no `criadoem` para não deslocar a data em chamados noturnos.

**Exemplo:**

```text
Chamado DEM-20260203-AB12
  criadoem local: 2026-02-03 22:10 (Recife)
  clima 2026-02-03: 26,8 °C, 12,4 mm
  → chamados_clima: DEM-20260203-AB12 | Infraestrutura | 2026-02-03 | 26,8 | 12,4
```

### 8.2 População (IBGE)

**O que é:** o IBGE não oferece uma API REST para esse recorte. O ETL baixa um ZIP do FTP:

```text
https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/
  Agregados_por_Setores_Censitarios/
  Agregados_por_Bairro_csv/
  Agregados_por_bairros_demografia_BR.zip
```

Dentro do ZIP está `Agregados_por_bairros_demografia_BR.csv`. As colunas usadas são:

| Coluna | Significado |
|---|---|
| `CD_BAIRRO` | código do bairro (Recife começa com `2611606`) |
| `NM_BAIRRO` | nome do bairro |
| `V01006` | quantidade de moradores |

**O que o ETL faz:**

1. Baixa o CSV (isso é feito esporadicamente, não a cada execução).
2. Filtra apenas bairros de Recife (`CD_BAIRRO` começando com `2611606`).
3. Padroniza `NM_BAIRRO` com a mesma função usada no chamado: `trim`, maiúsculas, sem acentos, espaços colapsados.
4. Conta os chamados por `chamado.bairro` (o bairro é obrigatório na abertura do chamado).
5. Faz o merge pelo nome do bairro:

   ```text
   chamados agrupados por bairro  ──LEFT JOIN──  população IBGE por bairro
   ```

6. Calcula:

   ```text
   chamados_por_1000 = (chamados / populacao) * 1000
   ```

**Por que o bairro precisa estar no chamado:**

O CSV do IBGE é organizado por **nome de bairro**. Ele não aceita latitude/longitude. Portanto, a ponte entre o chamado e o IBGE é o campo `bairro`.

É por isso que o formulário do chamado passa a ter CEP + bairro + localização atual:

- o CEP preenche o bairro via ViaCEP;
- a localização atual preenche o bairro via reverse geocode;
- o backend salva `chamado.bairro` (snapshot);
- o sync copia esse bairro para o Mongo;
- o ETL usa esse bairro para o merge com o IBGE.

**E se só tivéssemos coordenadas?** Seria necessário um shapefile/malha dos bairros de Recife para fazer um join espacial (ponto dentro do polígono). Isso é possível, mas é uma etapa futura; o nome do bairro é o caminho mais simples e já resolve o dashboard.

**Cuidados:**

- Nomes divergentes: “Boa Viagem” vs “BOA VIAGEM” (resolvido por normalização), acentos, abreviações.
- Bairros sem correspondência no IBGE devem aparecer em log, não ser descartados em silêncio.
- População nula/zero não deve gerar divisão inválida; nesse caso `chamados_por_1000` fica nulo.
- O IBGE é atualizado por censo; não é necessário baixar a cada execução.

**Exemplo:**

```text
Chamado DEM-20260203-AB12
  bairro: BOA VIAGEM
  IBGE: BOA VIAGEM | população 125.755
  chamados no bairro: 2
  chamados_por_1000 = 2 / 125755 * 1000 = 0,02
  → chamados_populacao: BOA VIAGEM | 2 | 125755 | 0,02
```

### 8.3 Pipeline completo, na ordem

```text
1. sync backend → Mongo.chamados_raw
2. ETL lê chamados_raw (última carga)
3. ETL calcula min/max data_chamado
4. ETL busca Open-Meteo no intervalo → Mongo.clima_raw
5. ETL lê clima_raw, transforma e cruza por data
6. ETL grava chamados_clima no SQLite e no Neon
7. ETL lê populacao_ibge_raw (carga anual/manual)
8. ETL conta chamados por bairro, normaliza e cruza com IBGE
9. ETL grava chamados_populacao no SQLite e no Neon
10. Dashboard lê chamados_populacao no Neon
```

---

## 9. Passo 7 — Qualidade de dados (sem mudanças no dashboard)

**O dashboard não terá mudanças.** Ele continua lendo `chamados_populacao` no Neon exatamente como hoje. Nada de `sync_runs`, avisos ou novos campos no dashboard.

As validações abaixo acontecem apenas no ETL, via logs:

| Verificação | Ação |
|---|---|
| Chamados lidos no backend = chamados no Mongo | Erro se a diferença não for explicada |
| Chamados sem `bairro` | Contar e reportar (não deveria acontecer em chamados novos) |
| Chamados com `coordenada_valida = false` | Contar e reportar |
| Bairros sem match no IBGE | Listar nomes |
| Datas sem clima | Contar e listar intervalo |
| Duplicidade de `id` no Mongo | Erro |
| `chamados_por_1000` nulo | Reportar bairros com população ausente |

---

## 10. Passo 8 — Testes e critérios de aceite

### Backend

- [ ] Migração aplica sem erro e backfill de `bairro` funciona.
- [ ] Criar chamado com endereço estruturado e coordenadas → 201.
- [ ] Criar chamado sem número → 201.
- [ ] Criar chamado sem `bairro` → 400.
- [ ] Criar chamado sem coordenadas → 400.
- [ ] Criar chamado sem `complemento` → 201.
- [ ] Atualizar chamado alterando bairro/coordenadas → 200 e timeline correta.
- [ ] Cadastro continua exigindo número; `/auth/me` não retorna coordenadas.
- [ ] Swagger atualizado.

### Mobile

- [ ] CEP de 8 dígitos preenche rua/bairro/cidade/UF e obtém coordenadas automaticamente.
- [ ] CEP inválido mostra erro amigável.
- [ ] “Usar minha localização atual” preenche endereço e coordenadas.
- [ ] Latitude/longitude aparecem em campos somente leitura, em cinza, e não podem ser editadas.
- [ ] Perfil continua exigindo número e não mostra coordenadas.
- [ ] Chamado novo exige bairro e coordenadas, mas permite número e complemento vazios.
- [ ] Edição de chamado pré-preenche o endereço estruturado.
- [ ] Permissão negada não quebra o formulário; o usuário consegue usar CEP.

### ETL

- [ ] `sync_chamados` grava `chamados_raw` com `data_extracao`.
- [ ] Segunda execução do sync não duplica chamados.
- [ ] ETL lê `chamados_raw` e não o JSON.
- [ ] Clima cobre o intervalo real dos chamados.
- [ ] Chamado noturno usa a data local de Recife.
- [ ] Bairros com acento/maiúsculas fazem match com o IBGE.
- [ ] Bairros sem match aparecem no relatório.
- [ ] `chamados_clima` e `chamados_populacao` carregam no SQLite e no Neon.
- [ ] Dashboard continua funcionando.

### Aceite final

Um chamado criado no app, em um bairro de Recife, com coordenadas, deve aparecer:

1. no PostgreSQL do backend;
2. em `chamados_raw` no Mongo após o sync;
3. em `chamados_clima` com a temperatura/chuva do dia;
4. em `chamados_populacao` somado ao bairro correto, com `chamados_por_1000`;
5. no dashboard.

---

## 11. Passo 9 — Ordem de execução (checklist)

### Fase A — Backend e banco

- [ ] Criar `utils/address.ts`.
- [ ] Alterar schema Prisma + migração + backfill.
- [ ] Atualizar `authController`/`authService` apenas para reutilizar `composeAddress` (número continua obrigatório; sem coordenadas).
- [ ] Atualizar `demandController`/`demandService` (endereço estruturado, bairro obrigatório, coordenadas automáticas).
- [ ] Atualizar Swagger e testes.

### Fase B — Mobile

- [ ] Criar `address-service.ts`, `address-fields.tsx`, `use-address-form.ts`.
- [ ] (Opcional) Atualizar cadastro para usar `AddressFields` (número continua obrigatório; sem coordenadas).
- [ ] (Opcional) Atualizar edição de perfil para usar `AddressFields` (número continua obrigatório; sem coordenadas).
- [ ] Atualizar formulário de chamado (endereço estruturado + coordenadas automáticas + campos cinza somente leitura).
- [ ] Atualizar models e services.
- [ ] Ajustar permissão no `app.json`.

### Fase C — Sync e ETL

- [ ] Criar `etl/src/sync_chamados.py`.
- [ ] Adicionar `BACKEND_DATABASE_URL` em `config.py` e `.env.example`, preenchido com o valor do `DATABASE_URL` do backend.
- [ ] Adicionar `upsert_mongo` em `load.py`.
- [ ] Criar `etl/src/normalize.py`.
- [ ] Atualizar `run_etl.py`, `flow_etl.py`, `seed_mongo.py`, `transform.py`.
- [ ] Atualizar `README-ETL.md` e `ORQUESTRCAO_PREFECT.md`.

### Fase D — Validação

- [ ] Rodar sync inicial.
- [ ] Rodar ETL completo.
- [ ] Conferir SQLite e Neon.
- [ ] Abrir o dashboard.
- [ ] Registrar uso de IA em `USO_IA/<pessoa>.md` (novo `## Registro da atividade`), conforme `AGENTS.md`.

> O backend é um submódulo Git. As mudanças nele precisam ser commitadas separadamente, com aprovação humana, conforme `AGENTS.md`.

---

## 12. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Geocodificação do CEP falhar | Chamado fica sem coordenadas | Fallback via GPS (“Usar minha localização atual”); mensagem clara; bloquear salvar só enquanto não houver coordenada |
| Nomes de bairro divergentes | Chamados ficam sem população | Normalização + aliases + relatório de não encontrados |
| `criadoem` em UTC | Clima deslocado em um dia | Usar `data_chamado` em `America/Recife` |
| Open-Meteo sem dados recentes | Clima nulo nos últimos dias | Preservar `NaN`; rodar o ETL com atraso ou complementar com API de forecast |
| `if_exists="replace"` no Neon | Erro `must be owner of table` | Garantir owner/permissões antes da execução; já documentado no README |
| Dados antigos com `0,0` | Análise espacial errada | `coordenada_valida = false`; não usar no clima |
| Sync com usuário de escrita | Risco ao banco operacional | Role read-only + `GRANT SELECT` |
| Dados pessoais no Mongo | LGPD | Copiar só campos analíticos; sem descrição/rua/número/foto |
| JSON antigo ainda usado | ETL continua fictício | Remover `busca_chamados()` do JSON e documentar fixture |

### Decisões confirmadas

1. **Número opcional apenas no chamado.** O cadastro continua exigindo número.
2. **Coordenadas obrigatórias no chamado, sempre automáticas.** O app obtém por CEP/geocodificação ou por GPS; o usuário só visualiza em campos cinza.
3. **Bairro obrigatório na abertura do chamado**, com normalização de string para casar com o IBGE.
4. **Complemento opcional no chamado.**
5. **Sem coordenadas no cadastro do cidadão.** Elas existem apenas no chamado.
6. **Sem mudanças no dashboard.**

### Prefect ou cron? (item 4 da conversa anterior)

Não é uma decisão de arquitetura de dados, é só **quem dispara o sync**. As duas opções fazem a mesma coisa:

- **Task no Prefect (recomendado):** o `flow_etl.py` executa `sincronizar_chamados → extrair → transformar → carregar` numa única execução, com logs, retries e ordem garantida. Um comando só: `python etl/flow_etl.py`.
- **Cron separado:** um agendador (cron, Railway, GitHub Actions) roda primeiro `python -m src.sync_chamados` e depois o ETL. Funciona igual, mas a ordem e o tratamento de falha ficam por sua conta.

Como o projeto já usa Prefect e o volume é pequeno, o plano adota **task no Prefect**. Se o Prefect não for usado em produção, troque por cron sem mudar o resto do plano. O importante é que o sync rode **antes** da extração do ETL.

---

## 13. Mapa de arquivos

### Backend

```text
backend/prisma/schema.prisma                         # novos campos + índice
backend/prisma/migrations/<nova>/migration.sql       # migração + backfill
backend/src/utils/address.ts                         # composeAddress (novo)
backend/src/services/authService.ts                  # composeAddress no cadastro (sem coords)
backend/src/controllers/authController.ts            # cadastro inalterado (número obrigatório)
backend/src/services/demandService.ts                # endereço estruturado no chamado
backend/src/controllers/demandController.ts          # validação do novo contrato
backend/src/config/swagger.ts                        # documentação
```

### Mobile

```text
mobile/src/services/address-service.ts               # ViaCEP + geocodificação (novo)
mobile/src/components/address-fields.tsx             # campos reutilizáveis + coords read-only (novo)
mobile/src/hooks/use-address-form.ts                 # estado/validação/coords automáticas (novo)
mobile/src/views/register-view.tsx                   # usa AddressFields (número obrigatório, sem coords)
mobile/src/viewmodels/use-register-view-model.ts     # CEP; número continua obrigatório
mobile/src/views/profile-edit-view.tsx               # CEP automático (sem coords)
mobile/src/views/demand-form-view.tsx                # endereço estruturado + coords cinza
mobile/src/viewmodels/use-demand-form-view-model.ts  # estado + payload novo
mobile/src/services/demand-service.ts                # DemandInput
mobile/src/services/auth-service.ts                  # sem mudança
mobile/src/models/demand.ts                          # campos de endereço + coords
mobile/src/models/usuario.ts                         # sem coordenadas
mobile/app.json                                      # texto de permissão
```

### ETL

```text
etl/src/config.py                                    # BACKEND_DATABASE_URL
etl/src/sync_chamados.py                             # sync backend → Mongo (novo)
etl/src/normalize.py                                 # normalização de bairro (novo)
etl/src/load.py                                      # upsert_mongo
etl/src/seed_mongo.py                                # clima com intervalo dinâmico
etl/src/extract.py                                   # leitura da última carga (reuso)
etl/src/transform.py                                 # merge por data local + bairro normalizado
etl/run_etl.py                                       # lê chamados_raw
etl/flow_etl.py                                      # task de sync + chamados_raw
etl/.env.example                                     # nova variável
etl/README-ETL.md                                    # documentação
etl/ORQUESTRCAO_PREFECT.md                           # documentação da orquestração
etl/data/chamados.json                               # apenas fixture de teste
```

---

## 14. Fora de escopo (por enquanto)

- Upload e armazenamento de fotos do chamado.
- Clima por bairro com uma chamada por coordenada (o plano usa uma série de Recife).
- Join espacial com shapefile de bairros do IBGE.
- Sincronização em tempo real (webhook/CDC). O sync é em lote.
- Exclusão/anonimização automática de dados antigos no Mongo.

---

## 15. Resumo em uma frase

O app passa a capturar endereço estruturado + coordenadas automáticas **somente no chamado**; o backend salva isso no chamado (o cadastro do cidadão fica como está); um job de sync copia somente os campos analíticos para `chamados_raw` no Mongo; o ETL lê essa coleção e cruza cada chamado com o clima **pela data local de Recife** e com a população do IBGE **pelo bairro normalizado**.

---

## 16. Atualização — camadas silver/gold, soft delete e clima no dashboard

<!-- Created by AI. -->

Esta seção substitui, para os itens abaixo, as decisões anteriores do plano.

- **Soft delete:** a tabela `chamado` ganhou `excluidoem`. Os chamados legados sem bairro foram marcados como excluídos (e fechados) pela migration `20261110000000_add_chamado_soft_delete`. Consultas de chamados, métricas e exportação de dados pessoais filtram `excluidoem IS NULL`; o DELETE passa a preencher `excluidoem`.
- **Bronze:** o MongoDB continua sendo a única camada bronze (`chamados_raw`, `clima_raw`, `populacao_ibge_raw`).
- **Silver:** novas tabelas persistidas no SQLite e no Neon: `silver_chamado`, `silver_clima_diario` e `silver_bairro_populacao`.
- **Gold:** `chamados_clima`, `chamados_populacao` e a nova `chamados_clima_diario` são geradas exclusivamente a partir da silver.
- **Dashboard:** a decisão de não alterar o dashboard foi substituída. O Streamlit agora exibe indicadores climáticos, dois gráficos de eixo duplo (chamados × precipitação e chamados × temperatura) e a tabela diária `chamados_clima_diario` no Neon.
- **Carga no Neon:** substituído `if_exists="replace"` por `DELETE` + `INSERT` na mesma transação, sem exigir propriedade da tabela.
- **Sync:** a query de chamados passou a filtrar `c.excluidoem IS NULL` e a trazer `cep`, `rua`, `numero`, `complemento` e `atualizadoem`.
