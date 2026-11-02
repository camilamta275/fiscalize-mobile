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

---

## 1. Escopo

*O que a atividade de teste se compromete a verificar, e o que ela declaradamente não verifica.*

Entra no escopo: os fluxos principais do produto ponta a ponta, as regras que protegem esses fluxos e o contrato que os sustenta, incluindo o comportamento do produto na fronteira quando uma dependência externa falha.

Fica fora do escopo: o comportamento de sistemas externos fora do controle da squad, os recursos físicos do dispositivo e o que custa mais do que devolve no prazo do projeto.

| Item | Dentro do escopo? | Motivo |
| :---- | :---- | :---- |
| Registro de demanda com categoria e descrição *(exemplo)* | Sim | Fluxo principal do produto; regra de negócio concentrada aqui |
| Classificação automática da imagem por serviço externo *(exemplo)* | Não | Comportamento de terceiro, não determinístico e fora do controle da squad |
| Perfil de usuário (login e cadastro) | Sim | Controle de usuários e acessos |
| Registro de chamado |  Sim | Funcionalidade principal para operação do sistema |
| Tela 'Meus Chamados' com listagem em tempo real e status coloridos | Sim | Visibilidade para o usuário sobre o andamento do chamado |
| Upload de foto e geolocalização no chamado | Não | Manual (tem que entrar pra Renan Mobile) |
| Linha do tempo com fotos antes/depois | Não | Funcionalidade para pós mvp |
| Notificações do app | Sim |  |
| Concluir chamados | Sim |  |
| Fila de chamados com filtros por status, prioridade e busca | Sim |  |
| Autenticação de senha com regras | Sim   |  |

**Verificação**

- [ ] Todo fluxo principal do produto aparece como `Sim`.  
- [ ] Toda linha `Não` tem motivo.

---

## 2. Níveis de teste

*Em que altura do sistema cada condição é verificada, e quanto essa escolha custa.*

> **Atividade:** declarar no plano os níveis em que ele atua, com uma frase de justificativa por nível incluído e por nível excluído.

| Nível | O que responde | Dentro do plano? |
| :---- | :---- | :---- |
| Componente | A unidade isolada faz o que promete? | `Sim` |
| Integração de componentes | As partes conversam entre si corretamente? | `Sim` |
| Sistema | O sistema inteiro entrega o comportamento esperado? | `Sim` |
| Integração de sistemas | O produto conversa bem com sistemas de terceiros? | `Não` |
| Aceite | O usuário real aceita o que foi entregue? | `Não` |

---

## 3. Riscos da atividade de teste

*O que pode dar errado na própria verificação, e enganar quem lê o resultado.*

> **Atividade:** montar a matriz de risco da atividade de teste.

*Na verificação manual: roteiro que deixa de ser executado quando o prazo aperta, execução inconsistente entre pessoas sem passo a passo definido, resultado registrado sem evidência que permita reconferir, caso aprovado por quem escreveu o código que ele verifica, repetição sem atenção.*

*Na verificação automatizada: teste instável, oráculo copiado do próprio SUT, duplo de teste que não representa o produto implantado, massa compartilhada entre casos, conjunto de casos verde que nunca soube ficar vermelho.*

*Uma forma mitiga o risco da outra. A exceção é quando o risco é interno a uma das formas: aí a mitigação vem de dentro dela.*

| Risco | Impacto | Prob. | Mitigação |
| :---- | :---- | :---- | :---- |
| Execução manual sem evidência reconferível *(exemplo)* | Médio | Alta | Passo a passo e resultado esperado no caso; print ou log anexado |
| Teste automatizado instável *(exemplo)* | Alto | Média | Espera por condição, nunca por tempo fixo; massa isolada por execução |
| Não dominar ferramenta de testes de API | Médio | Baixa | Os conceitos de testes de API são fáceis e não necessitam de uma curva de aprendizado alta (em relação ao escopo do projeto) |
| Não dar tempo de realizar os testes no prazo | Alto | Média | Delegar função para alguém específico e criar testes antes da data limite de entrega |
| Não dominar ferramenta de testes E2E | Médio | Baixa | Os conceitos de testes E2E com maestrosão fáceis e não necessitam de uma curva de aprendizado alta  |
| Não evoluir os testes a medida que o projeto cresce | Alto | Média |  |

