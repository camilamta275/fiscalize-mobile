# Implementação — RNF-SEC-03

## Objetivo

Reduzir a exposição de sessões com JWT de curta duração e rotação segura de
refresh tokens.

## Implementação realizada

- `JWT_EXPIRATION` possui padrão de 30 minutos;
- o backend emite JWT de acesso e refresh token;
- somente o hash do refresh token é persistido;
- cada refresh revoga o token anterior e emite outro;
- reutilização de refresh token revogado invalida a sessão;
- o cliente renova a sessão após resposta HTTP 401;
- tokens permanecem no Secure Store.

## Fluxo

1. Login emite sessão curta e refresh token.
2. O cliente usa o JWT nas requisições.
3. Ao expirar, solicita refresh.
4. O backend valida o hash e o estado de revogação.
5. O token anterior é revogado antes da nova emissão.
6. O cliente substitui os tokens armazenados.

## Evidências e testes

- `backend/src/config/env.ts`;
- `backend/src/services/authService.ts`;
- `backend/src/routes/authRoutes.ts`;
- modelo de sessões/refresh tokens;
- cliente de sessão mobile;
- testes de refresh, logout e reutilização.

## Critérios de aceite

- JWT possui expiração entre 15 e 60 minutos;
- refresh token antigo não funciona após rotação;
- logout revoga a sessão;
- reutilização detectada invalida a sessão;
- refresh token não é salvo em texto puro.

## Status

**Atende.** HTTPS em produção continua sendo uma pré-condição operacional.
