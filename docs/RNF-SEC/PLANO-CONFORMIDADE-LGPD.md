<!-- Created by AI. -->

# Plano de conformidade LGPD

**Projeto:** Fiscalize Mobile
**Escopo:** aplicativo mobile, backend, banco de dados, ETL e backups
**Versão:** 1.0
**Data:** 19/11/2026
**Documentos relacionados:** [Política de Privacidade](POLITICA-DE-PRIVACIDADE.md), [Arquitetura de autenticação e autorização](ARQUITETURA-AUTENTICACAO-AUTORIZACAO.md), [Fornecedores e terceiros](FORNECEDORES-E-TERCEIROS.md), [Requisitos de Segurança - v2](Requisitos%20de%20Segurança%20-%20v2.md), [Runbook de restauração de backup](RUNBOOK-RESTAURACAO-BACKUP.md)

## 1. Objetivo

Este plano operacionaliza a [Política de Privacidade](POLITICA-DE-PRIVACIDADE.md)
e demonstra, com evidências do código, como o Fiscalize atende aos requisitos da
Lei nº 13.709/2018 (LGPD). Ele cobre:

1. papéis e responsabilidades (controlador, operador, encarregado);
2. inventário de dados pessoais e a base legal de cada tratamento;
3. ciclo de vida e **tabela de retenção** com prazos e critérios de descarte;
4. consentimento: coleta, versionamento e evidência;
5. atendimento aos direitos do titular, incluindo prazos e canais;
6. compartilhamento com operadores e transferência internacional;
7. segurança da informação aplicada ao tratamento;
8. resposta a incidentes;
9. lacunas conhecidas e plano de ação.

> **Natureza do documento.** Os prazos da seção 6 são **propostas técnicas**
> para validação do controlador e do responsável jurídico. Onde a decisão ainda
> não foi tomada, o documento diz explicitamente “a definir”. Nenhuma linha
> descreve controle que não exista no código.

## 2. Papéis e responsabilidades

| Papel | Quem | Responsabilidade |
|---|---|---|
| **Controlador** | Fiscalize (entidade responsável pela operação) | Decidir finalidades, bases legais, prazos de retenção e atender titulares |
| **Encarregado (DPO)** | Raphael Miranda — `rrsm2@cesar.school` | Canal com titulares e ANPD, orientação interna, registro de operações |
| **Operadores** | Railway, provedor do PostgreSQL, Neon, Google (Gmail), Expo, GitHub, Redis | Tratar dados apenas conforme instrução do controlador (ver [FORNECEDORES-E-TERCEIROS.md](FORNECEDORES-E-TERCEIROS.md)) |
| **Equipe técnica** | Squad do projeto | Implementar e manter os controles descritos neste plano |

Contato de privacidade publicado na política: `rrsm2@cesar.school`.

## 3. Inventário de dados pessoais

### 3.1 Dados coletados diretamente

| Dado | Origem | Obrigatório? | Onde é armazenado |
|---|---|---|---|
| Nome completo | Cadastro | Sim | `usuario.nome` |
| E-mail | Cadastro | Sim | `usuario.email` (único) |
| Senha | Cadastro | Sim | `usuario.senha` (hash bcrypt, custo 10) |
| CPF | Cadastro | Sim | `cidadao.cpf` (único) |
| Data de nascimento | Cadastro | Sim | `cidadao.data_nascimento` |
| Endereço residencial | Cadastro | Sim | `cidadao.rua/numero/bairro/cidade/estado/cep/complemento` |
| Descrição da ocorrência | Registro de chamado | Sim | `chamado.descricao` |
| Foto da ocorrência | Câmera do aparelho | Não | Ainda **somente no aparelho** (ver lacuna L8) |
| Localização da ocorrência | GPS ou CEP | Sim | `chamado.latitude/longitude` + campos de endereço |
| Preferência de anonimização | Tela de segurança | Não | `cidadao.anonimizar_dados` |

### 3.2 Dados gerados pelo uso

