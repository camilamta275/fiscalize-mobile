import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLoginViewModel } from '@/viewmodels/use-login-view-model';

/**
 * View — the sign-in screen. Holds no state and performs no I/O of its own;
 * everything it shows comes from the ViewModel.
 */
export function LoginView() {
  const { email, setEmail, senha, setSenha, fieldErrors, error, isSubmitting, submit } =
    useLoginViewModel();
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Fiscalize</ThemedText>
        <ThemedText themeColor="textSecondary">
          Sistema integrado de gestão urbana de Pernambuco
        </ThemedText>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={email}
          />
          {fieldErrors.email ? (
            <ThemedText themeColor="textSecondary" type="small">
              {fieldErrors.email}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.field}>
          <ThemedText type="smallBold">Senha</ThemedText>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setSenha}
            placeholder="Sua senha"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            value={senha}
          />
          {fieldErrors.senha ? (
            <ThemedText themeColor="textSecondary" type="small">
              {fieldErrors.senha}
            </ThemedText>
          ) : null}
        </ThemedView>

        {error ? (
          <ThemedText style={styles.feedback} themeColor="textSecondary">
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={submit}
          style={[
            styles.button,
            { backgroundColor: theme.backgroundSelected },
            isSubmitting && styles.buttonDisabled,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <ThemedText type="smallBold">Entrar</ThemedText>
          )}
        </Pressable>

        <Link href="/register" style={styles.link}>
          <ThemedText type="linkPrimary">Não tem conta? Criar conta</ThemedText>
        </Link>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    width: '100%',
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  feedback: {
    marginTop: Spacing.one,
  },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.one,
  },
});
