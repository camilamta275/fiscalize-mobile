<!-- Updated by AI. -->

# Fiscalize Mobile

Aplicativo Expo/React Native com NativeWind e GlueStack UI para estilização e
componentes reutilizáveis.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Gerar builds

O caminho principal de entrega é o EAS Build. O perfil `preview` gera um **APK
Android instalável**; o `production` gera o binário de loja.

Pré-requisitos: Node 20+, `npm install`, conta Expo e sessão iniciada
(`npx eas login`) ou `EXPO_TOKEN` exportado.

| Perfil (`eas.json`) | Distribuição | Saída |
|---|---|---|
| `development` | Interna, com `developmentClient` | Dev client |
| `preview` | Interna | APK Android / simulador iOS |
| `production` | Loja | AAB Android / IPA iOS |

```bash
cd mobile
npm install
npx eas login            # ou: export EXPO_TOKEN=...
npx eas whoami

# APK Android para teste interno
npx eas build --platform android --profile preview

# Produção (AAB Android e IPA iOS)
npx eas build --platform android --profile production
npx eas build --platform ios --profile production

# Development client
npx eas build --platform android --profile development
```

Por padrão o app usa a API publicada em `https://fiscalize-backend.onrender.com`
(valor embutido no bundle por `mobile/src/services/api-client.ts`). Para
apontar para outra instância — inclusive a local — defina
`EXPO_PUBLIC_API_BASE_URL` **no momento do build**, porque a URL fica embutida
no bundle:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npx eas build --platform android --profile preview
```

### Build local (sem EAS)

Requer Android SDK e JDK 21:

```bash
cd mobile
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# saída: android/app/build/outputs/apk/release/app-release.apk
```

Para debug rápido no emulador/dispositivo: `npx expo run:android`.

### Build na CI

- `.github/workflows/e2e.yml` — `expo prebuild` + `gradlew assembleRelease`,
  instala o APK no emulador e roda os fluxos Maestro.
- `.github/workflows/regressao.yml` — unidade, API e smoke a cada push/PR.

### Limitações

- Build iOS exige credenciais Apple (conta Apple Developer).
- Push real exige `EXPO_ACCESS_TOKEN` configurado no backend.
- Actualizações OTA usam `EXPO_PUBLIC_EAS_PROJECT_ID` (ver seção abaixo).

### Notificações push no Android

O Firebase precisa de um arquivo de configuração para o pacote Android
`br.com.fiscalize.mobile`:

1. Registre esse package name como um app Android no projeto Firebase.
2. Baixe o `google-services.json` e coloque-o em `mobile/google-services.json`.
   O arquivo é local e está ignorado pelo Git; não o publique nem o cole no chat.
3. Configure `GOOGLE_SERVICES_FILE=./google-services.json` ao compilar. O
   `app.config.ts` usa esse caminho na configuração nativa:

   ```bash
   cd mobile
   GOOGLE_SERVICES_FILE=./google-services.json npx expo run:android
   ```

4. Para builds EAS, cadastre `GOOGLE_SERVICES_FILE` como variável de arquivo
   protegida no projeto EAS.
5. Para envio remoto pelo Expo Push Service, configure também as credenciais FCM
   v1 do projeto Expo/EAS conforme o [guia de credenciais FCM](https://docs.expo.dev/push-notifications/fcm-credentials/).

## Atualizações e funcionamento offline

O app usa `expo-updates` com runtime baseado na versão do aplicativo. Para
builds EAS, configure `EXPO_PUBLIC_EAS_PROJECT_ID` com o ID do projeto Expo;
os perfis `development`, `preview` e `production` usam canais homônimos.

```bash
set EXPO_PUBLIC_EAS_PROJECT_ID=seu-project-id
npx eas update --channel preview --message "Atualização do app"
```

O token e o refresh token permanecem no `SecureStore`. A última lista e os
detalhes de demandas são persistidos no `AsyncStorage`, isolados por usuário.
Sem rede, o app mantém a sessão e exibe a última consulta disponível; criação,
edição, exclusão e alterações de status continuam exigindo conexão.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