| Dado | Onde | Finalidade |
|---|---|---|
| Hash do identificador do dispositivo | `usuario_dispositivo.device_hash` | Reconhecer dispositivo confiável e aplicar MFA |
| Token de push | `usuario_dispositivo.push_token` | Notificar mudança de status |
| Hash do refresh token | `refresh_token.token_hash` | Manter sessão sem guardar o token |
| Hashes de desafio e código OTP | `otp_challenge` | Segundo fator |
| Registro de consentimento | `consentimento_privacidade` | Provar aceite e versão |
| Trilha de auditoria administrativa | `audit_logs` | Prestação de contas e detecção de abuso |
| Histórico de alterações de usuário | `usuario_audit` | Rastrear mudanças de cadastro |
| Timeline do chamado | `timeline_event` | Histórico de atendimento |

### 3.3 Dados derivados e agregados

O ETL produz `chamados_por_bairro`, `chamados_populacao` e correlação com clima.
Essas tabelas são **agregadas por bairro** e não contêm identificador do autor.
Ainda assim, bairro + categoria + data podem permitir reidentificação em
recortes muito pequenos: a publicação deve usar piso mínimo de agregados.

## 4. Bases legais por tratamento

| Tratamento | Base legal proposta (LGPD art. 7) | Situação |
|---|---|---|
| Criar e manter a conta | Execução de contrato (V) | Implementado; validar com jurídico |
| Registrar e encaminhar ocorrência urbana | Execução de políticas públicas (III) ou legítimo interesse (IX) | **A definir** pelo controlador |
| Verificar idade mínima de 18 anos | Cumprimento de obrigação legal/regulatória (II) e proteção da criança e do adolescente (art. 14) | Implementado (`agePolicy.ts`) |
| Enviar notificações operacionais do chamado | Execução de contrato (V) | Implementado |
| Prevenir fraude, abuso e incidentes | Legítimo interesse (IX) | Implementado; requer teste de balanceamento documentado (L5) |
| Cumprir ordem de autoridade pública | Obrigação legal (II) | Processo manual, documentado na política |
| Produzir indicadores agregados | Legítimo interesse (IX) com anonimização (art. 12) | Implementado no ETL |
| Consentimento para finalidades opcionais | Consentimento (I) | Estrutura pronta; hoje só a política é consentida |

> O consentimento **não** é usado como base genérica. Ele é coletado no cadastro
> para a política de privacidade e serve como evidência do aceite; a base legal
> de cada tratamento deve ser confirmada na coluna acima.

## 5. Consentimento

### 5.1 Como é coletado

- A tela de cadastro exibe o checkbox de aceite e o link para o texto completo
  (`mobile/src/views/register-view.tsx`).
- O app envia `privacyPolicyVersion` junto do cadastro
  (`mobile/src/services/auth-service.ts`).
- O backend rejeita versão diferente da vigente
  (`backend/src/controllers/authController.ts` comparando com
  `PRIVACY_POLICY_VERSION` em `backend/src/config/privacyPolicy.ts`).
- Na mesma transação do cadastro, grava o registro em
  `consentimento_privacidade` com `tipo`, `versao`, `documento`, `origem` e
  `aceito_em` (`backend/src/services/authService.ts`, `register`).
- O app mantém o texto versionado em `mobile/src/constants/privacy-policy.ts`.

### 5.2 Evidência

| Campo | Conteúdo | Uso probatório |
|---|---|---|
| `tipo` | `politica_privacidade` | Identifica o documento |
| `versao` | `1.1` | Permite saber qual texto foi aceito |
| `documento` | `POLITICA-DE-PRIVACIDADE.md` | Rastreia o arquivo |
| `origem` | Canal do aceite (ex.: `app`) | Mostra onde ocorreu |
| `aceito_em` | Timestamp com fuso | Data e hora do aceite |

O histórico é **append-only** por desenho: cada aceite gera uma nova linha, e
`@@index([usuario_id, aceito_em(sort: Desc)])` recupera o mais recente.

### 5.3 Revogação e novo consentimento

