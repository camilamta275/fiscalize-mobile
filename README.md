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
- **Samuel Araujo**
- **Victor Ferreira**

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

- **Framework Mobile:** Expo (React Native) com Expo Router
- **Linguagem:** TypeScript
- **Interface:** componentes nativos do React Native, com um pequeno design system próprio (`ThemedText`/`ThemedView`, cores em `src/constants/theme.ts`) — sem biblioteca de UI de terceiros
- **Navegação:** Expo Router (roteamento por arquivos, com `Stack.Protected` guardando as rotas autenticadas)
- **Gerenciamento de Estado:** Context API (`SessionProvider`, para a sessão do usuário) + estado local por tela, seguindo um padrão MVVM (`models/`, `services/`, `viewmodels/`, `views/`)
- **Formulários e Validação:** validação própria nos `viewmodels`, espelhando as mesmas regras do front-end web (`frontend/src/lib/validations.ts`)
- **Recursos nativos:** `expo-secure-store` (token de sessão), `expo-location` (GPS sob demanda) e `expo-camera` (foto da ocorrência)
- **Testes:** ainda não há suíte automatizada configurada no mobile

### Back-end

O back-end e as regras de negócio da versão web serão mantidos e reaproveitados, com as adaptações necessárias para integração com o aplicativo mobile. Ele vive em um repositório próprio e está incluído aqui como submódulo Git em `backend/` — veja [Integração com o Back-end](#-integração-com-o-back-end).

- **API/Servidor:** Express 5 sobre Node.js 22 — [fiscalize-backend](https://github.com/rapheto/fiscalize-backend)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL 14+ com Prisma ORM 7
- **Integração:** API REST consumida pela aplicação mobile, documentada via Swagger em `GET /docs`

## 🏗️ Arquitetura do Projeto

```text
fiscalize-mobile/
├── backend/                # Submódulo Git → fiscalize-backend (API REST)
└── mobile/                 # App Expo (React Native)
    ├── app.json
    ├── .env.example         # EXPO_PUBLIC_API_BASE_URL — veja "Como Executar"
    └── src/
        ├── app/             # Rotas (Expo Router, roteamento por arquivos)
        ├── components/      # Componentes de UI reutilizáveis
        ├── constants/       # Cores, espaçamento, tema
        ├── contexts/        # Contextos globais (sessão/autenticação)
        ├── hooks/           # Hooks personalizados
        ├── models/          # Tipos que espelham as respostas do backend
        ├── services/        # Chamadas HTTP à API
        ├── viewmodels/      # Estado e regras de cada tela (padrão MVVM)
        └── views/           # Componentes visuais de cada tela
```

## 🚀 Como Executar o Projeto

**Funciona em Windows, macOS e Linux** — Node.js, o Expo CLI e o Metro (o bundler) são multiplataforma. A única coisa que só existe no macOS é o **simulador de iOS** (exige Xcode); em Windows/Linux você testa em um **celular físico** (Android ou iPhone, não importa o sistema do seu computador) usando o app Expo Go, ou em um emulador Android (exige Android Studio, mas **não é obrigatório** — dá pra desenvolver 100% num celular físico).

### Pré-requisitos

- **Node.js 22+** (mesma versão usada no `backend/`)
- **App Expo Go** instalado no celular — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) ou [iOS](https://apps.apple.com/app/expo-go/id982107779)
  - No **iOS físico**, o Expo Go exige estar logado com a mesma conta Expo do computador (`npx expo login`) — é gratuito, só criar conta em [expo.dev](https://expo.dev). No Android não precisa.
- **PostgreSQL** — só se for rodar o backend localmente (veja o [README do backend](./backend/README.md))
- Android Studio ou Xcode — **opcionais**, só se você quiser usar um emulador/simulador em vez de celular físico

### Instalação

1. Clone este repositório junto com o submódulo do back-end:

```bash
git clone --recurse-submodules https://github.com/camilamta275/fiscalize-mobile.git
cd fiscalize-mobile
```

> Já clonou sem o `--recurse-submodules`? Rode `git submodule update --init`.

2. Instale as dependências do app mobile:

```bash
cd mobile
npm install
```

3. Configure a URL da API:

```bash
cp .env.example .env
```

Abra o `.env` e ajuste `EXPO_PUBLIC_API_BASE_URL` conforme onde você for testar (o próprio arquivo explica cada caso):
   - Emulador Android → `http://10.0.2.2:3000` (já é o padrão, não precisa mexer)
   - Simulador iOS → `http://localhost:3000` (também já é o padrão)
   - **Celular físico** (o caso mais comum) → o IP da sua máquina na rede local, ex: `http://192.168.0.10:3000`. Descubra o seu com `ipconfig getifaddr en0` (macOS) ou `ipconfig` (Windows, procure por "Endereço IPv4"). Esse IP muda se você trocar de Wi-Fi — é só atualizar o `.env` de novo quando isso acontecer.

4. Suba o backend (em outro terminal — veja o [README do backend](./backend/README.md) para configurar banco de dados e seed):

```bash
cd backend
npm ci
cp .env.example .env    # preencha DATABASE_URL e JWT_SECRET
npm run dev             # sobe em http://localhost:3000
```

5. Rode o app mobile:

```bash
cd mobile
npx expo start
```

No terminal vai aparecer um QR code — escaneie com a **Câmera** do iPhone (abre direto no Expo Go) ou pelo próprio app **Expo Go** no Android. Se preferir um emulador/simulador, pressione `a` (Android) ou `i` (iOS, só no Mac) no terminal onde o `expo start` está rodando.

> Se o celular não conseguir conectar (erro de rede), confira se ele está na **mesma rede Wi-Fi** do computador e se o `.env` tem o IP certo. Como alternativa, `npx expo start --tunnel` cria um túnel público que funciona mesmo em redes diferentes (mais lento, mas contorna problemas de firewall/rede corporativa).

## 🔗 Integração com o Back-end

O back-end fica em um repositório próprio, [fiscalize-backend](https://github.com/rapheto/fiscalize-backend), incluído aqui como **submódulo Git** na pasta `backend/`. Assim o código da API fica disponível para o desenvolvimento local sem duplicar o histórico neste repositório.

### Obter e atualizar o submódulo

```bash
git submodule update --init      # primeira vez, após clonar
git submodule update --remote    # trazer a versão mais recente do back-end
```

O submódulo aponta para um commit fixo. Ao atualizá-lo, comite a mudança para que todo o time use a mesma versão:

```bash
git add backend && git commit -m "chore: atualiza submódulo do back-end"
```

### Rodar a API localmente

```bash
cd backend
npm ci
cp .env.example .env    # preencha DATABASE_URL e JWT_SECRET
npm run dev             # sobe em http://localhost:3000
```

As instruções completas (banco de dados, migrações e seed) estão no [README do back-end](./backend/README.md).

### Configurar o endereço da API

O app mobile aponta para o backend pela variável `EXPO_PUBLIC_API_BASE_URL` — veja o passo 3 de [Como Executar o Projeto](#-como-executar-o-projeto) para os valores certos em cada cenário (emulador, simulador ou celular físico).

> Nunca adicione senhas, tokens ou outras credenciais diretamente ao repositório.

## 🧪 Testes

A estratégia de testes deverá considerar tanto o reaproveitamento das validações existentes quanto os comportamentos específicos de dispositivos móveis.

- Testes unitários das regras de negócio e funções compartilhadas.
- Testes de integração com a API.
- Testes dos principais fluxos da aplicação.
- Testes de navegação e interface mobile.
- Testes de permissões, câmera, localização e notificações, quando implementados.
- Testes em diferentes tamanhos de tela, dispositivos e sistemas operacionais.

> Ainda não há suíte de testes automatizados configurada em `mobile/` (nenhum script `test` no `package.json`) — esta seção será preenchida quando isso for adicionado. O que existe hoje é `npm run lint` (`mobile/package.json`), que roda o ESLint.

## 🗺️ Status do Projeto

🚧 **Em desenvolvimento** — segunda etapa do projeto Fiscalize, dedicada à criação da versão mobile.

## 📌 Versão Web

A primeira etapa do Fiscalize foi desenvolvida como uma aplicação web. O repositório original contém o histórico e a implementação da versão anterior:

➡️ **[Acessar o repositório do Fiscalize Web](https://github.com/camilamta275/projeto-web)**

## Uso de IA
Declaramos que utilizamos as ferramentas de Inteligência Artificial: Claude, Codex, Gemini, ChatGPT e GitHub Copilot nesta atividade, com a finalidade de gerar auxilio em desenvolvimento de código, criação de documentação, arquitetura de código e outros, sobre o qual realizamos análise crítica (curadoria) das informações apresentadas. Não tratamos dados pessoais no uso destas ferramentas. Revisamos criticamente o conteúdo gerado, identificando seus acertos e eventuais imprecisões, e assumimos a responsabilidade integral pela versão final apresentada.

## 📄 Licença

MIT

