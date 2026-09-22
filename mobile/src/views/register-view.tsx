import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRegisterViewModel } from '@/viewmodels/use-register-view-model';

/**
 * View — the sign-up screen. Holds no state and performs no I/O of its own;
 * everything it shows comes from the ViewModel. Registering doesn't sign the
 * user in (the backend returns no token for it), so success routes to
 * `/login` instead of falling through `Stack.Protected` like sign-in does.
 */
export function RegisterView() {
  const {
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    fieldErrors,
    error,
    isSubmitting,
    didSucceed,
    submit,
  } = useRegisterViewModel();
  const theme = useTheme();

  if (didSucceed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle">Conta criada!</ThemedText>
          <ThemedText themeColor="textSecondary">
            Agora é só entrar com o email e a senha que você acabou de cadastrar.
          </ThemedText>

          <Link href="/login" asChild>
            <Pressable
              accessibilityRole="button"
              style={StyleSheet.flatten([styles.button, { backgroundColor: theme.backgroundSelected }])}>
              <ThemedText type="smallBold">Ir para o login</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Criar conta</ThemedText>
        <ThemedText themeColor="textSecondary">
          Cadastro de cidadão — só cidadãos podem criar conta por aqui.
        </ThemedText>

        <Field
          error={fieldErrors.nome}
          label="Nome"
          onChangeText={setNome}
          placeholder="Seu nome completo"
          theme={theme}
          value={nome}
        />

        <Field
          autoCapitalize="none"
          error={fieldErrors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="seu@email.com"
          theme={theme}
          value={email}
        />

        <Field
          error={fieldErrors.senha}
          label="Senha"
          onChangeText={setSenha}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          theme={theme}
          value={senha}
        />

        <Field
          error={fieldErrors.confirmarSenha}
          label="Confirmar senha"
          onChangeText={setConfirmarSenha}
          placeholder="Repita a senha"
          secureTextEntry
          theme={theme}
          value={confirmarSenha}
        />

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
            <ThemedText type="smallBold">Criar conta</ThemedText>
          )}
        </Pressable>

        <Link href="/login" style={styles.link}>
          <ThemedText type="linkPrimary">Já tem conta? Entrar</ThemedText>
        </Link>
      </ThemedView>
    </SafeAreaView>
  );
}

function Field({
  autoCapitalize,
  error,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  theme,
  value,
}: {
  autoCapitalize?: 'none' | 'words';
  error?: string;
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  theme: ReturnType<typeof useTheme>;
  value: string;
}) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        value={value}
      />
      {error ? (
        <ThemedText themeColor="textSecondary" type="small">
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
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
