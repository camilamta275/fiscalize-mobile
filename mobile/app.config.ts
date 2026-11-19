// Created by AI.
// Updated by AI.
export default () => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const updatesUrl = projectId ? `https://u.expo.dev/${projectId}` : undefined;
  const googleServicesFile = process.env.GOOGLE_SERVICES_FILE;

  return {
    name: 'mobile',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    ios: {
      icon: './assets/expo.icon',
    },
    android: {
      package: 'br.com.fiscalize.mobile',
      // Updated by AI.
      ...(googleServicesFile ? { googleServicesFile } : {}),
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
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
    extra: {
      eas: {
        ...(projectId ? { projectId } : {}),
      },
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