- A revogação de consentimentos opcionais ainda **não tem tela dedicada**
  (lacuna L6). A exclusão/anonimização da conta é o caminho disponível hoje.
- Quando a política muda de versão, o cadastro novo usa a versão nova, mas
  **não existe fluxo de reconsentimento para usuários já cadastrados**
  (lacuna L6). O texto da política (seção 9) prevê esse pedido; falta
  implementar.

## 6. Retenção e descarte

Prazos propostos, alinhados à política (seção 5) e às necessidades de prestação
de contas. **Todos exigem validação do controlador.**

| Dado | Tabela | Prazo proposto | Critério de descarte | Situação no código |
|---|---|---|---|---|
| Conta ativa | `usuario`, `cidadao` | Enquanto a conta existir | Exclusão ou anonimização pelo titular | Implementado |
| Conta excluída (modo `delete`) | `usuario` e dependentes | Imediato | `DELETE` em transação | Implementado — mas apaga também os chamados por cascata (L1) |
| Conta anonimizada (modo `anonymize`) | `usuario`, `cidadao` | Imediato para dados identificáveis | Substitui nome/e-mail/senha e zera CPF, nascimento e endereço | Implementado |
| Chamados | `chamado` | 5 anos após o encerramento | Expurgo ou anonimização do vínculo | **Sem rotina automática** (L2) |
| Refresh tokens | `refresh_token` | 30 dias (ou revogação) | Expiração natural | **Sem expurgo automático** (L3) |
| Desafios OTP | `otp_challenge` | 5 minutos de validade | Expiração | **Sem expurgo automático** (L3) |
| Dispositivos | `usuario_dispositivo` | Enquanto a conta existir | Exclusão da conta | Implementado por cascata |
| Consentimentos | `consentimento_privacidade` | 5 anos após o fim da relação | Expurgo | Sem rotina; manter para prova |
| Auditoria administrativa | `audit_logs` | 1 ano | Expurgo | Sem rotina (L2) |
| Histórico de usuário | `usuario_audit` | 1 ano | Expurgo | Sem rotina (L2) |
| Backups cifrados | Artefato do GitHub Actions | 30 dias | `retention-days: 30` | Implementado (`.github/workflows/backup.yml`) |
| Métricas agregadas | `metrics_snapshot`, Neon | Indefinido (dado agregado) | — | Implementado |

> **Ponto de atenção jurídica (L1).** `chamado.cidadaoid` tem
> `onDelete: Cascade`. Excluir a conta apaga as ocorrências registradas por ela,
> o que conflita com a prestação de contas do serviço público. A recomendação é
> que a exclusão faça *soft delete* + anonimização do vínculo, preservando o
> chamado sem o autor identificável.

## 7. Direitos do titular

### 7.1 Catálogo de direitos e como são atendidos

| Direito (art. 18) | Implementação | Rota / tela | Situação |
|---|---|---|---|
| Confirmação de tratamento | `GET /auth/me` e perfil no app | `/profile` | Implementado |
| Acesso | `GET /auth/me`, detalhe de chamados | `/profile`, `/demands/:id` | Implementado |
| Correção | `PUT /auth/me` | `/profile/edit` | Implementado |
| Portabilidade | `GET/POST /auth/me/export` (JSON) | API; **sem botão no app** | Parcial (L4) |
| Informação sobre compartilhamento | Política de privacidade, seção 4 | Documento | Implementado |
| Anonimização | `PATCH /auth/me/anonymization` + modo `anonymize` | `/profile/security` | Implementado |
| Bloqueio | Desativação de usuário pelo Admin (`status`) | `/admin/users` | Parcial (não é autoatendimento) |
| Eliminação | `DELETE /auth/me` com senha + OTP | `/profile/security` | Implementado (ver L1) |
| Revogação de consentimento | Sem tela dedicada | — | Ausente (L6) |
| Oposição | Canal por e-mail | `rrsm2@cesar.school` | Manual |

### 7.2 Proteção do canal de atendimento

Toda operação sensível exige **senha + OTP de ação crítica**:

