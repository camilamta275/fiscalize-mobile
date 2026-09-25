# Suíte de Casos de Testes Padronizada - Plataforma Fiscalize

---

### **TC01**
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
* **Resultado Esperado:** Autenticação realizada com sucesso. O usuário é direcionado para a tela 'Meus Chamados', onde a listagem exibe seus chamados cadastrados com os respectivos *badges* de status coloridos. Nenhuma mensagem de erro é apresentada.  
* **Resultado Atual:** A testar  

---

### **TC02**
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
* **Resultado Esperado:** O acesso é negado. É exibida a mensagem de erro clara: *"E-mail ou senha incorretos"*. O usuário permanece na tela de login e nenhuma sessão é aberta.  
* **Resultado Atual:** A testar  

---

### **TC03**
* **ID:** TC03  
* **Cenário de Teste:** TS04  
* **Título:** Registro completo de novo chamado pelo assistente de 3 etapas  
* **Pré-condições:**  
  1. Cidadão autenticado na plataforma.  
  2. Acesso liberado ao fluxo de novo chamado.  
* **Passos:**  
  1. Clicar no botão 'Abrir Chamado' na tela principal.  
  2. Na **Etapa 1**, selecionar uma categoria no grid de cards (ex.: 'Iluminação Pública') e clicar em 'Próximo →'.  
  3. Na **Etapa 2**, preencher 'Descrição do Problema' (≥ 20 caracteres) e 'Endereço / Localização' (≥ 5 caracteres).  
  4. Clicar em 'Próximo →'.  
  5. Na **Etapa 3**, revisar todos os dados apresentados (categoria, descrição, endereço, solicitante e prazo SLA).  
  6. Confirmar clicando em '✓ Abrir Chamado'.  
* **Resultado Esperado:** O chamado é criado com sucesso. O sistema exibe mensagem de confirmação e apresenta o protocolo gerado. O chamado passa a constar na lista 'Meus Chamados' com o status inicial 'Aberto'.  
* **Resultado Atual:** Falhou *(Necessita reteste após correção no formulário)*  

---

### **TC04**
* **ID:** TC04  
* **Cenário de Teste:** TS05  
* **Título:** Validação dos limites mínimos dos campos 'Descrição' e 'Endereço'  
* **Pré-condições:**  
  1. Cidadão autenticado.  
  2. Formulário de registro de chamado aberto na Etapa 2.  
* **Passos:**  
  1. Inserir no campo 'Descrição' um texto com menos de 20 caracteres (ex.: *"buraco grande"* - 13 caracteres).  
  2. Inserir no campo 'Endereço' um texto com menos de 5 caracteres (ex.: *"rua"* - 3 caracteres).  
  3. Tentar avançar clicando em 'Próximo →'.  
  4. Validar o bloqueio e as mensagens de validação exibidas.  
  5. Corrigir o campo 'Descrição' para possuir ≥ 20 caracteres (ex.: *"Existe um grande buraco na via pública oferecendo risco"*).  
  6. Corrigir o campo 'Endereço' para possuir ≥ 5 caracteres (ex.: *"Rua das Flores, 123"*).  
  7. Clicar novamente em 'Próximo →'.  
* **Resultado Esperado:** Nas etapas 3 e 4, o sistema impede o avanço e exibe os alertas: *"Descreva o problema com pelo menos 20 caracteres"* e *"Informe o endereço completo"*. Após as correções (etapas 5 e 6), as validações limpam-se e o avanço para a Etapa 3 (Revisão) é permitido.  
* **Resultado Atual:** A testar  

---

### **TC05**
* **ID:** TC05  
* **Cenário de Teste:** TS06  
* **Título:** Geração automática e persistência de número de protocolo no formato SCH-AAAA-NNNN  
* **Pré-condições:**  
  1. Cidadão autenticado.  
  2. Assistente de chamado totalmente preenchido e posicionado na Etapa 3 (Revisão).  
* **Passos:**  
  1. Clicar no botão '✓ Abrir Chamado'.  
  2. Observar a notificação *toast* de confirmação na tela.  
  3. Capturar o número de protocolo gerado e exibido na confirmação.  
  4. Navegar até a lista 'Meus Chamados' e validar o item cadastrado.  
* **Resultado Esperado:** É gerado instantaneamente um protocolo único correspondente ao padrão regex `^SCH-\d{4}-\d{4}$` (ex.: `SCH-2026-7842`). O chamado é gravado no estado local/banco de dados mantendo exatamente este código identificador.  
* **Resultado Atual:** A testar  

---

