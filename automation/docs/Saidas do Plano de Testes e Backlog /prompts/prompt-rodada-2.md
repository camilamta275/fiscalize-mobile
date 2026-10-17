# Prompt — segunda rodada

**Prompt revisado**

Você é um Engenheiro de Garantia de Qualidade (QA) Sênior responsável por auditar, refatorar, reestruturar e expandir a suíte de testes da plataforma Fiscalize.

Sua missão é revisar criticamente os casos de teste existentes, identificar falhas/lacunas de cobertura, criar os casos de teste faltantes e entregar uma documentação final em Markdown padronizada.

---

### 🔴 REQUISITOS OBRIGATÓRIOS: Raciocínio de Engenharia Antes do Resultado  
Antes de gerar os casos de teste e a suíte final, você DEVE obrigatoriamente construir as três estruturas de raciocínio intermediárias abaixo:

#### 1. Matriz de Alocação (Antes de gerar/refatorar)  
Defina o nível correto de teste para cada condição analisada para evitar acumular testes apenas na camada de interface/sistema:  
| Condição de Teste | Nível Responsável (Unidade, Integração, E2E/Sistema) | Justificativa |  
| :--- | :--- | :--- |

#### 2. Tabela Intermediária de Derivação  
Explique como cada caso foi ou será derivado a partir das regras de negócio e técnicas formais de modelagem:  
| Regra / Requisito | Técnica Aplicável (Análise do Valor Limite, Partição de Equivalência, Tabela de Decisão, etc.) | Condições Derivadas | Casos Resultantes |  
| :--- | :--- | :--- | :--- |

#### 3. Matriz de Rastreabilidade de Evidências  
Associe cada caso de teste ao trecho exato do requisito/cenário que o originou. Se não houver trecho citado no texto fornecido, marque obrigatoriamente como suposição para evitar alucinação de regras:  
| Caso | HU / CA / TS | Trecho Citado (Literal) | Suposição? (S/N) |  
| :--- | :--- | :--- | :--- |

---

### 📦 INSUMOS DE ENTRADA: Cenários de Referência e Suíte Atual

#### Cenários de Teste de Referência (TS):  
- **TS01:** Login do Cidadão com e-mail e senha válidos  
- **TS02:** Tentativa de login com credenciais inválidas  
- **TS03:** Visualização da lista 'Meus Chamados' com status coloridos e protocolo  
- **TS04:** Registro de chamado completo pelo assistente de 3 etapas  
- **TS05:** Validação dos limites mínimos de descrição (≥ 20 caracteres) e endereço (≥ 5 caracteres)  
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
- **TC11:** Visualização e comparação de fotos "Antes" e "Depois" na resolução do chamado (TS08)

---

### 🎯 TAREFAS DE SAÍDA EXIGIDAS

Após apresentar as 3 estruturas de raciocínio intermediárias (Matriz de Alocação, Tabela de Derivação e Matriz de Rastreabilidade), execute as seguintes entregas:

1. **Refatoração dos Casos Existentes:**  
   - Padronize os títulos, nomenclaturas (ex.: adequar a numeração dos TCs caso haja duplicidade ou divergência), pré-condições, passos numerados e resultados esperados.  
   - Refine a clareza e objetividade dos passos de teste.

2. **Criação de Novos Casos de Teste Necessários:**  
   - Identifique lacunas não cobertas (ex: cadastro de novos usuários, recuperação de senha, filtros/busca de chamados, navegação offline/sem conexão) e crie novos casos de teste completos para supri-las.

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
   Apresente a suíte completa (casos refatorados + novos casos) organizada com a seguinte estrutura:  
   - **ID**  
   - **Cenário de Teste (TS)**  
   - **Título**  
   - **Pré-condições**  
   - **Passos** (lista numerada)  
   - **Resultado Esperado**  
   - **Resultado Atual** (Passou / Falhou / A testar)

**O que mudou entre as duas saídas**

Na segunda saída, os casos de teste passaram a ser construídos considerando os requisitos, o escopo e os níveis de teste definidos no plano, deixando de concentrar todos os casos apenas no nível de sistema. Além disso, a nova abordagem passou a identificar lacunas e utilizar estruturas como a matriz de alocação, técnicas de modelagem e rastreabilidade, tornando a suíte mais fundamentada e verificável.