**Verificação**

- [x] Cada risco tem mitigação concreta.

---

## 4. Casos de teste

*Derivados dos requisitos.*

### 4.1 Primeira rodada com IA

> **Atividade:** gerar casos de teste com IA, usando o prompt que a squad usaria hoje. Não corrigir a saída. Guardar o prompt e o resultado.

**Prompt usado**

[Prompt da primeira rodada](docs/Saidas%20do%20Plano%20de%20Testes%20e%20Backlog%20/prompts/prompt-rodada-1.md)

**Saída recebida**

[Saída da primeira rodada](docs/Saidas%20do%20Plano%20de%20Testes%20e%20Backlog%20/Casos%20de%20teste%20IA/sa%C3%ADda-rodada-1.md)

**Três perguntas sobre a saída**

| Pergunta | Resposta | O que se observou na saída |
| :---- | :---- | :---- |
| A LLM identificou lacunas? | `não` | A LLM preencheu todos os cenários com plausibilidade e inferiu comportamentos esperados, sem apontar ambiguidades, limites não definidos ou critérios de aceite difíceis de testar. |
| Distribuiu os casos entre níveis? | `não` | Todos os casos de teste foram elaborados e apresentados exclusivamente no nível de Teste de Sistema. Nenhum caso foi classificado ou distribuído em níveis como Teste Unitário, Teste de Integração ou Teste de API. |
| Indicou as técnicas de modelagem? | `não` | `<quais técnicas citou? partição de equivalência, valor limite, tabela de decisão, transição de estados?>` |

### 4.2 Segunda rodada

> **Atividade:** refazer o prompt com os quatro insumos e os três pedidos, comparar as duas saídas e registrar o que mudou.

**Insumos fornecidos no prompt**

- [x] **Requisitos:** as histórias de usuário e os critérios de aceite, na íntegra  
- [x] **Formato esperado:** os campos exatos dos casos de testes: id, HU, CA, título, pré-condições, passos, resultados esperados, pós-condições  
- [x] **Escopo:** o que está dentro e o que está fora  
- [x] **Níveis de teste:** quais níveis o plano cobre

**Prompt revisado**

[Prompt da segunda rodada](docs/Saidas%20do%20Plano%20de%20Testes%20e%20Backlog%20/prompts/prompt-rodada-2.md)

### 4.3 Matriz de alocação

*Pedida antes da geração dos casos.*

| Condição de teste | Nível responsável | Justificativa |
| :---- | :---- | :---- |
| Login do Cidadão com e-mail e senha válidos | Componente | Validação das credenciais pode ser verificada isoladamente, sem depender de outros componentes. |
| Tentativa de login com credenciais inválidas | Componente | A regra de validação das credenciais e o comportamento para dados inválidos podem ser verificados de forma isolada. |
| Visualização da lista 'Meus Chamados' com status coloridos e protocolo | Integração de componentes | Envolve a comunicação entre os componentes responsáveis pela consulta dos chamados e pela apresentação dos dados na interface. |
| Registro de chamado completo pelo assistente de 3 etapas | Sistema | Representa um fluxo completo do produto, envolvendo as etapas do registro e a entrega do chamado ao sistema. |
| Validação dos limites mínimos de descrição (≥20 caracteres) e endereço (≥5 caracteres) | Componente | As regras de limite de caracteres podem ser verificadas isoladamente. |
| Login do Gestor e acesso à plataforma | Sistema | Verifica o fluxo de autenticação e o acesso do Gestor dentro do comportamento esperado do sistema. |

### 4.4 Tabela intermediária de derivação

*Uma linha por regra do requisito.*

| *Regra / Requisito* | *Técnica Aplicável* | *Condições Derivadas* | *Casos Resultantes* |
| :---- | :---- | :---- | :---- |
| ***Descrição mínima:** 20 caracteres* | *Análise do Valor Limite (BVA)* | *19 chars (Inválido), 20 chars (Válido), 21 chars (Válido)* | *TC04 (Atualizado)* |
| ***Endereço mínimo:** 5 caracteres* | *Análise do Valor Limite (BVA)* | *4 chars (Inválido), 5 chars (Válido)* | *TC04 (Atualizado)* |
| ***Login do Usuário*** | *Partição de Equivalência* | *Credenciais Válidas (Sucesso); E-mail Inválido (Erro); Senha Inválida (Erro)* | *TC01, TC02* |
| ***Geração de Protocolo*** | *Regex / Classes de Caracteres* | *Formato Correto (Passa); Formato Incorreto / Letras onde deve ser Número (Falha)* | *TC05* |
| ***Status do Chamado*** | *Tabela de Transição de Estados* | *Aberto -> Em Análise -> Resolvido* | *TC08, TC09* |

