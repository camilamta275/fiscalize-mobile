# Plano de Testes e Backlog de Automação

> **Produto / SUT:** Fiscalize  
> **Equipe / Squad:** 3  
> **Data:** 23/09/2026

## Integrantes

- RAPHAEL RENNAN SOARES DE MIRANDA
- RENÉ MELO DE LUCENA
- ALESSANDRA BARBOSA DE SANTANA
- MARIA GABRIELA DAMÁSIO BEZERRA
- ANA SOFIA DA SILVA MOURA
- CAMILA MARIA TEIXEIRA ALCÂNTARA
- SAMUEL SILVA ARAÚJO DE BRITO
- RAYANE CAVALCANTI DA SILVA
- LUCAS RODRIGUES DA SILVA JUNIOR
- VICTOR FERREIRA MARQUES

<details>
<summary><strong>1. Escopo</strong></summary>

O que a atividade de teste se compromete a verificar, e o que ela declaradamente não verifica.

Entra no escopo: os fluxos principais do produto ponta a ponta, as regras que protegem esses
fluxos e o contrato que os sustenta, incluindo o comportamento do produto na fronteira quando
uma dependência externa falha.

Fica fora do escopo: o comportamento de sistemas externos fora do controle da squad, os
recursos físicos do dispositivo e o que custa mais do que devolve no prazo do projeto.

| Item | Dentro do escopo? | Motivo |
|---|---|---|
| Registro de demanda com categoria e descrição (exemplo) | Sim | Fluxo principal do produto; regra de negócio concentrada aqui |
| Classificação automática da imagem por serviço externo (exemplo) | Não | Comportamento de terceiro, não determinístico e fora do controle da squad |
| Perfil de usuário (login e cadastro) | Sim | Controle de usuários e acessos |
| Registro de chamado | Sim | Funcionalidade principal para operação do sistema |
| Tela 'Meus Chamados' com listagem em tempo real e status coloridos | Sim | Visibilidade para o usuário sobre o andamento do chamado |
| Upload de foto e geolocalização no chamado | Não | Manual (tem que entrar pra Renan Mobile) |
| Linha do tempo com fotos antes/depois | Não | Funcionalidade para pós mvp |
| Notificações do app | Sim |  |
| Concluir chamados | Sim |  |
| Fila de chamados com filtros por status, prioridade e busca | Sim |  |
| Autenticação de senha com regras | Sim |  |

**Verificação**

- Todo fluxo principal do produto aparece como Sim.
- Toda linha Não tem motivo.

</details>

<details>
<summary><strong>2. Níveis de teste</strong></summary>

Em que altura do sistema cada condição é verificada, e quanto essa escolha custa.

Atividade: declarar no plano os níveis em que ele atua, com uma frase de justificativa por nível incluído e por nível excluído.

| Nível | O que responde | Dentro do plano? |
|---|---|---|
| Componente | A unidade isolada faz o que promete? | Sim |
| Integração de componentes | As partes conversam entre si corretamente? | Sim |
| Sistema | O sistema inteiro entrega o comportamento esperado? | Sim |
| Integração de sistemas | O produto conversa bem com sistemas de terceiros? | Não |
| Aceite | O usuário real aceita o que foi entregue? | Não |

</details>

<details>
<summary><strong>3. Riscos da atividade de teste</strong></summary>

O que pode dar errado na própria verificação, e enganar quem lê o resultado.

Atividade: montar a matriz de risco da atividade de teste.

Na verificação manual: roteiro que deixa de ser executado quando o prazo aperta, execução inconsistente entre pessoas sem passo a passo definido, resultado registrado sem evidência que permita reconferir, caso aprovado por quem escreveu o código que ele verifica, repetição sem atenção.

Na verificação automatizada: teste instável, oráculo copiado do próprio SUT, duplo de teste que não representa o produto implantado, massa compartilhada entre casos, conjunto de casos verde que nunca soube ficar vermelho.

Uma forma mitiga o risco da outra. A exceção é quando o risco é interno a uma das formas: aí a mitigação vem de dentro dela.

| Risco | Impacto | Prob. | Mitigação |
|---|---|---|---|
| Execução manual sem evidência reconferível (exemplo) | Médio | Alta | Passo a passo e resultado esperado no caso; print ou log anexado |
| Teste automatizado instável (exemplo) | Alto | Média | Espera por condição, nunca por tempo fixo; massa isolada por execução |
| Não dominar ferramenta de testes de API | Médio | Baixa | Os conceitos de testes de API são fáceis e não necessitam de uma curva de aprendizado alta (em relação ao escopo do projeto) |
| Não dar tempo de realizar os testes no prazo | Alto | Média | Delegar função para alguém específico e criar testes antes da data limite de entrega |
| Não dominar ferramenta de testes E2E | Médio | Baixa | Os conceitos de testes E2E com maestrosão fáceis e não necessitam de uma curva de aprendizado alta |
| Não evoluir os testes a medida que o projeto cresce | Alto | Média |  |

