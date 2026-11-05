# Implementação — RNF-SEC-02

## Objetivo

Aplicar política mínima de senha, armazenamento com bcrypt e bloqueio
temporário após tentativas consecutivas de login malsucedidas.

## Implementação realizada

- `backend/src/utils/passwordPolicy.ts` concentra a política de complexidade;
- cadastro e alteração de senha validam a regra no servidor;
- `bcryptjs` gera hashes com custo 10;
- o serviço de autenticação registra falhas consecutivas;
- após cinco falhas, a conta é bloqueada temporariamente;
- o schema e a migração persistem contador e prazo do bloqueio;
- o mobile apresenta validação antecipada, sem substituir a validação server-side.

## Fluxo

1. A API recebe a senha.
2. A política server-side valida tamanho, maiúsculas, minúsculas, número e
   caractere especial.
3. No cadastro, a senha é transformada em hash.
4. No login, o hash é comparado sem recuperar a senha original.
5. Falhas incrementam o contador e podem iniciar o bloqueio.
6. Login válido reinicia o contador.

## Evidências e testes

- `backend/src/utils/passwordPolicy.ts`;
- controllers e serviços de autenticação;
- schema/migração de lockout;
- `automation/tests/api/tests/test_auth_security.py`;
- testes de senhas inválidas e cinco falhas consecutivas.

## Critérios de aceite

- senha inválida é rejeitada pela API;
- nenhum campo armazena senha em texto puro;
- custo bcrypt é no mínimo 10;
- a quinta falha consecutiva inicia bloqueio;
- senha correta não ignora o bloqueio ativo;
- login válido reinicia o contador após o desbloqueio.

## Status

**Atende.** A migração de lockout deve estar aplicada em cada ambiente.