### 4.5 Matriz de rastreabilidade de evidências

| *Caso* | *HU / CA / TS* | *Trecho Citado (Literal)* | *Suposição? (S/N)* |
| :---- | :---- | :---- | :---- |
| *TC01* | *TS01* | *"Login do Cidadão com e-mail e senha válidos"* | *N* |
| *TC02* | *TS02* | *"Tentativa de login com credenciais inválidas"* | *N* |
| *TC03* | *TS04* | *"Registro de chamado completo pelo assistente de 3 etapas"* | *N* |
| *TC04* | *TS05* | *"Validação dos limites mínimos de descrição (≥ 20 caracteres) e endereço (≥ 5 caracteres)"* | *N* |
| *TC05* | *TS06* | *"Geração automática de número de protocolo no formato SCH-AAAA-NNNN"* | *N* |
| *TC06* | *TS09* | *"Login do Gestor e acesso à plataforma"* | *N* |
| *TC07* | *TS04* | *"Anexo de fotos no chamado" (Não explícito na TS04, derivado)* | *S* |
| *TC08* | *TS07* | *"Recebimento de notificação in-app após mudança de status do chamado"* | *N* |
| *TC09* | *TS08* | *"Visualização da timeline (histórico) do chamado pelo cidadão"* | *N* |
| *TC10* | *TS04* | *"Associação de geolocalização/GPS" (Não explícito, derivado de "Registro completo")* | *S* |
| *TC11* | *TS08* | *"comparação de fotos "Antes" e "Depois" na resolução" (Derivado de Timeline)* | *S* |
| ***TC12*** | ***TS03*** | *"Visualização da lista 'Meus Chamados' com status coloridos e protocolo" (Faltava TC correspondente)* | ***N*** |
| ***TC13*** | ***Novo*** | *(Criação de Conta de Cidadão - Gap identificado)* | ***S*** |
| ***TC14*** | ***Novo*** | *(Recuperação de Senha - Gap identificado)* | ***S*** |
| ***TC15*** | ***Novo*** | *(Filtro e Busca na lista de Chamados - Gap identificado)* | ***S*** |

### 4.6 Casos de teste

[Saída da segunda rodada](docs/Saidas%20do%20Plano%20de%20Testes%20e%20Backlog%20/Casos%20de%20teste%20IA/sa%C3%ADda-rodada-2.md)

---

## 5. Seleção para automação

*Cinco medidas por caso, e só então a escolha entre execução manual e automatizada.*  
execuções até o retorno  =  Ti ÷ (Tm − Ta − Mn/F)

- **Tm** é o tempo de uma execução manual honesta, cronometrada uma vez, não estimada de cabeça.  
- **Ti** é o investimento único; **Mn** é o que a automação consome por mês só para continuar funcionando.  
- **F** é a frequência realista no horizonte do projeto, não a frequência ideal.  
- "Não automatizar" nunca significa "não verificar": o caso continua no plano, com execução manual e responsável.

