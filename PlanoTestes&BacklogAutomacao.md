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
Grave a saída íntegra, sem correção, em um arquivo próprio versionado no repositório e
referencie aqui.
# Casos de Testes Selecionados - Plataforma Fiscalize
--### **TC01**
* **ID:** TC01
* **Cenário de Teste:** TS01
* **Título:** Login do Cidadão com credenciais válidas
* **Pré-condições:**
1. App instalado e aberto na tela de login.
2. Conta de cidadão cadastrada com e-mail e senha válidos.
3. Conexão à internet disponível.
* **Passos:**
1. Inserir e-mail válido no campo 'E-mail'.
2. Inserir senha correta.
3. Tocar em 'Entrar'.
4. Verificar carregamento da tela 'Meus Chamados'.
* **Resultado Esperado:** O usuário é autenticado com sucesso e redirecionado para a tela
'Meus Chamados' com listagem dos chamados e status coloridos. Nenhuma mensagem de erro
é exibida.
* **Resultado Atual:** Passou
---


### **TC05**
* **ID:** TC05
* **Cenário de Teste:** TS06
* **Título:** Geração de número de protocolo após submissão
* **Pré-condições:**
1. Cidadão autenticado.
2. Assistente de novo chamado preenchido corretamente até a Etapa 3.
* **Passos:**
1. Clicar em '✓ Abrir Chamado'.
2. Aguardar toast de confirmação.
3. Verificar o número de protocolo exibido.
* **Resultado Esperado:** Um número de protocolo único no formato `SCH-AAAA-NNNN` (ex.:
SCH-2026-7842) é gerado e exibido imediatamente. O chamado é persistido com esse
protocolo no store `chamadosStore` e visível na listagem de 'Meus Chamados'.
* **Resultado Atual:** Passou
--### **TC07 (TC14)**
* **ID:** TC07
* **Cenário de Teste:** TS04
* **Título:** TC14: Verificar se o usuário consegue anexar fotos
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. Assistente de novo chamado aberto na Etapa 2.
3. Arquivo de imagem válido no dispositivo.
* **Passos:**
1. Selecionar a categoria do problema na Etapa 1 e clicar em 'Próximo →'.
2. Preencher a descrição (≥ 20 caracteres) e o endereço (≥ 5 caracteres).
3. Localizar o campo/botão de anexo de imagem.
4. Fazer o upload/anexo de uma foto válida.
5. Verificar a visualização/preview da imagem anexada no formulário.
6. Clicar em 'Próximo →', revisar os dados na Etapa 3 e confirmar em '✓ Abrir Chamado'.
* **Resultado Esperado:** A foto é anexada e exibida corretamente na pré-visualização. Após a
abertura do chamado, a imagem permanece associada aos detalhes do chamado criado.
* **Resultado Atual:** A testar
--### **TC10**
* **ID:** TC10
* **Cenário de Teste:** TS04
* **Título:** Validação de captura e associação da geolocalização no chamado


* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. Permissão de localização (GPS) concedida no dispositivo/navegador.
3. Assistente de novo chamado aberto na Etapa 2.
* **Passos:**
1. Acionar a opção de obter localização automática / GPS.
2. Verificar se o sistema preenche as coordenadas ou o endereço correspondente.
3. Preencher a descrição (≥ 20 caracteres) e avançar para a Etapa 3.
4. Clicar em '✓ Abrir Chamado'.
5. Acessar os detalhes do chamado recém-criado na lista 'Meus Chamados'.
* **Resultado Esperado:** O sistema captura as coordenadas GPS corretamente, mapeia o
local no chamado e exibe o mapa/localização associada nos detalhes do chamado submetido.
* **Resultado Atual:** A testar
--### **TC11**
* **ID:** TC11
* **Cenário de Teste:** TS08
* **Título:** Visualização da linha do tempo com fotos de "Antes" e "Depois" na resolução do
chamado
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. Chamado cadastrado previamente com foto anexada pelo cidadão (Foto "Antes").
3. Chamado atualizado para o status 'Concluído' pelo gestor/equipe técnica, com anexo da
foto do serviço finalizado (Foto "Depois").
* **Passos:**
1. Acessar a tela 'Meus Chamados'.
2. Clicar no chamado com status 'Concluído'.
3. Acessar a seção de Timeline / Histórico de atendimento.
4. Verificar a exibição da foto de abertura do chamado ("Antes").
5. Verificar a exibição da foto de conclusão inserida pela equipe ("Depois").
* **Resultado Esperado:** A linha do tempo exibe visualmente a comparação entre a foto
enviada na abertura do chamado ("Antes") e a foto de resolução anexada pela equipe
("Depois") ao final do histórico de atualização.
* **Resultado Atual:** A testar
​
# Suíte de Casos de Testes - Plataforma Fiscalize
Arquivo: <docs/testes/ia/saída-rodada-1.md>


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