**Verificação**

Cada risco tem mitigação concreta.

</details>

<details>
<summary><strong>4. Casos de teste</strong></summary>

Derivados dos requisitos.

<details>
<summary><strong>4.1 Primeira rodada com IA</strong></summary>

Atividade: gerar casos de teste com IA, usando o prompt que a squad usaria hoje.
Não corrigir a saída. Guardar o prompt e o resultado.
Prompt usado
Prompt gerado no periodo passado
Saída recebida
Saída: [saída-rodada-1.md](docs/testes/ia/saída-rodada-1.md).

Três perguntas sobre a saída
Pergunta

Resposta

O que se observou na
saída

A LLM identificou lacunas?

não

A LLM preencheu todos os
cenários com plausibilidade e
inferiu comportamentos
esperados, sem apontar
ambiguidades, limites não
definidos ou critérios de
aceite difíceis de testar.

Distribuiu os casos entre
níveis?

não

Todos os casos de teste
foram elaborados e
apresentados exclusivamente
no nível de Teste de Sistema.
Nenhum caso foi classificado
ou distribuído em níveis
como Teste Unitário, Teste de
Integração ou Teste de API.

Indicou as técnicas de
modelagem?

não

<quais técnicas citou?
partição de
equivalência, valor
limite, tabela de
decisão, transição de
estados?>

</details>

<details>
<summary><strong>4.2 Segunda rodada</strong></summary>

Atividade: refazer o prompt com os quatro insumos e os três pedidos, comparar as
duas saídas e registrar o que mudou.

Insumos fornecidos no prompt
​ Requisitos: as histórias de usuário e os critérios de aceite, na íntegra
​ Formato esperado: os campos exatos dos casos de testes: id, HU, CA, título,
pré-condições, passos, resultados esperados, pós-condições
​ Escopo: o que está dentro e o que está fora
​ Níveis de teste: quais níveis o plano cobre


Prompt revisado
---
Você é um Engenheiro de Garantia de Qualidade (QA) Sênior responsável por auditar,
refatorar, reestruturar e expandir a suíte de testes da plataforma Fiscalize.
Sua missão é revisar criticamente os casos de teste existentes, identificar falhas/lacunas de
cobertura, criar os casos de teste faltantes e entregar uma documentação final em Markdown
padronizada.

🔴

###
REQUISITOS OBRIGATÓRIOS: Raciocínio de Engenharia Antes do Resultado
Antes de gerar os casos de teste e a suíte final, você DEVE obrigatoriamente construir as três
estruturas de raciocínio intermediárias abaixo:
#### 1. Matriz de Alocação (Antes de gerar/refatorar)
Defina o nível correto de teste para cada condição analisada para evitar acumular testes
apenas na camada de interface/sistema:
| Condição de Teste | Nível Responsável (Unidade, Integração, E2E/Sistema) | Justificativa |
| :--- | :--- | :--- |
#### 2. Tabela Intermediária de Derivação
Explique como cada caso foi ou será derivado a partir das regras de negócio e técnicas formais
de modelagem:
| Regra / Requisito | Técnica Aplicável (Análise do Valor Limite, Partição de Equivalência,
Tabela de Decisão, etc.) | Condições Derivadas | Casos Resultantes |
| :--- | :--- | :--- | :--- |
#### 3. Matriz de Rastreabilidade de Evidências
Associe cada caso de teste ao trecho exato do requisito/cenário que o originou. Se não houver
trecho citado no texto fornecido, marque obrigatoriamente como suposição para evitar
alucinação de regras:
| Caso | HU / CA / TS | Trecho Citado (Literal) | Suposição? (S/N) |
| :--- | :--- | :--- | :--- |
--###

📦 INSUMOS DE ENTRADA: Cenários de Referência e Suíte Atual

#### Cenários de Teste de Referência (TS):
- **TS01:** Login do Cidadão com e-mail e senha válidos
- **TS02:** Tentativa de login com credenciais inválidas
- **TS03:** Visualização da lista 'Meus Chamados' com status coloridos e protocolo