| ID | Nivel | Tm manual/exec | Ti implementar | Ta auto/exec | Mn manut./mês | F exec./mês | Automatizar? |
| :---- | :---- | :---- | :---- | :---- | :---- | ----- | :---- |
| TC01 | Sistema | 2 min | 45 min | 5 s | 5 min | 20 | Sim (retorno em 27 exec.) |
| TC02 | Sistema | 1,5 min | 30 min | 4 s | 3 min | 20 | Sim (retorno em 24 exec.) |
| TC03 | Sistema | 4 min | 90 min | 12 s | 10 min | 15 | Sim (retorno em 29 exec.) |
| TC04 | Integração | 3 min | 40 min | 3 s | 4 min | 15 | Sim (retorno em 15 exec.) |
| TC05 | Integração | 3 min | 45 min | 5 s | 4 min | 15 | Sim (retorno em 17 exec.) |
| TC06 | Sistema | 3 min | 60 min | 8 s | 6 min | 10 | Sim (retorno em 27 exec.) |
| TC07 | Sistema | 4 min | 90 min | 15 s | 12 min | 8 | Não, permanece manual (40 exec. > 24) |
| TC08 | Sistema | 6 min | 180 min | 30 s | 30 min | 4 | Não, permanece manual (não se paga) |
| TC09 | Sistema | 4 min | 90 min | 12 s | 10 min | 8 | Não, permanece manual (36 exec. > 24) |
| TC10 | Sistema | 6 min | 300 min | 60 s | 45 min | 2 | Não, permanece manual (não se paga) |
| TC11 | Sistema | 5 min | 150 min | 20 s | 20 min | 4 | Não, permanece manual (não se paga) |
| TC12 | Sistema | 4 min | 75 min | 10 s | 8 min | 12 | Sim (retorno em 24 exec.) |
| TC13 | Integração | 3 min | 60 min | 6 s | 6 min | 8 | Não, permanece manual (28 exec. > 24) |
| TC14 | Integração | 4 min | 60 min | 8 s | 6 min | 10 | Sim (retorno em 19 exec.) |
| TC15 | Sistema | 4 min | 90 min | 10 s | 10 min | 6 | Não, permanece manual (42 exec. > 18) |
| TC16 | Sistema | 5 min | 180 min | 30 s | 25 min | 6 | Não, permanece manual (540 exec.) |
| TC17 | Integração | 8 min | 120 min | 10 s | 10 min | 4 | Não, permanece manual (23 exec. > 12) |
| TC18 | Integração | 6 min | 60 min | 8 s | 6 min | 6 | Sim (retorno em 13 exec.) |
| TC19 | Unidade | 2 min | 20 min | 1 s | 2 min | 12 | Sim (retorno em 11 exec.) |

---

## 6. Backlog de automação.

*Entre os casos selecionados para automação, qual vem primeiro.*

> **Atividade:** ordenar o backlog de automação.

**Três fatores a considerar**

- **Risco:** o que acontece se este comportamento quebrar em produção e ninguém perceber?  
- **Custo:** quanto custa implementar e manter este caso automatizado?  
- **Frequência:** quantas vezes este caso será executado no horizonte do projeto?

prioridade  =  (Risco × Frequência) ÷ Custo

*Escalas de 1 a 3. Heurística de ordenação.*

*Uma linha por caso selecionado para automação.*

| Ordem | ID do caso | HU | Nível | Risco | Custo | Frequência | Prioridade | Responsável | Status |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | `TC1` | `TS01` | `SISTEMA` | `3` | `1` | `3` | `9,00`  | `QAs` | `BACKLOG` |
| 2 | `TC2` | `TS02` | `SISTEMA` | `3` | `1` | `3` | `9,00`  | `QAs` | `BACKLOG` |
| 3 | `TC4` | `TS05` | `COMPONENTE` | `2` | `1` | `3` | `6,00`  | `QAs` | `BACKLOG` |
| 4 | `TC5` | `TS06` | `SISTEMA` | `3` | `1` | `2` | `6,00` | `QAs` | `BACKLOG` |
| 5 | `TC3` | `TS04` | `SISTEMA` | `3` | `2` | `3` | `4,50` | `QAs` | `BACKLOG` |
| 6 | `TC6` | `TS09` | `SISTEMA` | `3` | `2` | `2` | `3,00` | `QAs` | `BACKLOG` |
| 7 | `TC8` | `TS09` | `SISTEMA` | `2` | `2` | `2` | `2,00` | `QAs` | `BACKLOG` |
| 8 | `TC9` | `TS08` | `SISTEMA` | `2` | `2` | `2` | `2,00` | `QAs` | `BACKLOG` |

**Verificação**

- [ ] O primeiro item é de risco alto, custo baixo e frequência alta.

O backlog foi ordenado de acordo com a fórmula **(Risco × Frequência) ÷ Custo**, considerando somente os casos previamente selecionados para automação. Em caso de empate, os casos permanecem agrupados na mesma faixa de prioridade, podendo ser posteriormente desempateados pelo custo de implementação ou pela ordem definida pela equipe. 