import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/contexts/session-context';
import * as authService from '@/services/auth-service';

// Created by AI.
export function ProfileSecurityView() {
  const { usuario, setUsuario, signOut } = useSession();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [modal, setModal] = useState<'anonymize' | 'delete' | null>(null);
  const [enabled, setEnabled] = useState(usuario?.anonimizar_dados ?? false);
  const [busy, setBusy] = useState(false);

  if (!usuario) return null;

  const changeAnonymization = async (value: boolean) => {
    if (value) {
      setModal('anonymize');
      return;
    }
    setBusy(true);
    try {
      await authService.setAnonymization(false);
      setEnabled(false);
      setUsuario({ ...usuario, anonimizar_dados: false });
    } catch (error) {
      Alert.alert('Não foi possível alterar a anonimização', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const confirmAnonymization = async () => {
    setBusy(true);
    try {
      await authService.setAnonymization(true, password);
      setEnabled(true);
      setUsuario({ ...usuario, anonimizar_dados: true });
      setModal(null);
      setPassword('');
    } catch (error) {
      Alert.alert('Não foi possível ativar a anonimização', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await authService.deleteMe(password, 'delete');
      signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Não foi possível excluir a conta', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
      setModal(null);
      setPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal transparent visible={modal !== null} onRequestClose={() => setModal(null)}>
        <Pressable onPress={() => setModal(null)} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.modal, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle">Confirme sua senha</ThemedText>
            <ThemedText themeColor="textSecondary">A senha é necessária para {modal === 'delete' ? 'excluir a conta' : 'ativar a anonimização'}.</ThemedText>
            <TextInput
              accessibilityLabel="Senha de confirmação"
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              value={password}
            />
            <Pressable disabled={busy} onPress={() => { setModal(null); setPassword(''); }} style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Cancelar</ThemedText>
            </Pressable>
            <Pressable disabled={busy || !password} onPress={() => void (modal === 'delete' ? deleteAccount() : confirmAnonymization())} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{modal === 'delete' ? 'Excluir conta' : 'Confirmar'}</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Segurança</ThemedText>
        <ThemedView style={styles.row}>
          <ThemedView style={styles.copy}>
            <ThemedText type="smallBold">Anonimizar dados nas denúncias</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Ao ativar, seus dados pessoais não serão associados às novas denúncias.</ThemedText>
          </ThemedView>
          <Switch disabled={busy} onValueChange={changeAnonymization} value={enabled} />
        </ThemedView>
        <Pressable disabled={busy} onPress={() => { setPassword(''); setModal('delete'); }} style={styles.dangerButton}>
          <ThemedText type="smallBold">Excluir minha conta</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { gap: Spacing.three, padding: Spacing.three },
  row: { alignItems: 'center', flexDirection: 'row', gap: Spacing.three, justifyContent: 'space-between' },
  copy: { flex: 1, gap: Spacing.one },
  button: { alignItems: 'center', borderRadius: Spacing.two, padding: Spacing.three },
  dangerButton: { alignItems: 'center', backgroundColor: '#FADADD', borderRadius: Spacing.two, padding: Spacing.three },
  backdrop: { alignItems: 'center', backgroundColor: '#00000088', flex: 1, justifyContent: 'center', padding: Spacing.three },
  modal: { borderRadius: Spacing.two, gap: Spacing.three, padding: Spacing.four, width: '100%' },
  input: { borderRadius: Spacing.two, fontSize: 16, padding: Spacing.three },
});
