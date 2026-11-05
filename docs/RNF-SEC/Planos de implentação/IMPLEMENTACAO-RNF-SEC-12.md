# Plano de implementação — RNF-SEC-12

## Status

Implementação do controle de rate limiting da aplicação concluída no backend,
com testes de API adicionados. A proteção anti-DDoS externa continua
dependente de evidências do provedor de hospedagem.

## Objetivo

Implementar limitação de requisições no backend e documentar a proteção
complementar contra ataques DDoS na infraestrutura.

## 1. Definir políticas de limite

| Escopo | Limite | Aplicação |
|---|---:|---|
| Rotas gerais | 100 requisições/minuto/IP | Middleware global |
| Login, cadastro e refresh | 10 requisições/minuto/IP | Rotas de autenticação |
| Verificação e solicitação de OTP | 5 requisições/minuto/IP | Rotas MFA |
| Submissão de denúncia | 10 requisições/minuto/IP | `POST /demands` |
| Excesso | HTTP 429 | Todas as políticas |

Os limites devem ser configuráveis por variáveis de ambiente, sem exigir
alteração de código entre ambientes.

## 2. Adicionar rate limiting no backend

Criar um middleware dedicado, por exemplo:

```text
backend/src/middlewares/rateLimitMiddleware.ts
```

Implementação recomendada:

- utilizar `express-rate-limit` com Redis como armazenamento compartilhado;
- permitir fallback em memória somente em desenvolvimento e testes;
- retornar mensagem padronizada para HTTP 429;
- retornar o header `Retry-After`;
- retornar headers de limite e de requisições restantes;
- registrar eventos sem tokens, senhas ou dados pessoais;
- definir comportamento explícito quando o Redis estiver indisponível;
- não desativar silenciosamente a proteção em produção.

O cliente Redis existente em `backend/src/config/redis.ts` deve ser
reutilizado.

## 3. Configurar o IP real do cliente

Configurar `trust proxy` em `backend/src/server.ts`, considerando o proxy do
ambiente de produção.

A configuração deve:

- reconhecer somente proxies confiáveis;
- evitar confiar cegamente em qualquer header `X-Forwarded-For`;
- garantir que o limite seja aplicado por IP de origem;
- permitir configuração distinta entre desenvolvimento, testes e produção.

## 4. Aplicar os middlewares nas rotas

No servidor:

- aplicar o limite geral antes das rotas da API;
- decidir uma política própria para `/health`, `/docs` e `/docs.json`;
- proteger as rotas críticas com limites específicos.

Em `backend/src/routes/authRoutes.ts`, limitar:

- `/register`;
- `/login`;
- `/refresh`;
- `/2fa/verify`;
- `/2fa/request-critical`.

Em `backend/src/routes/demandRoutes.ts`, aplicar limite específico somente ao
`POST /`, mantendo as rotas de leitura sujeitas ao limite geral.

## 5. Atualizar dependências e configuração

Adicionar as bibliotecas escolhidas a `backend/package.json` e atualizar o
lockfile.

Adicionar ao `.env.example` variáveis equivalentes a:

```text
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=60000
RATE_LIMIT_OTP_MAX=5
RATE_LIMIT_DEMAND_MAX=10
RATE_LIMIT_REDIS_REQUIRED=true
```

Não incluir credenciais reais do Redis.

## 6. Criar testes automatizados

Adicionar testes de API no padrão existente em
`automation/tests/api`, cobrindo:

1. requisição abaixo do limite retorna normalmente;
2. requisição acima do limite retorna `429`;
3. limite geral é independente do limite de autenticação;
4. login possui limite mais restritivo;
5. submissão de denúncia possui limite específico;
6. `Retry-After` é retornado;
7. diferentes IPs possuem contadores independentes;
8. a identificação do IP respeita a configuração de proxy confiável;
9. Redis indisponível segue a política definida, quando o ambiente de teste
   conseguir simular essa falha;
10. nenhum segredo ou dado pessoal aparece nos logs, mediante inspeção dos
    logs capturados no ambiente de teste.

