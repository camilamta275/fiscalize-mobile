import { useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
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
// Updated by AI.
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
    cpf, setCpf, rua, setRua, numero, setNumero, bairro, setBairro,
    cidade, setCidade, estado, setEstado, cep, setCep, complemento, setComplemento,
    fieldErrors,
    error,
    isSubmitting,
    didSucceed,
    submit,
  } = useRegisterViewModel();
  const theme = useTheme();
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const fillAddress = async (value: string) => {
    setIsLookingUpCep(true);
    setCepError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, '')}/json/`);
      if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) throw new Error('CEP não encontrado.');
      if (data.logradouro) setRua(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setEstado(data.uf);
    } catch (error) {
      setCepError(error instanceof Error ? error.message : 'Falha ao consultar o CEP.');
    } finally {
      setIsLookingUpCep(false);
    }
  };

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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
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

        <Field error={fieldErrors.cpf} keyboardType="numeric" label="CPF" onChangeText={setCpf} placeholder="Somente números" theme={theme} value={cpf} />
        <Field
          error={fieldErrors.cep}
          keyboardType="numeric"
          label="CEP"
          onChangeText={(value) => {
            setCep(value.replace(/\D/g, '').slice(0, 8));
            if (value.replace(/\D/g, '').length === 8) void fillAddress(value);
          }}
          placeholder="00000000"
          theme={theme}
          value={cep}
        />
        {isLookingUpCep ? <ActivityIndicator color={theme.text} /> : null}
        {cepError ? <ThemedText themeColor="textSecondary">{cepError}</ThemedText> : null}
        <Field error={fieldErrors.rua} label="Rua" onChangeText={setRua} placeholder="Nome da rua" theme={theme} value={rua} />
        <Field error={fieldErrors.numero} label="Número" onChangeText={setNumero} placeholder="Número" theme={theme} value={numero} />
        <Field error={fieldErrors.bairro} label="Bairro" onChangeText={setBairro} placeholder="Bairro" theme={theme} value={bairro} />
        <Field error={fieldErrors.cidade} label="Cidade" onChangeText={setCidade} placeholder="Cidade" theme={theme} value={cidade} />
        <Field error={fieldErrors.estado} label="Estado" onChangeText={setEstado} placeholder="UF" theme={theme} value={estado} />
        <Field label="Complemento (opcional)" onChangeText={setComplemento} placeholder="Apartamento, bloco..." theme={theme} value={complemento} />

        <Field
          error={fieldErrors.senha}
          label="Senha"
          onChangeText={setSenha}
          placeholder="Digite sua senha"
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
        <ThemedText type="small" themeColor="textSecondary">
          A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.
        </ThemedText>

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
      </ScrollView>
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
  keyboardType?: 'default' | 'email-address' | 'numeric';
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
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    gap: Spacing.three,
    justifyContent: 'flex-start',
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
