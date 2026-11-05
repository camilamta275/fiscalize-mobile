# Implementação — RNF-SEC-11

## Objetivo

Disponibilizar ao titular consulta, correção, exportação e encaminhamento de
solicitações sobre seus próprios dados.

## Implementação realizada

- o perfil mobile oferece entrada para o portal de direitos;
- `GET /auth/me` permite consulta do próprio perfil;
- `PUT /auth/me` permite correção dos dados autorizados;
- `GET /auth/me/export` gera JSON estruturado;
- a exportação não inclui senha;
- exclusão e anonimização ficam acessíveis no mesmo portal;
- rotas exigem autenticação e usam o usuário do token.

## Fluxo

1. Titular abre o portal pelo perfil.
2. API retorna somente seus dados.
3. Titular edita dados permitidos.
4. Titular solicita exportação estruturada.
5. Titular pode iniciar exclusão ou anonimização.

## Evidências e testes

- `mobile/src/app/(app)/profile.tsx`;
- `mobile/src/views/rights-portal-view.tsx`;
- rotas e controller `auth/me`;
- serviço de autenticação;
- testes de perfil, exportação e direitos.

## Critérios de aceite

- consulta exige autenticação;
- edição valida e altera somente o titular;
- exportação é estruturada e não contém senha ou token;
- acesso cruzado entre contas é rejeitado;
- portal oferece os fluxos de eliminação previstos.

## Status

**Atende.**
