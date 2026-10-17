import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';

/**
 * Route — the layout for every screen behind sign-in. Guarded by
 * `Stack.Protected` in src/app/_layout.tsx, so this file itself doesn't need
 * to know anything about auth. The ocorrências list is the app's only entry
 * point (no Home/tabs) — `new` and `[id]` push on top of it.
 */
// Updated by AI.
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Ocorrências',
          headerRight: () => <ProfileButton />,
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar ocorrência' }} />
      <Stack.Screen name="profile" options={{ title: 'Meus dados e privacidade' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Editar meus dados' }} />
      <Stack.Screen name="profile/security" options={{ title: 'Segurança' }} />
    </Stack>
  );
}