- **TS04:** Registro de chamado completo pelo assistente de 3 etapas
- **TS05:** Validação dos limites mínimos de descrição (≥ 20 caracteres) e endereço (≥ 5
caracteres)
- **TS06:** Geração automática de número de protocolo no formato SCH-AAAA-NNNN
- **TS07:** Recebimento de notificação in-app após mudança de status do chamado
- **TS08:** Visualização da timeline (histórico) do chamado pelo cidadão
- **TS09:** Login do Gestor e acesso à plataforma
#### Casos de Teste Existentes a serem Refatorados/Avaliados:
- **TC01:** Login do Cidadão com credenciais válidas (TS01)
- **TC02:** Login com senha inválida (TS02)
- **TC03:** Registro de chamado completo (TS04)
- **TC04:** Validação de limites mínimos de descrição e endereço (TS05)
- **TC05:** Geração automática do protocolo SCH-AAAA-NNNN (TS06)
- **TC06:** Login do Gestor e acesso às rotas restritas (TS09)
- **TC07 (TC14):** Anexo de fotos no chamado (TS04)
- **TC08 (TC15):** Recebimento de notificação in-app na alteração de status (TS07)
- **TC09 (TC16):** Alteração visível do status e atualização da timeline (TS08)
- **TC10:** Validação isolada de captura e associação de geolocalização/GPS (TS04)
- **TC11:** Visualização e comparação de fotos "Antes" e "Depois" na resolução do chamado
(TS08)
--###

🎯 TAREFAS DE SAÍDA EXIGIDAS

Após apresentar as 3 estruturas de raciocínio intermediárias (Matriz de Alocação, Tabela de
Derivação e Matriz de Rastreabilidade), execute as seguintes entregas:
1. **Refatoração dos Casos Existentes:**
- Padronize os títulos, nomenclaturas (ex.: adequar a numeração dos TCs caso haja
duplicidade ou divergência), pré-condições, passos numerados e resultados esperados.
- Refine a clareza e objetividade dos passos de teste.
2. **Criação de Novos Casos de Teste Necessários:**
- Identifique lacunas não cobertas (ex: cadastro de novos usuários, recuperação de senha,
filtros/busca de chamados, navegação offline/sem conexão) e crie novos casos de teste
completos para supri-las.
3. **Mapeamento Atualizado de Cobertura de Funcionalidades:**
Forneça a tabela de cobertura detalhada indicando quais TCs cobrem cada item:
- Perfil de usuário (login e cadastro)
- Registro de chamado


- Tela 'Meus Chamados' (listagem em tempo real e status coloridos)
- Upload de foto e geolocalização no chamado
- Linha do tempo com fotos "Antes" e "Depois"
- Notificações do app
- Acesso e painel do Gestor
4. **Entrega Final em Markdown (.md):**
Apresente a suíte completa (casos refatorados + novos casos) organizada com a seguinte
estrutura:
- **ID**
- **Cenário de Teste (TS)**
- **Título**
- **Pré-condições**
- **Passos** (lista numerada)
- **Resultado Esperado**
- **Resultado Atual** (Passou / Falhou / A testar)

### O que mudou entre as duas saídas

Na segunda saída, os casos de teste passaram a ser construídos considerando os requisitos, o escopo e os níveis de teste definidos no plano, deixando de concentrar todos os casos apenas no nível de sistema. Além disso, a nova abordagem passou a identificar lacunas e utilizar estruturas como a matriz de alocação, técnicas de modelagem e rastreabilidade, tornando a suíte mais fundamentada e verificável.


</details>


<details>
<summary><strong>4.3 Matriz de alocação</strong></summary>

Pedida antes da geração dos casos.
| Condição de Teste | Nível Responsável | Justificativa |
|---|---|---|
| Login do Cidadão com e-mail e senha válidos | Componente | Validação das credenciais pode ser verificada isoladamente, sem depender de outros componentes. |
| Tentativa de login com credenciais inválidas | Componente | A regra de validação das credenciais e o comportamento para dados inválidos podem ser verificados de forma isolada. |
| Visualização da lista 'Meus Chamados' com status coloridos e protocolo | Integração de componentes | Envolve a comunicação entre os componentes responsáveis pela consulta dos chamados e pela apresentação dos dados na interface. |
| Registro de chamado completo pelo assistente de 3 etapas | Sistema | Representa um fluxo completo do produto, envolvendo as etapas do registro e a entrega do chamado ao sistema. |
| Validação dos limites mínimos de descrição (≥20 caracteres) e endereço (≥5 caracteres) | Componente | As regras de limite de caracteres podem ser verificadas isoladamente. |
| Geração automática de número de protocolo no formato SCH-AAAA-NNNN | Componente | A regra de geração e validação do formato do protocolo pode ser testada isoladamente. |
| Recebimento de notificação in-app após mudança de status do chamado | Integração de componentes | É necessário verificar a comunicação entre a alteração de status e o componente responsável pela notificação. |
| Visualização da timeline (histórico) do chamado pelo cidadão | Integração de componentes | Envolve a obtenção do histórico e sua apresentação na interface do cidadão. |
| Login do Gestor e acesso à plataforma | Sistema | Verifica o fluxo de autenticação e o acesso do Gestor dentro do comportamento esperado do sistema. |

