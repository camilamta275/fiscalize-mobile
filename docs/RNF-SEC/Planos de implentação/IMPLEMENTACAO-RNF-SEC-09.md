# Implementação — RNF-SEC-09

## Objetivo

Solicitar localização somente quando necessária para capturar uma ocorrência,
sem rastreamento em segundo plano.

## Implementação realizada

- permissão é solicitada dentro da ação de captura;
- o app usa `requestForegroundPermissionsAsync`;
- a posição é obtida com `getCurrentPositionAsync`;
- não há watcher ou serviço de localização em background;
- `app.json` declara somente permissão de uso durante a operação.

## Fluxo

1. Usuário abre o formulário de ocorrência.
2. Aciona captura de localização.
3. App solicita permissão foreground.
4. App lê uma posição atual.
5. Coordenadas são associadas à ocorrência.
6. Nenhuma coleta contínua é iniciada.

## Evidências e validação

- `mobile/src/viewmodels/use-demand-form-view-model.ts`;
- `mobile/app.json`;
- busca por watchers e APIs de background;
- teste manual de permissão concedida, negada e revogada.

## Critérios de aceite

- permissão não é solicitada no primeiro acesso sem captura;
- recusa é tratada sem travar o aplicativo;
- não existe atualização contínua em background;
- coordenadas são coletadas somente no contexto da ocorrência.

## Status

**Atende.**
