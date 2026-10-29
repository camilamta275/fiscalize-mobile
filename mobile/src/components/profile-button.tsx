import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
// Updated by AI.
export function ProfileButton({ onGradient = false }: { onGradient?: boolean }) {
  const { usuario } = useSession();
  const theme = useTheme();
  const initial = usuario?.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      accessibilityLabel="Abrir perfil"
      accessibilityRole="button"
      onPress={() => router.push('/profile')}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: onGradient ? 'rgba(255,255,255,0.18)' : theme.card,
          borderColor: onGradient ? 'rgba(255,255,255,0.35)' : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        style={{ color: onGradient ? theme.primaryForeground : theme.primary }}
        type="smallBold">
        {initial}
      </ThemedText>
    </Pressable>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressed: {
    opacity: 0.7,
  },
});
