import { useEffect, type PropsWithChildren } from 'react';
import { config } from './config';
import { View, type ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme } from 'nativewind';

// Created by AI.
export type ModeType = 'light' | 'dark' | 'system';

// Created by AI.
export function GluestackUIProvider({
  mode = 'light',
  children,
  style,
}: PropsWithChildren<{ mode?: ModeType; style?: ViewProps['style'] }>) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  return (
    <View
      style={[
        config[colorScheme ?? 'light'],
        { flex: 1, height: '100%', width: '100%' },
        style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