### **TC06**
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
* **Resultado Esperado:** O gestor é autenticado e redirecionado para o painel administrativo `/gestor/dashboard`. A barra lateral apresenta os itens exclusivos: *Dashboard, Fila de Chamados, Mapa, Relatórios e Perfil*. O acesso a rotas exclusivas do cidadão é redirecionado ou bloqueado pelo middleware de autorização.  
* **Resultado Atual:** A testar  

---

### **TC07**
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
* **Resultado Esperado:** A foto é carregada sem erros e exibida na pré-visualização do formulário. Após a conclusão do registro, a foto permanece devidamente vinculada e acessível na visualização detalhada do chamado.  
* **Resultado Atual:** A testar  

---

### **TC08**
* **ID:** TC08  
* **Cenário de Teste:** TS07  
* **Título:** Recebimento de notificação in-app quando houver alteração no status do chamado  
* **Pré-condições:**  
  1. Cidadão possui ao menos um chamado ativo no sistema (ex.: Status 'Aberto').  
  2. Cidadão está logado na aplicação com a sessão ativa.  
  3. Um gestor altera o status do referido chamado no painel administrativo (ex.: de 'Aberto' para 'Em Andamento').  
* **Passos:**  
  1. Manter a aplicação aberta com o perfil do cidadão.  
  2. Acompanhar as notificações do aplicativo no momento em que o gestor efetuar a mudança de status.  
  3. Clicar no alerta/notificação recebido.  
* **Resultado Esperado:** Uma notificação *in-app* (ou *toast* em tempo real) é exibida ao cidadão informando: *"Seu chamado SCH-XXXX-XXXX teve o status alterado para Em Andamento"*. Clicar na notificação direciona o usuário para os detalhes do chamado atualizado.  
* **Resultado Atual:** A testar  

---

### **TC09**
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
* **Resultado Esperado:** O status na listagem exibe o novo texto e a cor correspondente (ex.: Amarelo/Laranja para 'Em Andamento', Verde para 'Concluído'). A Timeline exibe o histórico cronológico completo, incluindo a data/hora e o registro da alteração efetuada.  
* **Resultado Atual:** A testar  

---

### **TC10**
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
  4. Aguardar o processamento das coordenadas e verificar se o campo de endereço/mapa foi preenchido.
  5. Colocar o aplicativo em segundo plano (background) e verificar nas configurações do sistema operacional se o app continua consumindo dados de localização.
* **Resultado Esperado:** O aplicativo obtém com precisão as coordenadas GPS, preenchendo o formulário. O sistema operacional confirma que a permissão solicitada é restrita ao uso em primeiro plano, garantindo que não há rastreamento de geolocalização em segundo plano (background).  
* **Resultado Atual:** A testar  

---

### **TC11**
* **ID:** TC11  
* **Cenário de Teste:** TS08  
* **Título:** Exibição e comparação visual na Timeline das fotos de 'Antes' e 'Depois' na conclusão  
* **Pré-condições:**  
  1. Chamado registrado originalmente com foto anexada pelo cidadão ("Antes").  
  2. Chamado marcado como 'Concluído' pelo gestor com a inclusão obrigatória da foto da resolução do problema ("Depois").  
* **Passos:**  
  1. Logar como cidadão e acessar a tela 'Meus Chamados'.  
  2. Selecionar o chamado com status 'Concluído'.  
  3. Navegar até a seção da Timeline / Histórico de Solução.  
  4. Comparar a exibição das imagens na interface.  
* **Resultado Esperado:** A Timeline apresenta de forma clara e lado a lado (ou em blocos cronológicos definidos) a foto inicial enviada pelo cidadão ("Antes - Problema") e a foto anexada pela equipe de manutenção ao concluir o atendimento ("Depois - Solução").  
* **Resultado Atual:** A testar  

---

### **TC12**
* **ID:** TC12  
* **Cenário de Teste:** TS01 / Lacuna (Cadastro e LGPD)  
* **Título:** Registro de novo cidadão na plataforma com validações de dados e aceite LGPD  
* **Pré-condições:**  
  1. Aplicação aberta na tela de cadastro de usuários (`/cadastro`).  
* **Passos:**  
  1. Preencher os campos 'Nome Completo', 'E-mail', 'CPF', 'Data de Nascimento' e 'Senha' respeitando os formatos válidos (maior de idade).  
  2. Tentar clicar no botão 'Cadastrar' sem marcar as caixas de seleção de termos.
  3. Validar o bloqueio da ação.
  4. Marcar o checkbox explícito (opt-in): *"Li e concordo com os Termos de Uso e a Política de Privacidade"*.
  5. Clicar no botão 'Cadastrar'.  
* **Resultado Esperado:** No passo 2, o botão 'Cadastrar' deve permanecer desabilitado ou o sistema deve exibir um erro exigindo o aceite. Após marcar o checkbox (passo 4), a conta é criada com sucesso, registrando o consentimento no banco de dados, e o usuário é redirecionado para a tela inicial.  
* **Resultado Atual:** A testar  

