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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [modal, setModal] = useState<'anonymize' | 'delete' | 'change-password' | null>(null);
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

  const confirmPasswordChange = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirmation) return;
    if (newPassword !== newPasswordConfirmation) {
      Alert.alert('Não foi possível alterar a senha', 'A confirmação da nova senha não confere.');
      return;
    }
    setBusy(true);
    try {
      await authService.changePassword(currentPassword, newPassword, newPasswordConfirmation);
      Alert.alert('Senha alterada', 'Sua senha foi alterada com sucesso.');
      setModal(null);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (error) {
      Alert.alert('Não foi possível alterar a senha', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirmation('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal transparent visible={modal !== null} onRequestClose={closeModal}>
        <Pressable onPress={closeModal} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.modal, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle">{modal === 'change-password' ? 'Alterar senha' : 'Confirme sua senha'}</ThemedText>
            {modal === 'change-password' ? (
              <>
                <TextInput accessibilityLabel="Senha atual" onChangeText={setCurrentPassword} placeholder="Senha atual" placeholderTextColor={theme.textSecondary} secureTextEntry style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]} value={currentPassword} />
                <TextInput accessibilityLabel="Nova senha" onChangeText={setNewPassword} placeholder="Nova senha" placeholderTextColor={theme.textSecondary} secureTextEntry style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]} value={newPassword} />
                <TextInput accessibilityLabel="Confirme a nova senha" onChangeText={setNewPasswordConfirmation} placeholder="Confirme a nova senha" placeholderTextColor={theme.textSecondary} secureTextEntry style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]} value={newPasswordConfirmation} />
                <ThemedText type="small" themeColor="textSecondary">
                  A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText themeColor="textSecondary">A senha é necessária para {modal === 'delete' ? 'excluir a conta' : 'ativar a anonimização'}.</ThemedText>
                <TextInput accessibilityLabel="Senha de confirmação" onChangeText={setPassword} placeholder="Digite sua senha" placeholderTextColor={theme.textSecondary} secureTextEntry style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]} value={password} />
              </>
            )}
            {modal === 'change-password' ? (
              <>
                <Pressable
                  disabled={busy || !currentPassword || !newPassword || !newPasswordConfirmation}
                  onPress={() => void confirmPasswordChange()}
                  style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">Confirmar</ThemedText>
                </Pressable>
                <Pressable disabled={busy} onPress={closeModal} style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">Cancelar</ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable disabled={busy} onPress={closeModal} style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">Cancelar</ThemedText>
                </Pressable>
                <Pressable
                  disabled={busy || !password}
                  onPress={() => void (modal === 'delete' ? deleteAccount() : confirmAnonymization())}
                  style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">{modal === 'delete' ? 'Excluir conta' : 'Confirmar anonimização'}</ThemedText>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Segurança</ThemedText>
        <Pressable disabled={busy} onPress={() => setModal('change-password')} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Alterar senha</ThemedText>
        </Pressable>
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
