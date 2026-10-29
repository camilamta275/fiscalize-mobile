import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/contexts/session-context';

// Created by AI.
export function OtpVerificationView() {
  const { pendingMfa, verifyMfa, error } = useSession();
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pendingMfa) router.replace('/login');
  }, [pendingMfa]);

  const submit = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await verifyMfa(code);
    } catch {
      // The session context exposes the translated error.
    } finally {
      setBusy(false);
    }
  };

  if (!pendingMfa) return null;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Verificação de segurança</ThemedText>
        <ThemedText themeColor="textSecondary">
          Enviamos um código temporário para {pendingMfa.destination}. O código expira em 5 minutos.
        </ThemedText>
        <TextInput
          autoFocus
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
          placeholder="000000"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          textAlign="center"
          value={code}
        />
        {error ? <ThemedText themeColor="textSecondary">{error}</ThemedText> : null}
        <Pressable
          disabled={busy || code.length !== 6}
          onPress={() => void submit()}
          style={[styles.button, { backgroundColor: theme.backgroundSelected }, (busy || code.length !== 6) && styles.disabled]}>
          {busy ? <ActivityIndicator color={theme.text} /> : <ThemedText type="smallBold">Validar código</ThemedText>}
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    width: '100%',
  },
  input: { borderRadius: Spacing.two, fontSize: 28, padding: Spacing.three },
  button: { alignItems: 'center', borderRadius: Spacing.three, paddingVertical: Spacing.three },
  disabled: { opacity: 0.5 },
});