</details>

<details>
<summary><strong>4.4 Tabela intermediária de derivação</strong></summary>

Uma linha por regra do requisito.
Regra /
Requisito

Técnica
Aplicável

Condições Derivadas

Casos
Resultantes

Descrição
mínima: 20
caracteres

Análise do Valor
Limite (BVA)

19 chars (Inválido), 20
chars (Válido), 21 chars
(Válido)

TC04
(Atualizado)


Endereço
mínimo: 5
caracteres

Análise do Valor
Limite (BVA)

4 chars (Inválido), 5
chars (Válido)

TC04
(Atualizado)

Login do
Usuário

Partição de
Equivalência

Credenciais Válidas
(Sucesso); E-mail
Inválido (Erro); Senha
Inválida (Erro)

TC01, TC02

Geração de
Protocolo

Regex / Classes
de Caracteres

Formato Correto (Passa);
Formato Incorreto /
Letras onde deve ser
Número (Falha)

TC05

Status do
Chamado

Tabela de
Transição de
Estados

Aberto -> Em Análise ->
Resolvido

TC08, TC09

</details>

<details>
<summary><strong>4.5 Matriz de rastreabilidade de evidências</strong></summary>

Caso

HU / CA
/ TS

Trecho Citado (Literal)

Suposição?
(S/N)

TC01

TS01

"Login do Cidadão com e-mail e senha
válidos"

N

TC02

TS02

"Tentativa de login com credenciais
inválidas"

N


TC03

TS04

"Registro de chamado completo pelo
assistente de 3 etapas"

N

TC04

TS05

"Validação dos limites mínimos de descrição
(≥ 20 caracteres) e endereço (≥ 5
caracteres)"

N

TC05

TS06

"Geração automática de número de
protocolo no formato SCH-AAAA-NNNN"

N

TC06

TS09

"Login do Gestor e acesso à plataforma"

N

TC07

TS04

"Anexo de fotos no chamado" (Não explícito
na TS04, derivado)

S

TC08

TS07

"Recebimento de notificação in-app após
mudança de status do chamado"

N

TC09

TS08

"Visualização da timeline (histórico) do
chamado pelo cidadão"

N

TC10

TS04

"Associação de geolocalização/GPS" (Não
explícito, derivado de "Registro completo")

S

TC11

TS08

"comparação de fotos "Antes" e "Depois" na
resolução" (Derivado de Timeline)

S


TC12

TS03

"Visualização da lista 'Meus Chamados' com
status coloridos e protocolo" (Faltava TC
correspondente)

N

TC13

Novo

(Criação de Conta de Cidadão - Gap
identificado)

S

TC14

Novo

(Recuperação de Senha - Gap identificado)

S

TC15

Novo

(Filtro e Busca na lista de Chamados - Gap
identificado)

S

</details>

<details>
<summary><strong>4.6 Casos de teste</strong></summary>

Saída: [saída-rodada-2.md](docs/testes/ia/saída-rodada-2.md).

</details>

</details>

<details>
<summary><strong>5. Seleção para automação</strong></summary>

### Critério de seleção

> execuções até o retorno = Ti ÷ (Tm − Ta − Mn/F)

Onde:

- **Tm** = tempo médio de execução manual
- **Ti** = tempo para implementar a automação
- **Mn** = manutenção estimada
- **F** = frequência de execução

> **Não automatizar** significa que o teste continua sendo executado manualmente.

### Exemplo

| ID | Nível | Ti (min) | Tm (min) | Mn (s) | F (min) | Automatizar? |
|---|---|---:|---:|---:|---:|---|
| TC-07 | Integration | 8 | 90 | 4 s | 10 min | Sim |
| TC-31 | System | 12 | 240 | 25 s | 45 min | Não, permanece manual |

</details>

<details>
<summary><strong>6. Backlog de automação</strong></summary>

### Priorização

> prioridade = (Risco × Frequência) ÷ Custo

Escala de **1 a 3** para cada critério.

### Backlog

| Ordem | ID | HU | Nível | Risco | Custo | Frequência | Prioridade | Responsável | Status |
|---|---|---|---|---:|---:|---:|---:|---|---|
| 1 |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |

### Verificação

O primeiro item deve apresentar **alto risco, baixo custo e alta frequência**.

</details>
