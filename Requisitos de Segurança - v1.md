**Grupo:**

* ALESSANDRA BARBOSA DE SANTANA  
* ANA SOFIA DA SILVA MOURA  
* CAMILA MARIA TEIXEIRA ALCÂNTARA  
* LUCAS RODRIGUES DA SILVA JUNIOR  
* MARIA GABRIELA DAMÁSIO BEZERRA  
* RAPHAEL RENNAN SOARES DE MIRANDA  
* RAYANE CAVALCANTI DA SILVA  
* RENÉ MELO DE LUCENA  
* SAMUEL SILVA ARAÚJO DE BRITO  
* VICTOR FERREIRA MARQUES

**1\. Gestão de Autenticação e Senhas**

* **RNF-SEC-01 (Armazenamento Seguro de Tokens):** O aplicativo mobile deve armazenar os JWTs de acesso exclusivamente em armazenamento nativo seguro (react-native-keychain ou expo-secure-store), sendo proibido o uso de AsyncStorage comum para guardar credenciais ou tokens.  
* **RNF-SEC-02 (Política e Hashing de Senhas):** O backend deve exigir senhas de no mínimo 8 caracteres (com letras, números e caracteres especiais) e persisti-las no PostgreSQL utilizando BcryptJS com fator de custo (*salt*) mínimo de 10\. Para mitigar ataques de força bruta à complexidade das senhas, o sistema deve bloquear temporariamente a conta (ou exigir captcha) após 5 tentativas de login consecutivas sem sucesso.  
* **RNF-SEC-03 (Rotação e Expiração de Sessão):** O JWT deve possuir tempo de expiração curto (ex: 15 a 60 minutos) e o sistema deve implementar a rotação segura via *Refresh Token* para manter o usuário autenticado no app sem expor credenciais.  
* **RNF-SEC-04 (Autenticação em Duas Etapas \- 2FA / MFA)** O sistema deve suportar Autenticação em Duas Etapas (2FA/MFA) via aplicativo autenticador (TOTP como Google Authenticator/Authy) ou código temporário (OTP) enviado por e-mail/SMS. A verificação do segundo fator deve ser obrigatória no primeiro acesso de um novo dispositivo ou em ações críticas da conta.

**2\. Gerenciamento de Dados em Repouso e Anonimização**

* **RNF-SEC-05 (Criptografia no Banco de Dados):** O banco de dados PostgreSQL deve utilizar criptografia em repouso (AES-256) tanto nos volumes do banco quanto nos arquivos de backup.  
* **RNF-SEC-06 (Anonimização Visual de Denúncias):** O sistema deve omitir dados pessoais (nome, e-mail, CPF) na exibição pública dos registros de problemas urbanos, exibindo apenas o relato, foto e coordenadas da ocorrência.

**3\. Atendimento à LGPD (Lei Geral de Proteção de Dados)**

* **RNF-SEC-07 (Consentimento e Transparência):** O aplicativo deve apresentar a Política de Privacidade e os Termos de Uso no cadastro, exigindo um aceite explícito (*opt-in*) do usuário antes de coletar qualquer dado.  
* **RNF-SEC-08 (Direito ao Esquecimento):** O sistema deve prover um fluxo que permita ao cidadão solicitar a exclusão da conta ou a anonimização definitiva dos seus dados pessoais vinculados às denúncias.  
* **RNF-SEC-09 (Minimização de Acesso à Localização):** O app mobile deve solicitar permissão de GPS apenas no momento da captura da ocorrência, sem realizar rastreamento de geolocalização em segundo plano (*background*).  
* **RNF-SEC-10 (Tratamento de Dados Sensíveis e de Menores):** Caso o sistema processe dados sensíveis (saúde, biometria, etnia, etc.), ele deverá exigir e registrar um consentimento específico e destacado exclusivamente para essas finalidades. Se o sistema for utilizado por crianças, deverá possuir um mecanismo para coletar o consentimento específico de pelo menos um dos pais ou do responsável legal.  
* **RNF-SEC-11 (Portal de Direitos do Titular):** O aplicativo deve disponibilizar uma interface centralizada e de fácil acesso (ex: Tela de Perfil ou Configurações de Privacidade) que permita ao usuário consultar os seus dados pessoais armazenados, editá-los para manter a exatidão das informações e solicitar a exportação (portabilidade) do seu histórico de dados em um formato estruturado.

**Glossário de Termos de Segurança**

* **AsyncStorage:** Armazenamento chave-valor simples do React Native. Não possui criptografia nativa, sendo totalmente inadequado para guardar tokens de sessão ou senhas.  
* **Expo Secure Store / RN Keychain:** Bibliotecas que utilizam o ecossistema seguro do sistema operacional (iOS Keychain / Android Keystore) para criptografar e salvar dados sensíveis no dispositivo.  
* **JWT & Refresh Token:** O JWT é um token assinado de vida curta que autentica as requisições na API. O Refresh Token serve para renovar o JWT prestes a expirar sem forçar o usuário a fazer login novamente.  
* **BcryptJS & Salt:** Algoritmo de hashing de senhas. O *salt* é um dado aleatório adicionado à senha antes de gerar o hash, impedindo ataques de força bruta via tabelas de senhas pré-computadas (*Rainbow Tables*).  
* **AES-256:** Padrão de criptografia de bloco com chave de 256 bits, utilizado para proteger os dados armazenados em disco no banco de dados contra cópias não autorizadas.  
* **Opt-in:** Princípio da LGPD onde a coleta de dados só pode ocorrer mediante aceitação explícita e ativa do usuário (ex: marcar um *checkbox* voluntariamente).

**\*\* Uso de IA \*\*** 

Os temas e pilares de segurança apresentados nesta seção foram definidos pelos autores com base nas necessidades do sistema.

A Inteligência Artificial foi consultada exclusivamente para apoiar a redação e estruturação deste documento de requisitos, atuando em:

* **Padronização Formal:** Organização das ideias fornecidas pelos autores no formato de Requisitos Não-Funcionais (RNFs).  
* **Sugestão de Tecnologias e Ferramentas:** Recomendação de bibliotecas e recursos adequados ao ecossistema React Native e Node.js para implementar a segurança no app.  
* **Elaboração do Glossário:** Definição clara dos termos técnicos e bibliotecas mencionadas no texto.

Todo o conteúdo foi revisado e validado pelos autores do projeto.