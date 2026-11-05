# Justificativa de atendimento — RNF-SEC-12

## Objetivo

Este documento explica por que a proteção contra abuso e sobrecarga pode ser
validada sem executar um ataque DDoS real e em quais condições o RNF-SEC-12
pode ser classificado como **Atende** em um projeto universitário.

## 1. Um ataque DDoS real não é necessário para validar o controle

Um DDoS real envolve tráfego distribuído, grande volume de requisições e
possível impacto em terceiros. Executá-lo em um ambiente acadêmico seria
inseguro, poderia violar regras do provedor e não seria um teste controlado.

A ausência de um ataque real não impede a validação do mecanismo. O objetivo
do teste é verificar o comportamento definido pelo requisito:

- requisições dentro do limite continuam sendo atendidas;
- requisições acima do limite são rejeitadas;
- a resposta excedente é HTTP 429;
- os contadores são separados por IP e por política;
- os limites críticos são menores que o limite geral;
- o serviço não registra segredos ou dados pessoais;
- o Redis mantém os contadores compartilhados entre instâncias.

Esses comportamentos podem ser reproduzidos com um teste de carga autorizado,
limitado e realizado somente no ambiente do projeto. Isso valida o controle
implementado sem produzir um ataque DDoS.

## 2. O que o teste controlado comprova

Os testes de API comprovam a camada de aplicação do RNF:

1. uma requisição abaixo do limite retorna normalmente;
2. o limite geral de 100 requisições por minuto e por IP é aplicado;
3. autenticação, OTP e submissão de denúncias possuem limites específicos;
4. o excesso retorna HTTP 429;
5. `Retry-After` e os headers de limite são retornados;
6. IPs diferentes possuem contadores independentes;
7. a configuração de proxy não causa erro nem permite bypass arbitrário;
8. a indisponibilidade do Redis segue a política definida, quando simulada;
9. logs de rate limiting não expõem senha, token ou PII;
10. a autenticação e a submissão de denúncias continuam funcionando abaixo
    dos limites.

Portanto, o teste não afirma que o sistema suportaria qualquer DDoS. Ele
afirma, de forma verificável, que o backend aplica corretamente o controle de
requisições exigido pelo requisito.

## 3. Diferença entre rate limiting e proteção externa contra DDoS

O rate limiting protege a aplicação contra excesso de requisições por cliente
ou por IP. Ele é implementado no backend com `express-rate-limit` e Redis.

WAF, CDN e proteção anti-DDoS do provedor são camadas externas que atuam antes
da aplicação. Elas podem absorver, filtrar ou bloquear tráfego volumoso antes
que ele consuma os recursos do servidor.

Assim, há duas possibilidades de escopo:

### Escopo A — RNF avaliado como controle da aplicação

O requisito é interpretado como a implementação do rate limiting no backend.
Nesse escopo, o projeto pode classificar o RNF como **Atende** quando:

- os limites estão implementados;
- as rotas críticas estão protegidas;
- HTTP 429 é retornado;
- os testes de API passam;
- Redis e proxy estão configurados conforme documentado;
- não há alegação de que o projeto tenha mitigação externa completa de DDoS.

### Escopo B — RNF avaliado como proteção completa contra DDoS

O requisito inclui também WAF, CDN ou proteção anti-DDoS do provedor. Nesse
escopo, o RNF somente pode ser classificado como **Atende** após evidenciar a
configuração da infraestrutura. Sem essa evidência, a classificação correta é
**Parcial**.

## 4. Como justificar a classificação “Atende”

Para classificar o RNF como **Atende** no escopo acadêmico, a equipe deve
registrar explicitamente na auditoria que:

> O escopo verificável do RNF-SEC-12 é a proteção da camada de aplicação por
> rate limiting. A proteção externa contra DDoS é uma responsabilidade da
> infraestrutura de hospedagem e não faz parte do ambiente acadêmico
> controlado. O rate limiting foi implementado, testado por chamadas de API
> autorizadas e documentado. Não foi executado DDoS real por razões de
> segurança, ética e controle do ambiente.

Essa classificação é válida somente se o requisito original ou o critério de
avaliação permitir a delimitação de escopo. A equipe não deve afirmar que
WAF, CDN ou mitigação externa existem quando não há evidência.

## 5. Evidências recomendadas

O pacote de evidências deve conter:

- referência ao middleware de rate limiting;
- configuração dos limites e da janela;
- integração das rotas gerais e críticas;
- configuração do Redis;
- configuração de `TRUST_PROXY`;
- resultados dos testes de API;
- resposta HTTP 429 capturada;
- teste autorizado abaixo e acima do limite;
- build do backend aprovado;
- declaração de que não foi executado ataque DDoS real;
- limitação explícita sobre a infraestrutura externa.

Se houver um provedor com WAF, CDN ou proteção anti-DDoS, anexar também a
configuração ou captura do painel, com ambiente e data. Se não houver, manter
a limitação documentada.

## 6. Conclusão

É possível validar o rate limiting sem um ataque real porque o requisito
define limites e respostas observáveis, não a execução de um ataque. Testes
controlados reproduzem as condições necessárias para verificar esses
comportamentos com segurança.

O RNF pode ser classificado como **Atende** quando o escopo aprovado for o
controle de rate limiting da aplicação e essa delimitação estiver registrada.
Se o escopo exigir proteção externa efetiva contra DDoS, a ausência de
evidência de WAF, CDN ou recurso do provedor impede a classificação completa
como “Atende”, devendo permanecer **Parcial**.
