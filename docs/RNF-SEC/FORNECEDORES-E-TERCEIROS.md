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
| **Railway** | Hospedagem e deploy do backend | `backend/railway.toml`, `backend/README.md` | Todo o tráfego da API; variáveis de ambiente (segredos) |
| **Provedor do banco principal** (TODO: Railway ou Neon) | PostgreSQL de produção (`DATABASE_URL`) | `backend/src/config/prisma.ts` | Todos os dados pessoais e as denúncias |
| **Neon** | Banco do ETL (`ETL_DATABASE_URL`), lido pelo dashboard | `backend/.env.example`, `backend/src/services/etlDashboardService.ts` | Dados agregados do ETL (população, clima) |
| **Google (Gmail SMTP)** | Envio dos códigos OTP do 2FA | `backend/src/services/otpService.ts` (nodemailer), `GMAIL_USER` | E-mail do usuário e código OTP |
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
