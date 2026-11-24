import { existsSync } from 'node:fs';
import path from 'node:path';

// Created by AI.
// Updated by AI.
export default () => {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '43b479a4-6ca8-4278-8cb4-760e16ef8ded';
  const updatesUrl = projectId ? `https://u.expo.dev/${projectId}` : undefined;
  // GOOGLE_SERVICES_FILE (segredo de arquivo no EAS) tem prioridade; localmente
  // usa ./google-services.json se existir (arquivo ignorado pelo git).
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_FILE ??
    (existsSync(path.join(__dirname, 'google-services.json'))
      ? './google-services.json'
      : undefined);
  const maestroDeviceId =
    process.env.MAESTRO_E2E_BUILD === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.EAS_BUILD_PROFILE !== 'production'
      ? process.env.MAESTRO_E2E_DEVICE_ID?.trim()
      : undefined;

  return {
    name: 'Fiscalize',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/images/icon.png',
    },
    android: {
      package: 'br.com.fiscalize.mobile',
      // Updated by AI.
      ...(googleServicesFile ? { googleServicesFile } : {}),
      adaptiveIcon: {
        backgroundColor: '#208AEF',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      ...(updatesUrl ? { url: updatesUrl } : {}),
    },
    // Updated by AI.
    extra: {
      eas: {
        ...(projectId ? { projectId } : {}),
      },
      ...(maestroDeviceId ? { maestroE2eDeviceId: maestroDeviceId } : {}),
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#208AEF',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#208AEF',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O Fiscalize usa sua localização para preencher as coordenadas da ocorrência no momento do registro.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'O Fiscalize usa a câmera para fotografar a ocorrência no momento do registro.',
          recordAudioAndroid: false,
        },
      ],
      'expo-updates',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    platforms: ['ios', 'android'],
  };
};
