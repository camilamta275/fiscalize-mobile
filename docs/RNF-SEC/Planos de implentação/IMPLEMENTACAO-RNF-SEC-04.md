# Implementação — RNF-SEC-04

## Objetivo

Exigir segundo fator no primeiro acesso de um dispositivo e em ações críticas,
usando OTP enviado por e-mail.

## Implementação realizada

- dispositivos confiáveis são registrados no backend;
- códigos OTP são gerados de forma criptograficamente segura;
- somente hashes dos códigos são persistidos;
- desafios expiram em cinco minutos;
- há cooldown, uso único e limite de tentativas;
- login novo usa `/auth/2fa/verify`;
- ações críticas usam solicitação e verificação adicional;
- o mobile persiste o identificador do dispositivo no Secure Store.

## Fluxo

1. O cliente envia `deviceId` no login.
2. O backend identifica dispositivo novo.
3. Um desafio OTP é criado e enviado por e-mail.
4. O cliente envia o código.
5. O backend valida expiração, hash, dispositivo e tentativas.
6. O dispositivo pode ser marcado como confiável.

## Evidências e testes

- `backend/prisma/schema.prisma`;
- `backend/src/services/otpService.ts`;
- `backend/src/services/authService.ts`;
- `mobile/src/services/device-service.ts`;
- `mobile/src/views/otp-verification-view.tsx`;
- `automation/tests/api/tests/test_mfa_otp.py`.

## Critérios de aceite

- dispositivo novo não conclui login sem OTP;
- código expirado, incorreto ou reutilizado é rejeitado;
- cinco tentativas incorretas bloqueiam o desafio;
- ações críticas exigem verificação recente;
- o código não aparece persistido em texto puro.

## Limitações

O controle implementado é OTP por e-mail. SMS e TOTP não estão habilitados.

## Status

**Atende — OTP por e-mail.**
