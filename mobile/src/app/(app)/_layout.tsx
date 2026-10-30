import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/**
 * Route — the layout for every screen behind sign-in. Guarded by
 * `Stack.Protected` in src/app/_layout.tsx, so this file itself doesn't need
 * to know anything about auth. Each screen renders its own `ScreenHeader`
 * instead of the native one, so the header can carry the reference's styling
 * (gradient on the dashboard, bordered card elsewhere).
 */
// Updated by AI.
export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/security" />
    </Stack>
  );
}
