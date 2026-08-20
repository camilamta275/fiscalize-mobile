# Fiscalize Mobile — Sistema Integrado de Gestão Urbana de Pernambuco

## Criado por

- **Alessandra Barbosa**
- **Ana Sofia**
- **Camila Teixeira**
- **Lucas Rodrigues** 
- **Maria Gabriela**
- **René Lucena**
- **Raphael Miranda**
- **Rayane Cavalcanti**

## 🎯 Visão Geral

O **Fiscalize Mobile** é a segunda etapa do projeto Fiscalize, um sistema integrado de gestão urbana desenvolvido para facilitar o registro, o acompanhamento e a resolução de problemas urbanos em Pernambuco.

Nesta nova fase, a solução originalmente desenvolvida para a web será adaptada para dispositivos móveis. O objetivo é tornar o acesso aos serviços mais prático e ampliar a mobilidade dos cidadãos, agentes de campo, fiscais e demais usuários envolvidos no atendimento das ocorrências.

A aplicação permitirá que cidadãos registrem demandas urbanas e acompanhem seu andamento. Também apoiará agentes de campo e fiscais na validação, complementação e atualização das informações das ocorrências durante o atendimento.

> Este repositório contém a versão mobile do projeto. A versão web desenvolvida anteriormente pode ser consultada em: **[Fiscalize Web](https://github.com/camilamta275/projeto-web)**.

## 📱 Objetivos da Versão Mobile

- Adaptar os principais fluxos do Fiscalize para uma experiência mobile.
- Facilitar o registro e o acompanhamento de ocorrências urbanas.
- Apoiar o trabalho de agentes de campo e fiscais diretamente no local da ocorrência.
- Aproveitar os recursos nativos dos dispositivos móveis, quando aplicável.
- Reutilizar o back-end e as regras de negócio já desenvolvidos na versão web.
- Melhorar a acessibilidade, a usabilidade e a agilidade no atendimento das demandas.

## ✨ Funcionalidades Previstas

- Cadastro e autenticação de usuários.
- Registro de ocorrências urbanas.
- Inclusão de descrição, categoria, localização e evidências da ocorrência.
- Consulta e acompanhamento do status das demandas.
- Validação e complementação de informações pelos agentes de campo e fiscais.
- Atualização do andamento das ocorrências.
- Histórico de registros e atualizações.
- Integração com o back-end existente do Fiscalize.
- Utilização de recursos mobile, como câmera, localização e notificações, conforme a evolução do projeto.

## 👥 Perfis de Usuário

- **Cidadão:** registra ocorrências e acompanha o andamento das demandas.
- **Atendente da Prefeitura:** cadastra demandas recebidas por outros canais e auxilia no atendimento.
- **Agente de Campo/Fiscal:** valida, complementa e atualiza as informações de uma ocorrência.
- **Gestor:** acompanha as demandas, distribui atividades e monitora os atendimentos.
- **Administrador:** gerencia usuários, órgãos, categorias e configurações do sistema.

## 📚 Stack Tecnológica

### Front-end Mobile

> Preencher após a definição das tecnologias utilizadas na nova aplicação.

- **Framework Mobile:** `[inserir framework]`
- **Linguagem:** `[inserir linguagem]`
- **Biblioteca de Interface:** `[inserir biblioteca]`
- **Navegação:** `[inserir tecnologia]`
- **Gerenciamento de Estado:** `[inserir tecnologia]`
- **Formulários e Validação:** `[inserir tecnologia]`
- **Testes:** `[inserir ferramentas]`

### Back-end

O back-end e as regras de negócio da versão web serão mantidos e reaproveitados, com as adaptações necessárias para integração com o aplicativo mobile.

- **API/Servidor:** Node.js e rotas de API existentes no projeto Fiscalize
- **Linguagem:** TypeScript
- **Banco de Dados:** `[inserir banco de dados utilizado]`
- **Integração:** API consumida pela aplicação mobile

## 🏗️ Arquitetura do Projeto

> Atualizar esta seção de acordo com a estrutura adotada durante o desenvolvimento.

```text
fiscalize-mobile/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas da aplicação
│   ├── navigation/      # Configuração das rotas e navegação
│   ├── services/        # Comunicação com a API
│   ├── hooks/           # Hooks personalizados
│   ├── contexts/        # Contextos e estados globais
│   ├── utils/           # Funções auxiliares
│   └── assets/          # Imagens, ícones e fontes
├── tests/               # Testes automatizados
└── README.md
```

## 🚀 Como Executar o Projeto

### Pré-requisitos

Antes de começar, instale as ferramentas exigidas pela tecnologia mobile escolhida.

- `[inserir requisito, por exemplo: Node.js]`
- `[inserir requisito, por exemplo: Android Studio ou Xcode]`
- `[inserir gerenciador de pacotes]`
- `[inserir emulador, simulador ou aplicativo de execução]`

### Instalação

1. Clone este repositório:

```bash
git clone URL_DO_REPOSITORIO_MOBILE
```

2. Acesse a pasta do projeto:

```bash
cd NOME_DA_PASTA
```

3. Instale as dependências:

```bash
COMANDO_DE_INSTALACAO
```

4. Configure as variáveis de ambiente conforme o arquivo de exemplo:

```bash
cp .env.example .env
```

5. Execute a aplicação:

```bash
COMANDO_PARA_EXECUTAR
```

## 🔗 Integração com o Back-end

A versão mobile consumirá os serviços já existentes no back-end do Fiscalize. O endereço da API deverá ser configurado por variável de ambiente.

Exemplo:

```env
API_BASE_URL=URL_DA_API
```

> Nunca adicione senhas, tokens ou outras credenciais diretamente ao repositório.

## 🧪 Testes

A estratégia de testes deverá considerar tanto o reaproveitamento das validações existentes quanto os comportamentos específicos de dispositivos móveis.

- Testes unitários das regras de negócio e funções compartilhadas.
- Testes de integração com a API.
- Testes dos principais fluxos da aplicação.
- Testes de navegação e interface mobile.
- Testes de permissões, câmera, localização e notificações, quando implementados.
- Testes em diferentes tamanhos de tela, dispositivos e sistemas operacionais.

Para executar os testes:

```bash
COMANDO_DE_TESTE
```

## 🗺️ Status do Projeto

🚧 **Em desenvolvimento** — segunda etapa do projeto Fiscalize, dedicada à criação da versão mobile.

## 📌 Versão Web

A primeira etapa do Fiscalize foi desenvolvida como uma aplicação web. O repositório original contém o histórico e a implementação da versão anterior:

➡️ **[Acessar o repositório do Fiscalize Web](https://github.com/camilamta275/projeto-web)**

## 📄 Licença

MIT

