# Plano de implementação — RNF-SEC-10

## Objetivo

Restringir o uso do Fiscalize Mobile a pessoas com 18 anos ou mais, reduzindo
o risco de coleta e tratamento de dados de crianças e adolescentes no escopo
acadêmico do projeto.

O plano foi aprovado e implementado no backend, no cadastro mobile, nos testes
de API e na documentação relacionada.

## Escopo proposto

O cadastro passará a solicitar a data de nascimento e rejeitará:

- datas inválidas;
- datas futuras;
- pessoas com menos de 18 anos completos na data calculada pelo servidor.

Uma pessoa que completar 18 anos no dia do cadastro será aceita. A validação
do backend será obrigatória; a validação mobile servirá apenas para feedback
rápido ao usuário.

## Arquivos que serão atualizados ou criados

### Política e auditoria

- `POLITICA-DE-PRIVACIDADE.md`
  - informar que o aplicativo é destinado exclusivamente a maiores de 18
    anos;
  - explicar a coleta da data de nascimento, finalidade, retenção e direitos;
  - declarar que a verificação é baseada na informação fornecida pelo usuário;
  - informar o canal para solicitar correção ou eliminação.
- `AUDITORIA-REQUISITOS-SEGURANCA.md`
  - registrar atendimento do controle de idade após a implementação e os
    testes disponíveis;
  - manter explícita a limitação de que a idade é autodeclarada.
- `USO_IA/Raphael-Miranda.md`
  - registrar separadamente o planejamento e, depois, a implementação.

### Backend

- `backend/prisma/schema.prisma`
  - adicionar `data_nascimento` ao perfil `cidadao`, com tipo de data sem
    horário quando compatível com o banco;
  - manter o campo protegido de respostas públicas e de exportações
    desnecessárias.
- `backend/prisma/migrations/`
  - criar migração versionada para o novo campo.
- `backend/src/controllers/authController.ts`
  - exigir a data no cadastro;
  - validar formato e presença;
  - retornar erro claro para menor de 18 anos, data futura ou inválida.
- `backend/src/services/authService.ts`
  - calcular a idade usando a data do servidor;
  - repetir a validação no serviço, evitando confiar somente no controller;
  - persistir a data somente após a validação;
  - manter a criação da conta e do perfil atômica.
- `backend/src/utils/` ou módulo de domínio equivalente
  - criar helper testável para calcular idade e validar a data sem depender de
    timezone do dispositivo.
- `backend/src/config/swagger.ts`
  - documentar o campo obrigatório e as respostas de bloqueio.

### Mobile

- `mobile/src/views/register-view.tsx`
  - adicionar campo de data de nascimento com formato e instrução claros;
  - apresentar a regra “uso permitido para pessoas com 18 anos ou mais”;
  - não pré-preencher nem inferir a data;
  - mostrar erro acessível e específico.
- `mobile/src/viewmodels/use-register-view-model.ts`
  - controlar e validar o campo antes do envio;
  - enviar a data em formato acordado pela API;
  - preservar o bloqueio server-side como autoridade final.
- `mobile/src/services/auth-service.ts`
  - incluir `dataNascimento` no contrato de cadastro.
- `mobile/src/models/usuario.ts`
  - incluir o campo somente se ele fizer parte de respostas autenticadas
    necessárias; nunca adicioná-lo a DTOs públicos de denúncias.

### Testes

- `automation/tests/api/tests/test_age_restriction.py`
  - rejeitar pessoa com 17 anos;
  - aceitar pessoa com exatamente 18 anos;
  - rejeitar data futura;
  - rejeitar formato inválido;
  - rejeitar cadastro sem data;
  - confirmar que cadastro aceito persiste a data correta.
- testes do view model mobile, se a suíte mobile for configurada;
- validação manual de acessibilidade e mensagens no Android e iOS.

## Requisitos obrigatórios adicionais

- O backend deve ser a autoridade da idade; o cliente não pode enviar
  `idade` como número confiável.
- O cálculo deve considerar aniversário completo, inclusive mês e dia.
- Datas sem timezone devem ser tratadas como datas civis, evitando divergência
  por UTC ou fuso do dispositivo.
- A data de nascimento não pode aparecer em listagens públicas, cards,
  notificações, logs ou respostas de denúncias.
- O campo deve ser protegido por controle de acesso e incluído no fluxo de
  correção, exportação e eliminação do titular quando aplicável.
- Como o projeto ainda está em desenvolvimento e não possui usuários reais,
  não será necessário criar migração ou tratamento especial para contas
  antigas.
- O bloqueio por autodeclaração não é prova de identidade ou de idade. Essa
  limitação deve constar na documentação do projeto.
- Deve existir procedimento para exclusão ou revisão de contas identificadas
  posteriormente como pertencentes a menores.
- A política de privacidade deve explicar a finalidade e o prazo de retenção
  da data de nascimento, evitando coleta sem necessidade.
- O bloqueio de menores não substitui controles de minimização, segurança e
  base legal para CPF, localização, fotos e relatos.

## Critérios de aceite

- Cadastro sem data de nascimento é rejeitado pela API.
- Cadastro com data inválida ou futura é rejeitado pela API.
- Cadastro de pessoa com menos de 18 anos é rejeitado pela API.
- Cadastro no dia em que a pessoa completa 18 anos é aceito.
- O mobile informa claramente a idade mínima e apresenta erros compreensíveis.
- A data é persistida somente em área protegida do perfil do cidadão.
- A data não aparece na projeção pública do RNF-SEC-06.
- A exclusão e a anonimização do RNF-SEC-08 removem a data de nascimento.
- Os testes de API passam com backend e banco configurados.

## Decisões adotadas

1. O produto será restrito a maiores de 18 anos.
2. O campo da API será `dataNascimento`, no formato `AAAA-MM-DD`; o mobile
   apresenta `DD/MM/AAAA`.
3. A data será retida somente enquanto necessária às finalidades informadas,
   obrigações legais, prestação de contas e defesa de direitos.
4. A auditoria classificará o requisito como “Atende no controle de idade”,
   pois a verificação permanece autodeclarada.
