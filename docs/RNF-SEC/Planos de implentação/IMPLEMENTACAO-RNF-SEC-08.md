# Implementação — RNF-SEC-08

## Objetivo

Permitir exclusão da conta ou anonimização definitiva dos dados pessoais
vinculados às denúncias do titular.

## Implementação realizada

- portal mobile oferece exclusão e anonimização;
- `DELETE /auth/me` exige autenticação e confirmação de senha;
- exclusão remove a conta e seus dados conforme as relações;
- anonimização remove nome, e-mail, CPF, endereço e demais identificadores;
- denúncia preservada mantém somente o necessário sem vínculo pessoal;
- sessões são invalidadas no fluxo de encerramento.

## Fluxo

1. Titular acessa o portal autenticado.
2. Escolhe exclusão ou anonimização.
3. Confirma a senha e a intenção.
4. Backend valida a identidade e a opção.
5. Transação remove ou descaracteriza os dados.
6. Sessão é encerrada e o resultado é informado.

## Evidências e testes

- `backend/src/routes/authRoutes.ts`;
- controller/serviço de autenticação;
- `mobile/src/views/rights-portal-view.tsx`;
- schema e relações de denúncias;
- testes de direitos e anonimização.

## Critérios de aceite

- usuário não consegue operar sobre outra conta;
- confirmação de senha é obrigatória;
- anonimização remove PII do titular;
- denúncia preservada não mantém vínculo identificável;
- exclusão encerra sessões e impede novo uso do token.

## Status

**Atende.**
