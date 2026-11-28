<!-- Created by AI. -->

# Fornecedores e terceiros identificados no código

Insumo para o documento de **Gestão de fornecedores** e para as RNFs
derivadas dele. Levantamento feito durante a implementação das RNF-SEC-05, 13,
15 e 16 (ver
[IMPLEMENTACAO-RNF-SEC-05-13-14-15-16.md](Planos%20de%20implenta%C3%A7%C3%A3o/IMPLEMENTACAO-RNF-SEC-05-13-14-15-16.md)).

A lista registra apenas o que aparece no código e na configuração. Plano,
região, contrato e certificações de cada fornecedor **não** foram verificados
(TODO do responsável pelo documento).

| Fornecedor | Uso no Fiscalize | Onde aparece | Dados que recebe |
|---|---|---|---|
| **Render** | Hospedagem e deploy do backend (web service) | `backend/README.md` (seção Deploy), `backend/package.json` (`start`) | Todo o tráfego da API; variáveis de ambiente (segredos) |
| **Provedor do banco principal** (a confirmar: Render Postgres ou externo) | PostgreSQL de produção (`DATABASE_URL`) | `backend/src/config/prisma.ts` | Todos os dados pessoais e as denúncias |
| **Neon** | Banco do ETL (`ETL_DATABASE_URL`), lido pelo dashboard | `backend/.env.example`, `backend/src/services/etlDashboardService.ts` | Dados agregados do ETL (população, clima) |
| **Resend** | Envio dos códigos OTP do 2FA por e-mail | `backend/src/services/otpService.ts`, `RESEND_API_KEY`, `OTP_EMAIL_FROM` | E-mail do usuário e código OTP |
| **Expo** | Notificações push (`exp.host`) e build do app (EAS) | `backend/src/services/notificationService.ts`, `mobile/eas.json` | Token de push do aparelho e texto da notificação |
| **GitHub** | Código (repositórios públicos), CI, GitHub Pages dos relatórios e, provisoriamente, os backups cifrados | `.github/workflows/` | Código; backups cifrados; secrets do Actions |
| **Redis** (TODO: provedor) | Cache de métricas e rate limiting | `backend/src/config/redis.ts`, `REDIS_URL` | Contadores por IP e cache de métricas |

Outros terceiros encontrados durante o levantamento:

| Fornecedor | Uso | Onde aparece |
|---|---|---|
| ViaCEP | Consulta de endereço por CEP no cadastro do app | `mobile/src/services/address-service.ts` |
| Open-Meteo e IBGE | Fontes de dados públicos do ETL | `etl/src/` |
| unpkg (CDN) | Carrega o Swagger UI da página `/docs` | `backend/src/config/swagger.ts` |
| Docker Hub (imagem `postgres`) e registro npm | Dependências de build, CI e backup | Workflows e `package.json` |

## Segurança oferecida pelo Render

O backend roda em um *web service* do Render. Os itens abaixo vêm da documentação
pública do Render (<https://render.com/security> e <https://render.com/docs>) e
**precisam ser confirmados para o plano contratado** antes de serem usados como
evidência (RNF-SEC-20 e RNF-SEC-23).

| Controle | O que o Render fornece | Como o Fiscalize usa |
|---|---|---|
| HTTPS | Certificado TLS gerenciado e renovado automaticamente, com redirecionamento de HTTP para HTTPS | Atende a exigência de HTTPS em produção; o código não impõe HTTPS (lacuna L9), a plataforma faz |
| Proteção de borda | Filtragem de tráfego e mitigação de DDoS na camada de rede da plataforma | Complementa o rate limiting da aplicação (RNF-SEC-12), que não substitui WAF/CDN |
| Segredos | Variáveis de ambiente e *secret files* por serviço, fora do código | `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY` e demais credenciais (RNF-SEC-22) |
| Disponibilidade | *Health check* (`/health`), reinício automático em falha e deploy com rollback | Apoia o SLA de 99,5% (RNF-SEC-15) |
| Banco gerenciado | Render Postgres com criptografia em repouso e backups automáticos (retenção depende do plano) | Só vale se o banco de produção estiver no Render; hoje a confirmar |
| Rede privada | Comunicação interna entre serviços do mesmo workspace | Usar para banco e Redis, se hospedados no Render |
| Conformidade | Certificações SOC 2 Tipo II e ISO 27001 e DPA disponível | A anexar como evidência do RNF-SEC-20 |

O que o Render **não** substitui: a criptografia dos backups cifrados em
`ops/backup/` (AES-256, feita por nós), a validação de entradas, a autenticação
e o monitoramento de logs. O Helmet no backend define os headers de segurança
HTTP; o Render não os adiciona.

## Termos de tratamento de dados (RNF-SEC-20)

| Fornecedor | Termos / DPA | Status de verificação | Responsável |
|---|---|---|---|
| Render | DPA e página de segurança do Render (anexar link) | Não verificado | A definir |
| Neon | DPA do Neon (anexar link) | Não verificado | A definir |
| Resend | DPA do Resend (anexar link) | Não verificado | A definir |
| Expo | Termos e política de privacidade da Expo (anexar link) | Não verificado | A definir |
| GitHub | Termos do GitHub e DPA (anexar link) | Não verificado | A definir |
| Redis (provedor a confirmar) | A definir | Não verificado | A definir |

Fornecedor sem termos verificados permanece registrado como **risco aceito**
até a anexação do link e a confirmação do responsável.

## Pendências

- Confirmar onde está o PostgreSQL de produção (Render Postgres ou externo) e o provedor do Redis.
- Confirmar a região de cada serviço (transferência internacional, lacuna L7).
- Anexar os links dos DPAs e registrar o responsável por cada verificação.
