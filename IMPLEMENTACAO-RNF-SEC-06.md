# Plano e implementação — RNF-SEC-06

## Objetivo

Garantir que a exibição pública de ocorrências urbanas não exponha nome,
e-mail, CPF, endereço residencial ou qualquer outro identificador do cidadão.
A área pública deve retornar somente dados necessários para compreender e
localizar o problema: relato, categoria, foto, coordenadas e metadados
operacionais não identificáveis.

O vínculo interno entre usuário e ocorrência permanece preservado para
acompanhamento, edição autorizada, auditoria e atendimento ao RNF-SEC-08.

## Arquivos atualizados

### Backend

- `backend/src/services/demandService.ts`
  - criar projeção pública separada;
  - selecionar somente campos permitidos;
  - nunca incluir `cidadao`, `usuario`, CPF, e-mail ou endereço residencial.
- `backend/src/controllers/demandController.ts`
  - expor handler público sem autenticação.
- `backend/src/routes/demandRoutes.ts`
  - adicionar `GET /demands/public` antes da rota parametrizada.
- `backend/src/config/swagger.ts`
  - documentar o endpoint e o schema público.

### Mobile

- `mobile/src/models/demand.ts`
  - criar tipo `PublicDemand` sem campo `creator` ou dados de contato.
- `mobile/src/services/demand-service.ts`
  - adicionar cliente da projeção pública.

### Automação e evidências

- `automation/tests/api/tests/test_public_demand_privacy.py`
  - verificar que a resposta pública não contém nome, e-mail, CPF, criador ou
    endereço residencial;
  - verificar que a resposta contém relato, foto e coordenadas.
- `AUDITORIA-REQUISITOS-SEGURANCA.md`
  - atualizar o RNF-SEC-06 somente após validação do build e dos testes.
- `USO_IA/Raphael-Miranda.md`
  - registrar a atividade conforme as regras do repositório.

## Requisitos complementares obrigatórios

- A anonimização deve ocorrer na consulta/API, não apenas na interface.
- DTOs públicos e privados devem permanecer separados para evitar vazamentos
  por reutilização acidental.
- Logs, erros, exportações e notificações públicas não podem incluir dados do
  criador.
- Fotos devem ser tratadas como potencial fonte de identificação; o produto
  deve revisar rostos, documentos e placas antes de publicação externa.
- Coordenadas de locais residenciais podem permitir reidentificação. O
  controlador deve definir se a precisão será reduzida ou se haverá outra
  proteção antes de produção.
- O vínculo interno deve continuar disponível apenas para fluxos autorizados.
- O endpoint público deve receber rate limiting e monitoramento antes de
  exposição na internet.
- Testes devem fazer asserção negativa dos campos pessoais, não somente
  verificar que a tela não os apresenta.

## Critérios de aceite

- `GET /demands/public` não exige autenticação.
- A resposta pública não contém `creator`, `nome`, `email`, `cpf`, `telefone`,
  `usuario`, `cidadao` ou endereço residencial.
- A resposta contém descrição/relato, foto quando existente e latitude e
  longitude.
- A projeção pública não altera a consulta privada usada pelo titular.
- Backend compila e os testes de API são executáveis quando API e banco estão
  disponíveis.