---

### **TC13**
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
* **Resultado Esperado:** O sistema exibe a mensagem de confirmação: *"Instruções para redefinição de senha foram enviadas para o seu e-mail"*, sem expor dados sensíveis do banco.  
* **Resultado Atual:** A testar  

---

### **TC14**
* **ID:** TC14  
* **Cenário de Teste:** TS09 / Lacuna (Fila do Gestor)  
* **Título:** Filtragem e busca de chamados na fila de atendimento do Gestor  
* **Pré-condições:**  
  1. Gestor autenticado no painel `/gestor/dashboard`.  
  2. Fila de chamados contendo múltiplos itens em status diversos (Aberto, Em Andamento, Concluído).  
* **Passos:**  
  1. Acessar o menu 'Fila de Chamados'.  
  2. Aplicar o filtro por Status selecionando a opção 'Aberto'.  
  3. Digitar um número de protocolo específico no campo de busca textual (ex.: `SCH-2026-7842`).  
* **Resultado Esperado:** A tabela de chamados é atualizada dinamicamente exibindo apenas os chamados que atendem estritamente aos critérios combinados do filtro de status e do termo pesquisado.  
* **Resultado Atual:** A testar  

---

### **TC15**
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
* **Resultado Esperado:** O sistema intercepta a falha de rede, previne o travamento da tela, exibe a notificação de erro *"Sem conexão com a internet. Verifique sua rede e tente novamente"* e preserva todos os dados digitados nos campos para envio posterior.  
* **Resultado Atual:** A testar

---

### **TC16**
* **ID:** TC16  
* **Cenário de Teste:** Segurança da Autenticação
* **Título:** Validação de Autenticação em Duas Etapas (OTP) no primeiro acesso em novo dispositivo  
* **Pré-condições:**  
  1. Conta de cidadão ativa com e-mail/telefone válidos cadastrados.  
  2. Login sendo realizado a partir de um dispositivo/navegador não reconhecido (novo *device fingerprint* ou cache limpo).  
* **Passos:**  
  1. Inserir e-mail e senha corretos na tela de login e clicar em 'Entrar'.  
  2. Observar o redirecionamento para a tela de verificação de segurança (2FA).  
  3. Acessar a caixa de e-mail (ou SMS) e capturar o código OTP numérico temporário enviado pelo sistema.  
  4. Inserir o código OTP no campo de validação da plataforma.  
  5. Clicar em 'Verificar e Entrar'.  
* **Resultado Esperado:** O sistema intercepta o acesso de um novo dispositivo e não libera a sessão apenas com a senha. O acesso só é concluído e o token JWT gerado após a validação bem-sucedida do código OTP enviado ao canal de contato do usuário.  
* **Resultado Atual:** A testar  

---

### **TC17**
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
* **Resultado Esperado:** O sistema encerra a sessão imediatamente, exibe uma mensagem de confirmação de que os dados pessoais estão sendo removidos. No banco de dados, os dados cadastrais (Nome, CPF, E-mail, Telefone) são apagados, e os chamados vinculados ao usuário passam a constar como "Usuário Anonimizado", mantendo apenas as estatísticas urbanas sem vínculo pessoal.  
* **Resultado Atual:** A testar  

---

### **TC18**
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
* **Resultado Esperado:** O sistema compila as informações e inicia imediatamente (ou envia link por e-mail) o download de um arquivo em formato estruturado comum (ex: JSON ou CSV) contendo os dados cadastrais do cidadão, registros de aceite de termos e histórico completo de denúncias/chamados abertos.  
* **Resultado Atual:** A testar  

---

### **TC19**
* **ID:** TC19  
* **Cenário de Teste:** Cadastro e Tratamento de Dados Sensíveis
* **Título:** Bloqueio de registro de conta para indivíduos menores de 18 anos  
* **Pré-condições:**  
  1. Aplicação aberta na tela de cadastro de usuários (`/cadastro`).  
* **Passos:**  
  1. Preencher os campos 'Nome Completo', 'E-mail', 'CPF' e 'Senha' com formatos válidos.  
  2. Inserir no campo 'Data de Nascimento' uma data que resulte em idade inferior a 18 anos na data atual.  
  3. Tentar finalizar o cadastro.  
* **Resultado Esperado:** O botão 'Cadastrar' torna-se imediatamente indisponível (desabilitado/cinza). O sistema exibe um aviso claro em tela informando: *"A conta não pode ser criada. É necessário ser maior de 18 anos para utilizar a plataforma"*. Nenhum dado é enviado ou salvo no banco de dados.  
* **Resultado Atual:** A testar