Também testar a integração com a autenticação e a submissão de denúncias,
garantindo que o middleware não bloqueie indevidamente o fluxo normal do
aplicativo.

Os testes devem usar dados sintéticos e registrar o IP, rota, status e
contador observado, sem registrar senhas, tokens ou PII.

Os cenários de indisponibilidade do Redis, inspeção de logs e validação do
proxy são complementares. Se a infraestrutura de teste não permitir sua
simulação, eles devem ser registrados como limitações e comprovados por
configuração, logs sanitizados ou evidências do provedor.

## 7. Configurar proteção contra DDoS na infraestrutura

O rate limiting da aplicação não substitui a proteção contra DDoS distribuído.

Em um projeto universitário, não é necessário gerar um ataque DDoS real. A
comprovação deve ser feita por um pacote de evidências controlado:

1. **Arquitetura:** diagrama mostrando cliente, CDN/WAF ou proxy, aplicação,
   Redis e banco de dados.
2. **Configuração:** export da configuração, arquivo versionado ou captura do
   painel do provedor mostrando WAF, proteção anti-DDoS, limites de conexão e
   regras de tráfego.
3. **Observabilidade:** evidência de alertas para picos de requisições,
   bloqueios e respostas HTTP 429.
4. **Procedimento:** runbook curto com detecção, contenção, comunicação e
   recuperação de um incidente.
5. **Proxy confiável:** configuração de `trust proxy` e explicação de como o
   IP original é obtido sem confiar cegamente em `X-Forwarded-For`.
6. **Teste seguro:** teste de carga autorizado e limitado, sem simular um
   DDoS real, demonstrando que o backend continua respondendo normalmente
   abaixo do limite e retorna 429 acima dele.

Se o projeto não tiver WAF, CDN ou proteção anti-DDoS contratada, isso deve
ser declarado explicitamente como limitação. Nesse caso, o projeto pode
comprovar o rate limiting da aplicação, mas deve classificar a proteção
anti-DDoS de infraestrutura como **não evidenciada** ou **fora do escopo**,
sem afirmar que o DDoS foi completamente mitigado.

A configuração específica do provedor deve ser validada por documentação,
export ou captura de tela identificada com ambiente e data. Código versionado
sozinho não comprova a proteção externa.

## 8. Documentar o requisito

Atualizar:

- `backend/README.md`;
- `AUDITORIA-REQUISITOS-SEGURANCA.md`;
- `USO_IA Raphael Miranda`.

A auditoria só deve classificar o requisito como **Atende** após existir
evidência de:

- limites funcionando;
- respostas HTTP 429;
- testes automatizados;
- Redis configurado em produção;
- pacote de evidências da infraestrutura.

Se a proteção anti-DDoS estiver fora do escopo, a auditoria deve classificar
o controle como **Parcial**: rate limiting da aplicação comprovado e proteção
anti-DDoS externa não evidenciada.

## Critérios de aceite

- Rotas gerais não aceitam mais de 100 requisições/minuto/IP.
- Rotas críticas respeitam limites entre 5 e 10 requisições/minuto/IP.
- Excesso sempre retorna HTTP 429.
- O controle funciona entre múltiplas instâncias do backend usando Redis.
- O IP do cliente é identificado corretamente atrás do proxy.
- A aplicação não registra tokens, senhas ou dados pessoais.
- Existem testes automatizados para os limites.
- A proteção anti-DDoS está comprovada por evidências do provedor, ou sua
  ausência está declarada como limitação do projeto.
- O backend continua compilando e os testes existentes permanecem aprovados.

## Ordem recomendada

1. Definir a política e as variáveis de ambiente.
2. Adicionar as dependências.
3. Criar o middleware e a integração com Redis.
4. Configurar `trust proxy`.
5. Aplicar os limites nas rotas.
6. Criar os testes.
7. Validar build e suíte de testes.
8. Configurar a proteção no provedor.
9. Atualizar a documentação e a auditoria.
