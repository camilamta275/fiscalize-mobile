import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientView } from '@/components/ui/gradient-view';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { TextField } from '@/components/ui/text-field';
import { Icons } from '@/constants/icons';
import { Gradients, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
export function OtpVerificationView() {
  const { pendingMfa, verifyMfa, signOut, error } = useSession();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pendingMfa) router.replace('/login');
  }, [pendingMfa]);

  const submit = useCallback(async () => {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await verifyMfa(code);
    } catch {
      // The session context exposes the translated error.
    } finally {
      setBusy(false);
    }
  }, [code, verifyMfa]);

  if (!pendingMfa) return null;

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
            <Card style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
                <Icon color={theme.primary} name={Icons.shield} size={28} />
              </View>

              <View style={styles.copy}>
                <ThemedText style={styles.centered} type="heading">
                  Verificação de segurança
                </ThemedText>
                <ThemedText style={styles.centered} themeColor="mutedForeground" type="small">
                  Enviamos um código de seis dígitos para {pendingMfa.destination}. Ele expira em 5
                  minutos.
                </ThemedText>
              </View>

              <TextField
                autoFocus
                keyboardType="number-pad"
                label="Código de verificação"
                maxLength={6}
                onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
                placeholder="000000"
                style={styles.codeInput}
                textAlign="center"
                value={code}
              />

              {error ? <InlineMessage message={error} /> : null}

              <Button
                disabled={code.length !== 6}
                icon={Icons.check}
                loading={busy}
                onPress={() => void submit()}
                title="Validar código"
              />

              <Button
                onPress={() => {
                  signOut();
                  router.replace('/login');
                }}
                title="Usar outra conta"
                variant="ghost"
              />
            </Card>

            <ThemedText style={styles.centered} themeColor="mutedForeground" type="caption">
              Nunca compartilhe este código com ninguém.
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Created by AI.
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
  card: {
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: 420,
    padding: Spacing.four,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  copy: {
    gap: Spacing.one,
  },
  centered: {
    textAlign: 'center',
  },
  codeInput: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 10,
  },
});
