import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/contexts/session-context';

// Updated by AI.
export function RightsPortalView() {
  const { signOut } = useSession();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Perfil do usuário</ThemedText>
        <ThemedText themeColor="textSecondary">
          Gerencie seus dados, sua segurança e o acesso à sua conta.
        </ThemedText>

        <Pressable onPress={() => router.push('/profile/edit')} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Editar meus dados</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/profile/security')} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Segurança</ThemedText>
        </Pressable>
        <Pressable onPress={signOut} style={styles.dangerButton}>
          <ThemedText type="smallBold">Sair</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, gap: Spacing.three, padding: Spacing.three },
  button: { alignItems: 'flex-start', borderRadius: Spacing.two, padding: Spacing.three },
  dangerButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FADADD',
    borderRadius: Spacing.two,
    marginTop: 'auto',
    padding: Spacing.three,
  },
});