1. `POST /auth/2fa/request-critical` com a ação (`export`, `delete`,
   `anonymization`, `password`);
2. código de 6 dígitos por e-mail, válido por 5 minutos;
3. `verificationToken` de uso único enviado junto da operação.

Isso impede que alguém com um token de sessão roubado exclua a conta ou exporte
dados sem o segundo fator. Detalhes em
[ARQUITETURA-AUTENTICACAO-AUTORIZACAO.md](ARQUITETURA-AUTENTICACAO-AUTORIZACAO.md),
seção 4.6.

### 7.3 Prazos de resposta

| Etapa | Prazo proposto |
|---|---|
| Confirmação de recebimento | 2 dias úteis |
| Resposta a acesso/correção | 15 dias corridos |
| Eliminação/anonimização | 15 dias corridos, ressalvadas guardas legais |
| Recurso do titular | 10 dias corridos |

Os prazos são operacionais e podem ser ajustados pelo controlador; o canal é o
e-mail publicado na política e o portal de direitos dentro do app
(`mobile/src/views/rights-portal-view.tsx`).

## 8. Compartilhamento e transferência internacional

| Operador | Dados | Finalidade | Salvaguarda |
|---|---|---|---|
| Railway | Tráfego da API e segredos | Hospedagem | Contrato a formalizar |
| Provedor do PostgreSQL | Todos os dados pessoais | Persistência | Contrato a formalizar |
| Neon | Agregados do ETL | Dashboard analítico | Contrato a formalizar |
| Google (Gmail SMTP) | E-mail e código OTP | Segundo fator | Contrato do Google |
| Expo | Token de push e texto da notificação | Notificação | Contrato a formalizar |
| GitHub | Código, backups cifrados, relatórios | CI/CD | Backup é cifrado em AES-256 |
| ViaCEP | CEP informado | Preenchimento de endereço | Serviço público |
| Redis | Contadores de rate limit | Segurança | Sem dado pessoal direto |

**Transferência internacional (art. 33):** Railway, Neon, Expo e GitHub podem
processar dados fora do Brasil. A região de cada serviço **não foi verificada**
(lacuna L7). É necessário confirmar a região, formalizar cláusulas contratuais
e registrá-las no relatório de impacto quando houver dados pessoais.

## 9. Segurança aplicada ao tratamento

| Controle | Evidência |
|---|---|
| Senha com hash bcrypt custo 10 | `backend/src/services/authService.ts` |
| Bloqueio após 5 falhas por 15 minutos | `authService.login` |
| JWT de 30 minutos + refresh de 30 dias com rotação | `authService.refresh` |
| Detecção de reuso de refresh token | revoga a família de tokens |
| MFA por OTP para dispositivo novo e ações críticas | `otpService.ts`, `authService.consumeMfaVerification` |
| Rate limiting por rota e por IP | `rateLimitMiddleware.ts` |
| Token no app em `expo-secure-store` | `mobile/src/hooks/use-storage-state.ts` |
| Autorização por papel, órgão e propriedade | `requireRole.ts`, `demandService.ts` |
| Projeção pública anonimizada | `demandService.listPublic` |
| Backups cifrados AES-256 com checksum | `ops/backup/`, `backup.yml` |
| Auditoria de ações administrativas | `auditLogService.ts` |
| HTTPS em produção | Exigido na operação (Railway); não imposto no código (L9) |

## 10. Resposta a incidentes

1. **Detecção** — alertas de erro, revisão de `audit_logs` e monitoramento do
   provedor.
2. **Contenção** — revogar refresh tokens do usuário afetado, desativar contas
   suspeitas, rotacionar segredos (`JWT_SECRET`, credenciais de banco).
3. **Avaliação** — classificar risco ou dano relevante aos titulares.
4. **Comunicação** — titular e ANPD em até **3 dias úteis** quando houver risco
   relevante (Resolução CD/ANPD nº 15/2024), com descrição do incidente, dados
   afetados, medidas e recomendações.
