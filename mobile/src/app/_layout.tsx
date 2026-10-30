import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

// Updated by AI.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.destructive,
        },
      }}>
      <SessionProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}

/**
 * `(app)` and `login` are mutually exclusive: `Stack.Protected` redirects to
 * whichever one's guard is true, so a signed-out user can't deep-link into
 * `(app)` and a signed-in one never sees `login`. While the session is still
 * being resolved from SecureStore neither guard is trustworthy, so this
 * renders nothing — the splash overlay is what the user sees meanwhile.
 */
// Updated by AI.
function RootNavigator() {
  const { usuario, isLoading } = useSession();

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
