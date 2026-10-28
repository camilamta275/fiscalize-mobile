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