5. **Registro** — manter o registro do incidente com cronologia, causa e ações.
6. **Pós-incidente** — revisar controles e atualizar este plano.

Runbook técnico de recuperação: [RUNBOOK-RESTAURACAO-BACKUP.md](RUNBOOK-RESTAURACAO-BACKUP.md).

## 11. Lacunas e plano de ação

| ID | Lacuna | Risco LGPD | Ação recomendada | Prioridade |
|---|---|---|---|---|
| L1 | Exclusão de conta apaga chamados por cascata | Perda de prestação de contas | Trocar cascata por *soft delete* + anonimização do vínculo | Alta |
| L2 | Sem rotina de expurgo de chamados, auditoria e histórico | Retenção além do necessário (art. 15/16) | Job agendado com prazos aprovados | Alta |
| L3 | Sem expurgo de refresh tokens e OTP expirados | Acúmulo de dados desnecessários | Job diário de limpeza | Média |
| L4 | Exportação de dados só via API | Portabilidade pouco acessível (art. 18, V) | Botão no portal de direitos com download/ compartilhamento | Média |
| L5 | Base legal do registro de ocorrência não decidida | Tratamento sem base documentada | Decisão formal do controlador + registro no ROPA | Alta |
| L6 | Sem reconsentimento nem revogação de consentimento na UI | Consentimento desatualizado | Tela de consentimentos + fluxo de nova versão | Média |
| L7 | Região dos operadores não verificada | Transferência internacional sem salvaguarda | Confirmar região e cláusulas contratuais | Alta |
| L8 | Foto da ocorrência não é enviada nem tratada | Escopo da política cita fotos que o sistema não guarda | Implementar upload com retenção definida ou corrigir a política | Média |
| L9 | HTTPS não é imposto pelo código | Interceptação em trânsito | Configurar redirecionamento/HSTS no provedor e documentar | Alta |
| L10 | Sem ROPA (registro das operações de tratamento) | Falta de documentação exigível | Criar ROPA a partir das seções 3 e 4 | Média |
| L11 | Sem relatório de impacto (RIPD) | Ausência de avaliação para dados sensíveis/alta escala | Avaliar necessidade e produzir RIPD | Média |

## 12. Checklist de conformidade

| Requisito | Situação |
|---|---|
| Base legal identificada para cada tratamento | 🟡 Parcial (seção 4; uma pendente) |
| Finalidade e necessidade documentadas | ✅ |
| Transparência (política acessível e versionada) | ✅ |
| Consentimento com evidência | ✅ |
| Revogação de consentimento | ❌ |
| Atendimento aos direitos do titular | 🟡 Parcial (exportação sem UI) |
| Segurança técnica e administrativa | ✅ |
| Registro de operações (ROPA) | ❌ |
| Política de retenção e descarte | 🟡 Definida, sem execução automática |
| Gestão de incidentes | ✅ (processo documentado) |
| Encarregado designado e canal publicado | ✅ |
| Transferência internacional regulada | ❌ (não verificada) |
| Relatório de impacto (RIPD) | ❌ (a avaliar) |

## 13. Referências de código

- `backend/src/services/authService.ts` — cadastro, login, refresh, exportação, exclusão e anonimização
- `backend/src/controllers/authController.ts` — validação da versão da política
- `backend/src/config/privacyPolicy.ts` — versão e documento vigentes
- `backend/src/services/otpService.ts` — segundo fator
- `backend/src/services/auditLogService.ts` — trilha administrativa
- `backend/prisma/schema.prisma` — tabelas de dados pessoais
- `mobile/src/views/register-view.tsx` — consentimento no cadastro
- `mobile/src/views/rights-portal-view.tsx` — portal de direitos
- `mobile/src/views/profile-security-view.tsx` — anonimização e exclusão
- `mobile/src/constants/privacy-policy.ts` — texto versionado no app
- `ops/backup/` e `.github/workflows/backup.yml` — backup cifrado e retenção

## 14. Histórico

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 19/11/2026 | Consolidação do plano de conformidade, tabela de retenção, direitos do titular e lacunas. |
