# Plano de implementação — RNF-SEC-07

## Objetivo

Implementar consentimento explícito e transparência antes da criação de uma
conta no Fiscalize Mobile, mantendo prova auditável do aceite e permitindo que
o titular consulte a política apresentada.

Esta etapa foi aprovada e implementada após a aprovação da política pelo
responsável pelo projeto. A política continua sendo um documento acadêmico e
deve ser revisada antes de qualquer uso fora do escopo universitário.

## Documentos envolvidos

- [`POLITICA-DE-PRIVACIDADE.md`](./POLITICA-DE-PRIVACIDADE.md): texto da
  política, versão e histórico.
- [`AUDITORIA-REQUISITOS-SEGURANCA.md`](./AUDITORIA-REQUISITOS-SEGURANCA.md):
  status e evidências do requisito.
- [`USO_IA/Raphael-Miranda.md`](./USO_IA/Raphael-Miranda.md): registro desta
  atividade de documentação.

## Arquivos que serão atualizados ou criados

### Mobile

- `mobile/src/views/register-view.tsx`
  - adicionar checkbox desmarcado por padrão;
  - exibir texto claro com link para abrir a política;
  - abrir modal com título, versão, conteúdo legível, rolagem, fechar e
    indicação de que o aceite é obrigatório;
  - impedir o envio quando o aceite não estiver marcado;
  - manter acessibilidade, contraste, foco lógico e suporte a leitor de tela.
- `mobile/src/viewmodels/use-register-view-model.ts`
  - controlar `privacyPolicyAccepted`;
  - validar o aceite junto aos demais campos;
  - enviar somente a versão aprovada, não uma data fornecida pelo cliente;
  - expor erro específico e não genérico para o consentimento.
- `mobile/src/services/auth-service.ts`
  - ampliar o contrato de cadastro com o identificador da versão aceita.
- `mobile/src/components/` ou `mobile/src/components/ui/`
  - reutilizar componentes existentes; criar um componente de checkbox/modal
    somente se não houver componente equivalente.
- `mobile/src/constants/`
  - centralizar a versão publicada e o conteúdo/metadados exibidos, evitando
    divergência entre o texto do modal e o payload.

### Backend

- `backend/prisma/schema.prisma`
  - criar registro de consentimento associado ao usuário, com versão, tipo,
    data gerada pelo servidor, origem e referência do documento;
  - preservar registros históricos, sem sobrescrever aceite anterior.
- `backend/prisma/migrations/`
  - criar migração versionada para a estrutura de consentimento.
- `backend/src/controllers/authController.ts`
  - aceitar e validar o tipo/versão de política permitido;
  - rejeitar cadastro sem consentimento válido.
- `backend/src/services/authService.ts`
  - gravar o consentimento na mesma transação da criação da conta;
  - não confiar em `acceptedAt` enviado pelo cliente;
  - impedir versões desconhecidas ou obsoletas.
- `backend/src/config/` ou módulo de configuração equivalente
  - definir a versão vigente do documento e sua origem oficial.
- `backend/src/config/swagger.ts`
  - documentar o campo obrigatório e as respostas de validação.

### Testes e documentação

- testes de API em `automation/tests/api/tests/test_privacy_consent.py` para
  ausência, versão inválida e persistência do aceite válido;
- testes do view model para bloqueio sem aceite e envio da versão correta;
- teste visual/manual do modal em Android e iOS, incluindo leitor de tela;
- atualização da auditoria somente com evidência implementada e validada.

## Ajuste posterior — filtros da tela principal

Em 05/11/2026, a tela principal foi alinhada ao dashboard de referência
`citycare-routing-hub-main`: busca por protocolo/endereço, seleção de status,
seleção de órgão e ordenação por recentes, antigos, prazo ou prioridade. O
backend passou a aplicar esses filtros antes da paginação e a fornecer os
órgãos disponíveis ao cidadão.

## Fluxo proposto

1. O cadastro mostra a versão vigente e um link “Política de Privacidade”.
2. O usuário abre o modal e pode ler o documento sem perder os dados
   preenchidos.
3. O checkbox começa desmarcado e não pode ser marcado automaticamente.
4. O botão “Criar conta” permanece bloqueado ou apresenta validação explícita
   enquanto o aceite não existir.
5. O mobile envia `privacyPolicyVersion`; a data do aceite é definida pelo
   backend.
6. O backend valida a versão publicada e grava o consentimento em transação
   com a conta.
7. Uma falha de persistência não cria conta parcialmente.
8. O portal do titular poderá consultar a versão aceita e permitir nova decisão
   quando houver alteração que exija novo consentimento.

## Requisitos complementares obrigatórios

Além do checkbox, a implementação deve incluir:

- política final com controlador, contato, encarregado, finalidades, bases
  legais, compartilhamentos, retenção, direitos, menores e histórico;
- versão e data de vigência visíveis no modal;
- aceite afirmativo, livre, informado e inequívoco, sem checkbox pré-marcado;
- registro imutável de versão, timestamp do servidor, usuário, origem e
  referência do documento;
- rejeição server-side, pois validação apenas no app pode ser contornada;
- tratamento de nova versão, revogação quando aplicável e reconsentimento;
- não registrar senha, token ou dados pessoais desnecessários nos logs;
- acessibilidade do checkbox e do modal;
- revisão jurídica e definição do canal oficial antes de produção;
- política de retenção e procedimento para eliminação/anonimização;
- confirmação de requisitos para menores e transferências internacionais, caso
  sejam aplicáveis;
- atualização do Swagger, migração, testes e evidências de auditoria.

## Critérios de aceite

- Não é possível criar conta pelo app sem consentimento marcado.
- A API rejeita cadastro sem consentimento válido, mesmo fora do app.
- O cadastro válido cria conta e registro de consentimento atômicos.
- O registro contém a versão correta e timestamp do servidor.
- O modal mostra a mesma versão/texto aprovado e permite leitura completa.
- A política não afirma dados de controlador ou prazos ainda não definidos.
- Testes automatizados e validação manual de acessibilidade são anexados à
  evidência do requisito.

## Decisões pendentes antes de eventual publicação externa

1. Revisar juridicamente o texto da
   [`POLITICA-DE-PRIVACIDADE.md`](./POLITICA-DE-PRIVACIDADE.md) caso o sistema
   deixe de ser exclusivamente acadêmico.
2. Confirmar se Termos de Uso serão apresentados no mesmo aceite ou em aceite
   separado.
3. Definir prazos de retenção e canal oficial de privacidade.
4. Confirmar política para menores e transferências internacionais, caso sejam
   aplicáveis.
5. Aprovar o nome definitivo do campo/API e o formato do histórico de
   consentimento.
