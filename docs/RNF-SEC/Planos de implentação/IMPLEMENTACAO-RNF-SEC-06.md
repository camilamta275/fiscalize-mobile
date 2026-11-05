# Implementação — RNF-SEC-06

## Objetivo

Exibir denúncias publicamente sem revelar a identidade ou o endereço pessoal
do cidadão autor.

## Implementação realizada

- `GET /demands/public` é separado das listagens autenticadas;
- `demandService` usa seleção explícita de campos públicos;
- nome, e-mail, CPF, usuário e endereço residencial não são projetados;
- relatos, categoria, foto, coordenadas, status e protocolo podem permanecer
  conforme o escopo do produto;
- o teste de privacidade verifica campos permitidos e proibidos.

## Fluxo

1. Cliente solicita a listagem pública.
2. A rota pública não exige autenticação.
3. O serviço consulta somente os campos permitidos.
4. A resposta não contém o relacionamento completo do cidadão.

## Evidências e testes

- `backend/src/routes/demandRoutes.ts`;
- `backend/src/services/demandService.ts`;
- `automation/tests/api/tests/test_public_demand_privacy.py`.

## Critérios de aceite

- resposta pública não contém identificadores diretos do autor;
- listagem autenticada continua separada;
- novos campos pessoais não são adicionados à projeção pública sem revisão;
- fotos e coordenadas são avaliadas quanto a risco de reidentificação.

## Status

**Atende**, com revisão contínua do risco de reidentificação indireta.
