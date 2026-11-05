# Implementação — RNF-SEC-01

## Objetivo

Garantir que JWTs e refresh tokens do aplicativo sejam persistidos somente em
armazenamento nativo seguro, reduzindo o risco de exposição por cópia de dados
do aplicativo ou acesso a armazenamento comum.

## Implementação realizada

- `mobile/src/hooks/use-storage-state.ts` centraliza a persistência usando
  `expo-secure-store`;
- `mobile/app.json` habilita a configuração necessária do Secure Store;
- o fluxo de sessão mantém tokens em memória durante a execução;
- logout e expiração removem os valores persistidos;
- não há persistência de tokens em `AsyncStorage`.

## Fluxo

1. Login ou refresh retorna os tokens.
2. O cliente grava os tokens no Secure Store.
3. Requisições autenticadas leem o token necessário.
4. Logout, expiração ou revogação limpam a sessão.

## Evidências e validação

- inspeção de `use-storage-state.ts`;
- inspeção de `app.json`;
- busca por usos de `AsyncStorage` relacionados a credenciais;
- teste manual de login, reinicialização, refresh e logout em dispositivo.

## Critérios de aceite

- nenhum JWT ou refresh token é gravado em armazenamento comum;
- tokens não aparecem em logs;
- logout remove os tokens;
- o aplicativo recupera a sessão somente pelo armazenamento seguro.

## Status

**Atende.** A validação em dispositivo continua recomendada para comprovar o
comportamento nativo em Android e iOS.
