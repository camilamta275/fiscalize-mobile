import { Link } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientView } from '@/components/ui/gradient-view';
import { InlineMessage } from '@/components/ui/inline-message';
import { TextField } from '@/components/ui/text-field';
import { Icons } from '@/constants/icons';
import { Gradients, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLoginViewModel } from '@/viewmodels/use-login-view-model';

/**
 * View — the sign-in screen. Holds no state and performs no I/O of its own;
 * everything it shows comes from the ViewModel.
 */
// Updated by AI.
export function LoginView() {
  const { email, setEmail, senha, setSenha, fieldErrors, error, isSubmitting, submit } =
    useLoginViewModel();
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <GradientView colors={Gradients.gov} style={styles.wash} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText style={styles.centered} type="title">
                Fiscalize
              </ThemedText>
              <ThemedText style={styles.centered} themeColor="mutedForeground" type="small">
                Sistema integrado de gestão urbana de Pernambuco
              </ThemedText>
            </View>

            <Card style={styles.card}>
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                error={fieldErrors.email}
                keyboardType="email-address"
                label="E-mail"
                onChangeText={setEmail}
                placeholder="seu@email.com"
                value={email}
              />

              <TextField
                autoCapitalize="none"
                autoComplete="password"
                error={fieldErrors.senha}
                label="Senha"
                onChangeText={setSenha}
                placeholder="••••••••"
                secureTextEntry
                value={senha}
              />

              {error ? <InlineMessage message={error} /> : null}

              <Button
                icon={Icons.arrowRight}
                loading={isSubmitting}
                onPress={submit}
                title="Entrar"
              />
            </Card>

            <View style={styles.footer}>
              <Link href="/register">
                <ThemedText type="linkPrimary">Não tem conta? Criar conta</ThemedText>
              </Link>
              <ThemedText style={styles.centered} themeColor="mutedForeground" type="caption">
                © 2026 Fiscalize
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Updated by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wash: {
    bottom: 0,
    left: 0,
    opacity: 0.06,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    gap: Spacing.four,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  centered: {
    textAlign: 'center',
  },
  card: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: 420,
    padding: Spacing.four,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: 420,
    width: '100%',
  },
});
