import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSession } from '@/contexts/session-context';

// Created by AI.
export function ProfileButton() {
  const { usuario } = useSession();
  const initial = usuario?.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <Link href="/profile" asChild>
      <Pressable accessibilityLabel="Abrir perfil" accessibilityRole="button" style={styles.button}>
        <ThemedText type="smallBold">{initial}</ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: '#808080',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
});
