import { useState } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/contexts/session-context';
import * as authService from '@/services/auth-service';

// Created by AI.
export function RightsPortalView() {
  const { usuario, setUsuario, signOut } = useSession();
  const theme = useTheme();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [cpf, setCpf] = useState(usuario?.cpf ?? '');
  const [endereco, setEndereco] = useState(usuario?.endereco ?? '');
  const [confirmationPassword, setConfirmationPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'delete' | 'anonymize' | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!usuario) return null;

  const updateProfile = async () => {
    setIsBusy(true);
    try {
      const updated = await authService.updateMe({ nome, email, cpf: cpf || null, endereco: endereco || null });
      setUsuario(updated);
      Alert.alert('Dados atualizados', 'Seus dados foram atualizados com sucesso.');
    } catch (error) {
      Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsBusy(false);
    }
  };

  const exportData = async () => {
    setIsBusy(true);
    try {
      const exported = await authService.exportMe();
      await Share.share({ message: JSON.stringify(exported, null, 2), title: 'Meus dados do Fiscalize' });
    } catch (error) {
      Alert.alert('Não foi possível exportar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsBusy(false);
    }
  };

  const requestAccountAction = (mode: 'delete' | 'anonymize') => {
    Alert.alert(
      mode === 'delete' ? 'Excluir conta' : 'Anonimizar denúncias',
      mode === 'delete'
        ? 'A exclusão é permanente e removerá sua conta e seus dados relacionados.'
        : 'Seus dados pessoais serão removidos das denúncias, que permanecerão anonimizadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => setPendingAction(mode),
        },
      ]
    );
  };

  const confirmAccountAction = async () => {
    if (!pendingAction || !confirmationPassword) return;
    setIsBusy(true);
    try {
      await authService.deleteMe(confirmationPassword, pendingAction);
      setPendingAction(null);
      setConfirmationPassword('');
      signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Solicitação não concluída', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal onRequestClose={() => setPendingAction(null)} transparent visible={pendingAction !== null}>
        <Pressable onPress={() => setPendingAction(null)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={[styles.modalCard, { backgroundColor: theme.background }]}>
            <ThemedText type="subtitle">Confirme sua senha</ThemedText>
            <ThemedText themeColor="textSecondary">
              A senha é necessária para concluir esta solicitação.
            </ThemedText>
            <TextInput
              accessibilityLabel="Senha de confirmação"
              onChangeText={setConfirmationPassword}
              secureTextEntry
              style={[styles.input, { color: theme.text }]}
              value={confirmationPassword}
            />
            <Pressable disabled={isBusy || !confirmationPassword} onPress={confirmAccountAction} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">Confirmar</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Portal de direitos do titular</ThemedText>
        <ThemedText themeColor="textSecondary">
          Consulte e mantenha atualizados os dados cadastrados na sua conta.
        </ThemedText>

        <TextInput accessibilityLabel="Nome" onChangeText={setNome} style={[styles.input, { color: theme.text }]} value={nome} />
        <TextInput accessibilityLabel="E-mail" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={[styles.input, { color: theme.text }]} value={email} />
        <TextInput accessibilityLabel="CPF" keyboardType="numeric" onChangeText={setCpf} style={[styles.input, { color: theme.text }]} value={cpf} />
        <TextInput accessibilityLabel="Endereço" onChangeText={setEndereco} style={[styles.input, { color: theme.text }]} value={endereco} />

        <Pressable disabled={isBusy} onPress={updateProfile} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">Salvar dados</ThemedText>
        </Pressable>
        <Pressable disabled={isBusy} onPress={exportData} style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Exportar meus dados</ThemedText>
        </Pressable>
        <Pressable disabled={isBusy} onPress={() => requestAccountAction('anonymize')} style={styles.dangerButton}>
          <ThemedText type="smallBold">Anonimizar meus dados nas denúncias</ThemedText>
        </Pressable>
        <Pressable disabled={isBusy} onPress={() => requestAccountAction('delete')} style={styles.dangerButton}>
          <ThemedText type="smallBold">Excluir minha conta</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, gap: Spacing.three, padding: Spacing.three },
  input: { backgroundColor: '#F0F0F3', borderRadius: Spacing.two, fontSize: 16, padding: Spacing.three },
  button: { alignItems: 'center', borderRadius: Spacing.two, padding: Spacing.three },
  dangerButton: { alignItems: 'center', backgroundColor: '#FADADD', borderRadius: Spacing.two, padding: Spacing.three },
  modalBackdrop: { alignItems: 'center', backgroundColor: '#00000088', flex: 1, justifyContent: 'center', padding: Spacing.three },
  modalCard: { borderRadius: Spacing.two, gap: Spacing.three, padding: Spacing.four, width: '100%' },
});
