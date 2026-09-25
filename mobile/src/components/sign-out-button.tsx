import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';

/** Header button for the ocorrências list — the only sign-out entry point now that there's no Home screen. */
export function SignOutButton() {
  const { signOut } = useSession();

  return (
    <Pressable accessibilityRole="button" hitSlop={Spacing.two} onPress={signOut} style={styles.button}>
      <ThemedText type="link">Sair</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.three,
  },
});
