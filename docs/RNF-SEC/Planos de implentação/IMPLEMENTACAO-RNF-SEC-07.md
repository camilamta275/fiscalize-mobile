# Implementação — RNF-SEC-07

## Objetivo

Garantir consentimento explícito e transparência antes do cadastro e do
tratamento relacionado à política de privacidade.

## Implementação realizada

- cadastro exibe política e termos em modal;
- checkbox de aceite inicia desmarcado;
- versão `1.1` é enviada pelo cliente;
- backend valida a versão aceita;
- consentimento é persistido com a conta em transação;
- o registro inclui versão, data e associação ao usuário.

## Fluxo

1. Usuário abre a política no cadastro.
2. Marca explicitamente o aceite.
3. Cliente envia `privacyPolicyVersion`.
4. Servidor valida a versão vigente.
5. Conta e consentimento são persistidos atomicamente.

## Evidências e testes

- `mobile/src/views/register-view.tsx`;
- view model de cadastro;
- controller/serviço de autenticação;
- modelo `consentimentos_privacidade`;
- `POLITICA-DE-PRIVACIDADE.md`;
- testes de consentimento da API.

## Critérios de aceite

- cadastro sem aceite é rejeitado;
- versão inválida é rejeitada pelo servidor;
- aceite não é pré-selecionado;
- registro pode ser auditado posteriormente;
- mudança relevante de versão não substitui silenciosamente o histórico.

## Status

**Atende.**
