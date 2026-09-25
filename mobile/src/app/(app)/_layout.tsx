import { Stack } from 'expo-router';

import { SignOutButton } from '@/components/sign-out-button';

/**
 * Route — the layout for every screen behind sign-in. Guarded by
 * `Stack.Protected` in src/app/_layout.tsx, so this file itself doesn't need
 * to know anything about auth. The ocorrências list is the app's only entry
 * point (no Home/tabs) — `new` and `[id]` push on top of it.
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Ocorrências', headerRight: () => <SignOutButton /> }}
      />
      <Stack.Screen name="new" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar ocorrência' }} />
    </Stack>
  );
}
