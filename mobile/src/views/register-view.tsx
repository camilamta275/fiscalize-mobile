import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Icons, type IconName } from '@/constants/icons';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();
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
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader subtitle="Cadastro de cidadão" title="Criar conta" />
        <View style={styles.success}>
          <View style={[styles.successIcon, { backgroundColor: theme.statusProgressBg }]}>
            <Icon color={theme.statusProgress} name={Icons.checkCircle} size={34} />
          </View>
          <ThemedText style={styles.centered} type="heading">
            Conta criada!
          </ThemedText>
          <ThemedText style={styles.centered} themeColor="mutedForeground" type="small">
            Agora é só entrar com o e-mail e a senha que você acabou de cadastrar.
          </ThemedText>
          <Button
            icon={Icons.arrowRight}
            onPress={() => router.replace('/login')}
            style={styles.successButton}
            title="Ir para o login"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={() => router.replace('/login')}
        subtitle="Cadastro de cidadão"
        title="Criar conta"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator>
          <ThemedText themeColor="mutedForeground" type="small">
            Só cidadãos podem criar conta por aqui. Os dados abaixo são usados para identificar
            você e localizar as ocorrências.
          </ThemedText>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.person} title="Dados pessoais" />
            <TextField
              error={fieldErrors.nome}
              label="Nome completo"
              onChangeText={setNome}
              placeholder="Seu nome completo"
              value={nome}
            />
            <TextField
              autoCapitalize="none"
              error={fieldErrors.email}
              keyboardType="email-address"
              label="E-mail"
              onChangeText={setEmail}
              placeholder="seu@email.com"
              value={email}
            />
            <TextField
              error={fieldErrors.cpf}
              keyboardType="numeric"
              label="CPF"
              onChangeText={setCpf}
              placeholder="Somente números"
              value={cpf}
            />
          </Card>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.mapPin} title="Endereço" />
            <TextField
              error={fieldErrors.cep}
              hint={isLookingUpCep ? 'Buscando endereço…' : cepError ?? undefined}
              keyboardType="numeric"
              label="CEP"
              maxLength={8}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, '');
                setCep(digits.slice(0, 8));
                if (digits.length === 8) void fillAddress(value);
              }}
              placeholder="00000000"
              value={cep}
            />
            <TextField
              error={fieldErrors.rua}
              label="Rua"
              onChangeText={setRua}
              placeholder="Nome da rua"
              value={rua}
            />
            <View style={styles.twoColumns}>
              <TextField
                containerStyle={styles.flex}
                error={fieldErrors.numero}
                label="Número"
                onChangeText={setNumero}
                placeholder="Nº"
                value={numero}
              />
              <TextField
                containerStyle={styles.flex}
                error={fieldErrors.bairro}
                label="Bairro"
                onChangeText={setBairro}
                placeholder="Bairro"
                value={bairro}
              />
            </View>
            <View style={styles.twoColumns}>
              <TextField
                containerStyle={styles.flex}
                error={fieldErrors.cidade}
                label="Cidade"
                onChangeText={setCidade}
                placeholder="Cidade"
                value={cidade}
              />
              <TextField
                autoCapitalize="none"
                containerStyle={styles.uf}
                error={fieldErrors.estado}
                label="UF"
                maxLength={2}
                onChangeText={setEstado}
                placeholder="PE"
                value={estado}
              />
            </View>
            <TextField
              label="Complemento (opcional)"
              onChangeText={setComplemento}
              placeholder="Apartamento, bloco..."
              value={complemento}
            />
          </Card>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.lock} title="Acesso" />
            <TextField
              autoCapitalize="none"
              error={fieldErrors.senha}
              label="Senha"
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              secureTextEntry
              value={senha}
            />
            <TextField
              autoCapitalize="none"
              error={fieldErrors.confirmarSenha}
              label="Confirmar senha"
              onChangeText={setConfirmarSenha}
              placeholder="Repita a senha"
              secureTextEntry
              value={confirmarSenha}
            />
            <ThemedText themeColor="mutedForeground" type="caption">
              A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula,
              número e caractere especial.
            </ThemedText>
          </Card>

          {error ? <InlineMessage message={error} /> : null}

          <Button
            icon={Icons.check}
            loading={isSubmitting}
            onPress={submit}
            title="Criar conta"
          />

          <Link href="/login" style={styles.link}>
            <ThemedText type="linkPrimary">Já tem conta? Entrar</ThemedText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Created by AI.
function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  const theme = useTheme();

  return (
    <View style={styles.sectionTitle}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon color={theme.primary} name={icon} size={14} />
      </View>
      <ThemedText type="subtitle">{title}</ThemedText>
    </View>
  );
}

// Updated by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    padding: Spacing.three,
    width: '100%',
  },
  card: {
    gap: Spacing.three,
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  uf: {
    width: 84,
  },
  centered: {
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.one,
  },
  success: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: 420,
    padding: Spacing.four,
    width: '100%',
  },
  successIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  successButton: {
    alignSelf: 'stretch',
  },
});
