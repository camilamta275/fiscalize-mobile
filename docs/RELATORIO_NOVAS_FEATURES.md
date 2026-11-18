# Relatório de implementação de novas features

## 1. Resumo da investigação inicial

A estrutura do repositório já estava organizada em duas camadas principais:

- `mobile/` com o app Expo/React Native e arquitetura em `src/app`, `src/views`, `src/viewmodels`, `src/services`, `src/contexts` e `src/models`.
- `backend/` como submódulo com API Express + TypeScript + Prisma e autenticação JWT, rotas de chamados, métricas e dashboard do gestor.

A investigação confirmou que a base do projeto já apresentava:

- autenticação por JWT e MFA em dispositivos registrados;
- filtros funcionais de demandas na API do backend (`status`, `categoria`, `regiao`, `orgao`, `ordenacao`);
- proteção de rotas com `authenticate` e `requireRole`;
- indicadores de métricas no backend (`/metrics/...`);
- infraestrutura de gestão da demanda e timeline de eventos.

O principal ponto ausente foi a integração nativa de notificações push e a configuração EAS do app mobile.

## 2. Estado inicial de cada funcionalidade

### Feature 1 — Notificações com Expo Notifications
- Estado inicial: ausente.
- Falta principal: não havia registro do push token, canal de envio e persistência/consulta de notificações.

### Feature 2 — Segurança e dados
- Estado inicial: parcialmente implementada no backend.
- Segurança: já havia autenticação JWT, bloqueio de tokens, MFA, refresh tokens e controle por perfil.
- Indicadores: já havia rotas de métricas e dashboard do gestor em `/metrics` e `/gestor/dashboard`.
- Pendência: ausência de integração de notificação de mudanças de status para o usuário responsável.

### Feature 3 — Filtros funcionais de demandas
- Estado inicial: já implementada nos endpoints de demandas.
- O backend aceitou filtros por categoria, região, status e ordenação, e o mobile consumia esses parâmetros via `demandService.list()`.

### Feature 4 — Configuração EAS e primeiro build
- Estado inicial: ausência de `eas.json` e configuração de build para Android/iOS.

## 3. Funcionalidades implementadas

### 3.1 Notificações Expo
- Foi adicionada a dependência `expo-notifications` ao app mobile.
- O aplicativo agora solicita permissão para notificações e registra o Expo Push Token do dispositivo após autenticação.
- O backend passou a persistir o token de push no registro do dispositivo associado ao usuário.
- O fluxo de atualização de status de chamado gera notificação persistida no banco e tenta envio por Expo Push.
- O cidadão pode consultar as notificações recebidas no app em uma nova tela de notificações.

### 3.2 Segurança e dados
- A segurança existente foi preservada e integrada ao fluxo de notificação.
- As notificações são registradas apenas para o usuário dono da ocorrência e sentidas por meio do dispositivo comercial do usuário autenticado.
- Regras de autorização e propriedade da demanda continuam aplicadas no backend.

### 3.3 Filtros
- Os filtros já existentes foram mantidos e validos como parte do fluxo principal.
- A integração para push está compatível com o ciclo de vida da demanda e não altera o comportamento dos filtros.

### 3.4 EAS
- Foi criado o arquivo `mobile/eas.json` com perfis para `development`, `preview` e `production`.
- A configuração foi preparada para Android com APK em preview e estrutura para iOS.

## 4. Decisões técnicas tomadas

- Uso do modelo `usuario_dispositivo` para registrar o token do aparelho e evitar múltiplos cadastros duplicados por dispositivo.
- Persistência de notificação em `notificacao` para garantir histórico in-app no app e permitir leitura posterior.
- Envio push via Expo somente quando o token real do dispositivo está cadastrado e a variável `EXPO_ACCESS_TOKEN` está configurada.
- Prevenção de duplicidade de notificações por janela de tempo curta para o mesmo chamado e mesmo tipo de atualização.
- Integração com a API real do backend e não com dados simulados.

## 5. Arquivos criados e alterados

### Mobile
- `mobile/package.json`
- `mobile/app.json`
- `mobile/eas.json`
- `mobile/src/app/_layout.tsx`
- `mobile/src/contexts/session-context.tsx`
- `mobile/src/views/rights-portal-view.tsx`
- `mobile/src/services/notification-service.ts`
- `mobile/src/views/notifications-view.tsx`
- `mobile/src/app/(app)/notifications.tsx`

### Backend
- `backend/prisma/schema.prisma`
- `backend/src/config/env.ts`
- `backend/.env.example`
- `backend/src/server.ts`
- `backend/src/services/demandService.ts`
- `backend/src/controllers/notificationController.ts`
- `backend/src/routes/notificationRoutes.ts`
- `backend/src/services/notificationService.ts`