Grave a saída íntegra em um arquivo próprio versionado no repositório e referencie aqui.
--# Suíte de Casos de Testes Padronizada - Plataforma Fiscalize
--### **TC01**
* **ID:** TC01
* **Cenário de Teste:** TS01
* **Título:** Autenticação do Cidadão com credenciais válidas
* **Pré-condições:**
1. Aplicação aberta na tela de login (`/login`).
2. Conta de cidadão devidamente cadastrada e ativa no sistema.
3. Dispositivo com conexão estável à internet.
* **Passos:**
1. Inserir e-mail válido registrado no campo 'E-mail'.
2. Inserir a senha correspondente no campo 'Senha'.
3. Acionar o botão 'Entrar'.
4. Observar o redirecionamento da interface e o carregamento da tela inicial.
* **Resultado Esperado:** Autenticação realizada com sucesso. O usuário é direcionado para a


tela 'Meus Chamados', onde a listagem exibe seus chamados cadastrados com os respectivos
*badges* de status coloridos. Nenhuma mensagem de erro é apresentada.
* **Resultado Atual:** Passou
--### **TC02**
* **ID:** TC02
* **Cenário de Teste:** TS02
* **Título:** Tentativa de autenticação utilizando senha incorreta
* **Pré-condições:**
1. Aplicação aberta na tela de login.
2. Conta de cidadão existente no banco de dados.
* **Passos:**
1. Inserir o e-mail válido do cidadão no campo 'E-mail'.
2. Inserir uma senha incorreta no campo 'Senha'.
3. Acionar o botão 'Entrar'.
4. Observar a resposta visual do sistema.
* **Resultado Esperado:** O acesso é negado. É exibida a mensagem de erro clara: *"E-mail
ou senha incorretos"*. O usuário permanece na tela de login e nenhuma sessão é aberta.
* **Resultado Atual:** Passou
--### **TC03**
* **ID:** TC03
* **Cenário de Teste:** TS04
* **Título:** Registro completo de novo chamado pelo assistente de 3 etapas
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. Acesso liberado ao fluxo de novo chamado.
* **Passos:**
1. Clicar no botão 'Abrir Chamado' na tela principal.
2. Na **Etapa 1**, selecionar uma categoria no grid de cards (ex.: 'Iluminação Pública') e clicar
em 'Próximo →'.
3. Na **Etapa 2**, preencher 'Descrição do Problema' (≥ 20 caracteres) e 'Endereço /
Localização' (≥ 5 caracteres).
4. Clicar em 'Próximo →'.
5. Na **Etapa 3**, revisar todos os dados apresentados (categoria, descrição, endereço,
solicitante e prazo SLA).
6. Confirmar clicando em '✓ Abrir Chamado'.
* **Resultado Esperado:** O chamado é criado com sucesso. O sistema exibe mensagem de
confirmação e apresenta o protocolo gerado. O chamado passa a constar na lista 'Meus


