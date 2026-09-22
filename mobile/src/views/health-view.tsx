import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import { useHealthViewModel } from '@/viewmodels/use-health-view-model';

/**
 * View — renders the backend status. Holds no state and performs no I/O of its
 * own; everything it shows comes from the ViewModel.
 */
export function HealthView() {
  const { health, isLoading, error, baseUrl, refresh } = useHealthViewModel();
  const { usuario, signOut } = useSession();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {usuario ? (
          <ThemedView style={styles.card} type="backgroundElement">
            <StatusRow label="Sessão" value="Logado" />
            <StatusRow label="Nome" value={usuario.nome} />
            <StatusRow label="Perfil" value={usuario.perfil} />
          </ThemedView>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Sair</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">Status da API</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {baseUrl}
        </ThemedText>

        {isLoading ? <ActivityIndicator color={theme.text} style={styles.feedback} /> : null}

        {error ? (
          <ThemedText style={styles.feedback} themeColor="textSecondary">
            {error}
          </ThemedText>
        ) : null}

        {health ? (
          <ThemedView style={styles.card} type="backgroundElement">
            <StatusRow label="Status" value={health.status} />
            <StatusRow label="Banco de dados" value={health.database} />
            <StatusRow label="Redis" value={health.redis} />
            <StatusRow label="Ambiente" value={health.environment} />
            <StatusRow
              label="Consultado em"
              value={new Date(health.timestamp).toLocaleTimeString('pt-BR')}
            />
          </ThemedView>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={refresh}
          style={[
            styles.button,
            { backgroundColor: theme.backgroundSelected },
            isLoading && styles.buttonDisabled,
          ]}>
          <ThemedText type="smallBold">Atualizar</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.row} type="backgroundElement">
      <ThemedText themeColor="textSecondary" type="small">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    width: '100%',
  },
  feedback: {
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