## 6. Endpoints criados e modificados

### Novos endpoints
- `POST /notifications/devices/push-token`
  - recebe `deviceId`, `deviceName` e `pushToken`.
  - grava o token associado ao usuário autenticado.
- `GET /notifications`
  - lista as notificações do usuário autenticado.
- `PATCH /notifications/:id/read`
  - marca a notificação como lida.

### Endpoints já existentes e integrados
- `PATCH /demands/:id/status`
  - agora dispara a notificação de atualização quando o status muda.
- `POST /demands`
  - agora dispara a primeira notificação de recebimento da ocorrência.

## 7. Alterações no banco de dados

- Adicionado campo `push_token` em `usuario_dispositivo`.
- Adicionado campo `push_token_updated_at` em `usuario_dispositivo`.
- Mantidas as tabelas `notificacao`, `timeline_event` e `chamado` já existentes.

## 8. Como funcionam as notificações

1. O app solicita permissão de push.
2. O token Expo é obtido e enviado ao backend autenticado.
3. O backend salva o token no dispositivo do usuário.
4. Quando um gestor altera o status da demanda, o backend cria uma notificação de `status_atualizado` para o cidadão.
5. O backend tenta enviar o push para todos os dispositivos registrados do usuário.
6. A notificação também permanece armazenada no banco para consulta in-app.
7. O usuário pode abrir a tela de notificações e marcar mensagens como lidas.

## 9. Como funcionam os controles de segurança

- A autenticação permanece no backend com JWT e refresh token.
- Apenas usuários autenticados acessam as rotas de notificações.
- As regras de propriedade de demanda continuam valendo em `demandService.findById` e `demandService.update`.
- A notificação é emitida para o dono da ocorrência, e não para qualquer usuário.
- Tokens e dados sensíveis não são expostos em logs.

## 10. Como funcionam os indicadores do gestor

Os indicadores já existentes seguem a arquitetura do backend e continuam disponíveis em:

- `/metrics/total-demands`
- `/metrics/demands-by-category`
- `/metrics/average-response-time`

Essas rotas permanecem protegidas por autenticação e restritas a perfis de Gestor.

Para o tempo médio de atendimento, a regra adotada é a diferença entre `atualizadoem` e `criadoem` para chamados concluídos ou com status final, refletindo o tempo real de acompanhamento da demanda.

## 11. Como utilizar os filtros

Os filtros já estavam implementados em `demandService.list()` e continuam disponíveis via API:

- `status`
- `categoria`
- `regiao`
- `orgao`
- `ordenacao`
- `page`
- `limit`

Exemplo:

`GET /demands?status=Em%20Andamento&categoria=3&regiao=Recife&orgao=PME&ordenacao=recent&page=1&limit=20`

## 12. Configuração do EAS

Arquivo criado: `mobile/eas.json`.

Perfis configurados:

- `development`: internal build com `developmentClient`.
- `preview`: distribuição interna, Android em APK.
- `production`: build pronto para publicação.

## 13. Comandos para executar e gerar builds

### App mobile
```bash
cd mobile
npm install
npx expo start
```

### Build EAS
```bash
cd mobile
npx eas login
npx eas build --platform android --profile preview
```

Para iOS, o processo depende de conta Apple e credenciais da equi pe pela plataforma; no ambiente local não houve credenciais válidas para concluir a geração de IPA.

## 14. Testes realizados e resultados

### Validação executada
- `cd mobile && npx tsc --noEmit`
- `cd backend && npx tsc --noEmit`
- `cd backend && npx prisma generate`

### Resultados
- Compilação do app mobile: aprovada.
- Compilação da API backend: aprovada.
- Geração do Prisma client: aprovada.
- Build EAS real: não executado por ausência de credenciais e infraestrutura de publicação no ambiente local.

## 15. Limitações e pendências

- O envio push real depende de `EXPO_ACCESS_TOKEN` configurado no backend.
- O build iOS continua bloqueado por ausência de credenciais Apple.
- O build Android só pode ser concluído em ambiente com login e configuração EAS válidos.
- O fluxo de notificação está operacional no backend e no app, mas depende do ambiente de produção ou de um Expo/APNS configurado corretamente.

## Conclusão

A base arquitetural já estava avançada no projeto. O que faltava era a integração nativa de notificações push, a persistência do token do dispositivo e o registro in-app das notificações. Essas pendências foram cobertas de forma compatível com a API existente, sem quebrar os controles de segurança e os indicadores de gestão já implementados.