Chamados' com o status inicial 'Aberto'.
* **Resultado Atual:** Falhou *(Necessita reteste após correção no formulário)*
--### **TC04**
* **ID:** TC04
* **Cenário de Teste:** TS05
* **Título:** Validação dos limites mínimos dos campos 'Descrição' e 'Endereço'
* **Pré-condições:**
1. Cidadão autenticado.
2. Formulário de registro de chamado aberto na Etapa 2.
* **Passos:**
1. Inserir no campo 'Descrição' um texto com menos de 20 caracteres (ex.: *"buraco grande"* 13 caracteres).
2. Inserir no campo 'Endereço' um texto com menos de 5 caracteres (ex.: *"rua"* - 3
caracteres).
3. Tentar avançar clicando em 'Próximo →'.
4. Validar o bloqueio e as mensagens de validação exibidas.
5. Corrigir o campo 'Descrição' para possuir ≥ 20 caracteres (ex.: *"Existe um grande buraco
na via pública oferecendo risco"*).
6. Corrigir o campo 'Endereço' para possuir ≥ 5 caracteres (ex.: *"Rua das Flores, 123"*).
7. Clicar novamente em 'Próximo →'.
* **Resultado Esperado:** Nas etapas 3 e 4, o sistema impede o avanço e exibe os alertas:
*"Descreva o problema com pelo menos 20 caracteres"* e *"Informe o endereço completo"*.
Após as correções (etapas 5 e 6), as validações limpam-se e o avanço para a Etapa 3
(Revisão) é permitido.
* **Resultado Atual:** Passou
--### **TC05**
* **ID:** TC05
* **Cenário de Teste:** TS06
* **Título:** Geração automática e persistência de número de protocolo no formato
SCH-AAAA-NNNN
* **Pré-condições:**
1. Cidadão autenticado.
2. Assistente de chamado totalmente preenchido e posicionado na Etapa 3 (Revisão).
* **Passos:**
1. Clicar no botão '✓ Abrir Chamado'.
2. Observar a notificação *toast* de confirmação na tela.
3. Capturar o número de protocolo gerado e exibido na confirmação.


4. Navegar até a lista 'Meus Chamados' e validar o item cadastrado.
* **Resultado Esperado:** É gerado instantaneamente um protocolo único correspondente ao
padrão regex `^SCH-\d{4}-\d{4}$` (ex.: `SCH-2026-7842`). O chamado é gravado no estado
local/banco de dados mantendo exatamente este código identificador.
* **Resultado Atual:** Passou
--### **TC06**
* **ID:** TC06
* **Cenário de Teste:** TS09
* **Título:** Autenticação de perfil Gestor e acesso às rotas administrativas restritas
* **Pré-condições:**
1. Navegador aberto na URL `/login`.
2. Conta cadastrada com privilégio de perfil 'Gestor'.
* **Passos:**
1. Preencher as credenciais de gestor válidas nos campos de e-mail e senha.
2. Clicar em 'Entrar'.
3. Verificar a rota de destino e o menu de navegação lateral (Sidebar).
4. Tentar acessar manualmente a rota exclusiva de cidadão `/meus-chamados`.
* **Resultado Esperado:** O gestor é autenticado e redirecionado para o painel administrativo
`/gestor/dashboard`. A barra lateral apresenta os itens exclusivos: *Dashboard, Fila de
Chamados, Mapa, Relatórios e Perfil*. O acesso a rotas exclusivas do cidadão é redirecionado
ou bloqueado pelo middleware de autorização.
* **Resultado Atual:** Passou
--### **TC07**
* **ID:** TC07
* **Cenário de Teste:** TS04
* **Título:** Upload e anexo de foto demonstrativa do problema no formulário de chamado
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. Assistente de novo chamado aberto na Etapa 2.
3. Arquivo de imagem válido (ex.: PNG/JPEG até 5MB) presente no dispositivo.
* **Passos:**
1. Preencher os campos de texto obrigatórios da Etapa 2.
2. Clicar no campo/botão 'Anexar Foto'.
3. Selecionar e confirmar o envio do arquivo de imagem do dispositivo.
4. Observar a exibição da caixa de pré-visualização (*preview*) no formulário.
5. Avançar para a Etapa 3 e finalizar a abertura do chamado.
* **Resultado Esperado:** A foto é carregada sem erros e exibida na pré-visualização do


formulário. Após a conclusão do registro, a foto permanece devidamente vinculada e acessível
na visualização detalhada do chamado.
* **Resultado Atual:** A testar
--### **TC08**
* **ID:** TC08
* **Cenário de Teste:** TS07
* **Título:** Recebimento de notificação in-app quando houver alteração no status do chamado
* **Pré-condições:**
1. Cidadão possui ao menos um chamado ativo no sistema (ex.: Status 'Aberto').
2. Cidadão está logado na aplicação com a sessão ativa.
3. Um gestor altera o status do referido chamado no painel administrativo (ex.: de 'Aberto' para
'Em Andamento').
* **Passos:**
1. Manter a aplicação aberta com o perfil do cidadão.
2. Acompanhar as notificações do aplicativo no momento em que o gestor efetuar a mudança
de status.
3. Clicar no alerta/notificação recebido.
* **Resultado Esperado:** Uma notificação *in-app* (ou *toast* em tempo real) é exibida ao
cidadão informando: *"Seu chamado SCH-XXXX-XXXX teve o status alterado para Em
Andamento"*. Clicar na notificação direciona o usuário para os detalhes do chamado
atualizado.
* **Resultado Atual:** A testar
--### **TC09**
* **ID:** TC09
* **Cenário de Teste:** TS08
* **Título:** Atualização visual de status e registro de eventos na linha do tempo (Timeline)
* **Pré-condições:**
1. Chamado do cidadão teve seu status alterado no sistema pela equipe técnica.
2. Cidadão autenticado na plataforma.
* **Passos:**
1. Navegar até a tela 'Meus Chamados'.
2. Localizar o chamado atualizado na lista e verificar o *badge* de status e sua cor associada.
3. Clicar no cartão do chamado para abrir a visão detalhada da Timeline.
* **Resultado Esperado:** O status na listagem exibe o novo texto e a cor correspondente (ex.:
Amarelo/Laranja para 'Em Andamento', Verde para 'Concluído'). A Timeline exibe o histórico
cronológico completo, incluindo a data/hora e o registro da alteração efetuada.
* **Resultado Atual:** A testar


--### **TC10**
* **ID:** TC10
* **Cenário de Teste:** TS04
* **Título:** Captura e vinculação isolada de geolocalização (GPS) com minimização de acesso
* **Pré-condições:**
1. Cidadão autenticado na aplicação instalada em um dispositivo móvel.
2. Permissão de acesso à localização (GPS) ainda não concedida no dispositivo.
3. Form de registro de chamado aberto na Etapa 2.
* **Passos:**
1. Clicar no botão 'Usar minha localização atual' / 'Obter GPS'.
2. Observar o prompt do sistema operacional solicitando a permissão.
3. Conceder a permissão selecionando a opção "Permitir apenas durante o uso do app".
4. Aguardar o processamento das coordenadas e verificar se o campo de endereço/mapa foi
preenchido.
5. Colocar o aplicativo em segundo plano (background) e verificar nas configurações do
sistema operacional se o app continua consumindo dados de localização.
* **Resultado Esperado:** O aplicativo obtém com precisão as coordenadas GPS, preenchendo
o formulário. O sistema operacional confirma que a permissão solicitada é restrita ao uso em
primeiro plano, garantindo que não há rastreamento de geolocalização em segundo plano
(background).
* **Resultado Atual:** A testar
--### **TC11**
* **ID:** TC11
* **Cenário de Teste:** TS08
* **Título:** Exibição e comparação visual na Timeline das fotos de 'Antes' e 'Depois' na
conclusão
* **Pré-condições:**
1. Chamado registrado originalmente com foto anexada pelo cidadão ("Antes").
2. Chamado marcado como 'Concluído' pelo gestor com a inclusão obrigatória da foto da
resolução do problema ("Depois").
* **Passos:**
1. Logar como cidadão e acessar a tela 'Meus Chamados'.
2. Selecionar o chamado com status 'Concluído'.
3. Navegar até a seção da Timeline / Histórico de Solução.
4. Comparar a exibição das imagens na interface.
* **Resultado Esperado:** A Timeline apresenta de forma clara e lado a lado (ou em blocos
cronológicos definidos) a foto inicial enviada pelo cidadão ("Antes - Problema") e a foto


anexada pela equipe de manutenção ao concluir o atendimento ("Depois - Solução").
* **Resultado Atual:** A testar
--### **TC12**
* **ID:** TC12
* **Cenário de Teste:** TS01 / Lacuna (Cadastro e LGPD)
* **Título:** Registro de novo cidadão na plataforma com validações de dados e aceite LGPD
* **Pré-condições:**
1. Aplicação aberta na tela de cadastro de usuários (`/cadastro`).
* **Passos:**
1. Preencher os campos 'Nome Completo', 'E-mail', 'CPF', 'Data de Nascimento' e 'Senha'
respeitando os formatos válidos (maior de idade).
2. Tentar clicar no botão 'Cadastrar' sem marcar as caixas de seleção de termos.
3. Validar o bloqueio da ação.
4. Marcar o checkbox explícito (opt-in): *"Li e concordo com os Termos de Uso e a Política de
Privacidade"*.
5. Clicar no botão 'Cadastrar'.
* **Resultado Esperado:** No passo 2, o botão 'Cadastrar' deve permanecer desabilitado ou o
sistema deve exibir um erro exigindo o aceite. Após marcar o checkbox (passo 4), a conta é
criada com sucesso, registrando o consentimento no banco de dados, e o usuário é
redirecionado para a tela inicial.
* **Resultado Atual:** A testar
--### **TC13**
* **ID:** TC13
* **Cenário de Teste:** TS02 / Lacuna (Recuperação de Senha)
* **Título:** Solicitação de redefinição de senha para e-mail cadastrado
* **Pré-condições:**
1. Usuário na tela de login.
2. E-mail do usuário devidamente cadastrado.
* **Passos:**
1. Clicar no link 'Esqueci minha senha'.
2. Inserir o e-mail cadastrado na tela de recuperação.
3. Clicar em 'Enviar instruções'.
* **Resultado Esperado:** O sistema exibe a mensagem de confirmação: *"Instruções para
redefinição de senha foram enviadas para o seu e-mail"*, sem expor dados sensíveis do banco.
* **Resultado Atual:** A testar
---


### **TC14**
* **ID:** TC14
* **Cenário de Teste:** TS09 / Lacuna (Fila do Gestor)
* **Título:** Filtragem e busca de chamados na fila de atendimento do Gestor
* **Pré-condições:**
1. Gestor autenticado no painel `/gestor/dashboard`.
2. Fila de chamados contendo múltiplos itens em status diversos (Aberto, Em Andamento,
Concluído).
* **Passos:**
1. Acessar o menu 'Fila de Chamados'.
2. Aplicar o filtro por Status selecionando a opção 'Aberto'.
3. Digitar um número de protocolo específico no campo de busca textual (ex.:
`SCH-2026-7842`).
* **Resultado Esperado:** A tabela de chamados é atualizada dinamicamente exibindo apenas
os chamados que atendem estritamente aos critérios combinados do filtro de status e do termo
pesquisado.
* **Resultado Atual:** A testar
--### **TC15**
* **ID:** TC15
* **Cenário de Teste:** TS04 / Lacuna (Resiliência)
* **Título:** Tratamento de falha de conexão com a internet durante a submissão do chamado
* **Pré-condições:**
1. Cidadão na Etapa 3 do assistente de abertura de chamado.
2. Conexão com a internet interrompida / simulação de modo Offline.
* **Passos:**
1. Desativar a conexão com a internet do dispositivo.
2. Clicar em '✓ Abrir Chamado'.
3. Observar o comportamento e o feedback da aplicação.
* **Resultado Esperado:** O sistema intercepta a falha de rede, previne o travamento da tela,
exibe a notificação de erro *"Sem conexão com a internet. Verifique sua rede e tente
novamente"* e preserva todos os dados digitados nos campos para envio posterior.
* **Resultado Atual:** A testar
--### **TC16**
* **ID:** TC16
* **Cenário de Teste:** Segurança da Autenticação
* **Título:** Validação de Autenticação em Duas Etapas (OTP) no primeiro acesso em novo


dispositivo
* **Pré-condições:**
1. Conta de cidadão ativa com e-mail/telefone válidos cadastrados.
2. Login sendo realizado a partir de um dispositivo/navegador não reconhecido (novo *device
fingerprint* ou cache limpo).
* **Passos:**
1. Inserir e-mail e senha corretos na tela de login e clicar em 'Entrar'.
2. Observar o redirecionamento para a tela de verificação de segurança (2FA).
3. Acessar a caixa de e-mail (ou SMS) e capturar o código OTP numérico temporário enviado
pelo sistema.
4. Inserir o código OTP no campo de validação da plataforma.
5. Clicar em 'Verificar e Entrar'.
* **Resultado Esperado:** O sistema intercepta o acesso de um novo dispositivo e não libera a
sessão apenas com a senha. O acesso só é concluído e o token JWT gerado após a validação
bem-sucedida do código OTP enviado ao canal de contato do usuário.
* **Resultado Atual:** A testar
--### **TC17**
* **ID:** TC17
* **Cenário de Teste:** LGPD e Direitos do Titular
* **Título:** Solicitação de exclusão definitiva de conta e anonimização de dados
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. O cidadão possui chamados registrados em seu histórico.
* **Passos:**
1. Acessar a tela de 'Perfil' ou 'Configurações de Privacidade'.
2. Navegar até a seção 'Portal de Direitos do Titular'.
3. Clicar no botão 'Excluir minha conta' / 'Solicitar Direito ao Esquecimento'.
4. Confirmar a ação no modal de advertência (inserindo a senha para validação, se solicitado).
* **Resultado Esperado:** O sistema encerra a sessão imediatamente, exibe uma mensagem
de confirmação de que os dados pessoais estão sendo removidos. No banco de dados, os
dados cadastrais (Nome, CPF, E-mail, Telefone) são apagados, e os chamados vinculados ao
usuário passam a constar como "Usuário Anonimizado", mantendo apenas as estatísticas
urbanas sem vínculo pessoal.
* **Resultado Atual:** A testar
--### **TC18**
* **ID:** TC18
* **Cenário de Teste:** LGPD e Direitos do Titular


* **Título:** Exportação do histórico de dados pessoais e ocorrências em formato estruturado
* **Pré-condições:**
1. Cidadão autenticado na plataforma.
2. O cidadão possui dados e chamados preenchidos.
* **Passos:**
1. Acessar a tela de 'Perfil' ou 'Configurações de Privacidade'.
2. Navegar até a seção 'Portal de Direitos do Titular'.
3. Clicar no botão 'Exportar meus dados' (Portabilidade).
* **Resultado Esperado:** O sistema compila as informações e inicia imediatamente (ou envia
link por e-mail) o download de um arquivo em formato estruturado comum (ex: JSON ou CSV)
contendo os dados cadastrais do cidadão, registros de aceite de termos e histórico completo de
denúncias/chamados abertos.
* **Resultado Atual:** A testar
--### **TC19**
* **ID:** TC19
* **Cenário de Teste:** Cadastro e Tratamento de Dados Sensíveis
* **Título:** Bloqueio de registro de conta para indivíduos menores de 18 anos
* **Pré-condições:**
1. Aplicação aberta na tela de cadastro de usuários (`/cadastro`).
* **Passos:**
1. Preencher os campos 'Nome Completo', 'E-mail', 'CPF' e 'Senha' com formatos válidos.
2. Inserir no campo 'Data de Nascimento' uma data que resulte em idade inferior a 18 anos na
data atual.
3. Tentar finalizar o cadastro.
* **Resultado Esperado:** O botão 'Cadastrar' torna-se imediatamente indisponível
(desabilitado/cinza). O sistema exibe um aviso claro em tela informando: *"A conta não pode
ser criada. É necessário ser maior de 18 anos para utilizar a plataforma"*. Nenhum dado é
enviado ou salvo no banco de dados.
* **Resultado Atual:** A testar
Arquivo: <docs/testes/ia/saida-rodada-2.md>

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
