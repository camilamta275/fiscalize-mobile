import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Icons } from '@/constants/icons';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import * as authService from '@/services/auth-service';

// Created by AI.
type ModalKind = 'anonymize' | 'delete' | 'change-password' | null;

// Created by AI.
// Updated by AI.
export function ProfileSecurityView() {
  const { usuario, setUsuario, signOut } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaDestination, setMfaDestination] = useState('');
  const [anonymizationValue, setAnonymizationValue] = useState(true);
  const [enabled, setEnabled] = useState(usuario?.anonimizar_dados ?? false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!usuario) return null;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  const changeAnonymization = (value: boolean) => {
    setAnonymizationValue(value);
    setFeedback(null);
    setModal('anonymize');
  };

  const confirmAnonymization = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (!mfaToken) {
        const challenge = await authService.requestCriticalOtp('anonymization');
        setMfaToken(challenge.challengeToken);
        setMfaDestination(challenge.destination);
        return;
      }
      const verified = await authService.verifyCriticalOtp(mfaToken, mfaCode);
      await authService.setAnonymization(anonymizationValue, password, verified.verificationToken);
      setEnabled(anonymizationValue);
      setUsuario({ ...usuario, anonimizar_dados: anonymizationValue });
      setModal(null);
      setPassword('');
      setMfaToken(null);
      setMfaCode('');
      setMfaDestination('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (!mfaToken) {
        const challenge = await authService.requestCriticalOtp('delete');
        setMfaToken(challenge.challengeToken);
        setMfaDestination(challenge.destination);
        return;
      }
      const verified = await authService.verifyCriticalOtp(mfaToken, mfaCode);
      await authService.deleteMe(password, 'delete', verified.verificationToken);
      signOut();
      router.replace('/login');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  const confirmPasswordChange = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirmation) return;
    if (newPassword !== newPasswordConfirmation) {
      setFeedback('A confirmação da nova senha não confere.');
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      if (!mfaToken) {
        const challenge = await authService.requestCriticalOtp('password');
        setMfaToken(challenge.challengeToken);
        setMfaDestination(challenge.destination);
        return;
      }
      const verified = await authService.verifyCriticalOtp(mfaToken, mfaCode);
      await authService.changePassword(currentPassword, newPassword, newPasswordConfirmation, verified.verificationToken);
      Alert.alert('Senha alterada', 'Sua senha foi alterada com sucesso.');
      setModal(null);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
      setMfaToken(null);
      setMfaCode('');
      setMfaDestination('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setFeedback(null);
    setPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirmation('');
    setMfaToken(null);
    setMfaCode('');
    setMfaDestination('');
  };

  const isPasswordModal = modal === 'change-password';
  const confirmDisabled = isPasswordModal
    ? busy || !currentPassword || !newPassword || !newPasswordConfirmation || (!!mfaToken && mfaCode.length !== 6)
    : busy || !password || (!!mfaToken && mfaCode.length !== 6);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader onBack={goBack} subtitle="Senha e privacidade" title="Segurança" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFeedback(null);
              setModal('change-password');
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon color={theme.primary} name={Icons.lock} size={18} />
            </View>
            <View style={styles.rowCopy}>
              <ThemedText type="smallBold">Alterar senha</ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                Exige confirmação por código enviado ao seu e-mail
              </ThemedText>
            </View>
            <Icon color={theme.mutedForeground} name={Icons.chevronRight} size={18} />
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: theme.accentSoft }]}>
              <Icon color={theme.accent} name={Icons.shield} size={18} />
            </View>
            <View style={styles.rowCopy}>
              <ThemedText type="smallBold">Anonimizar dados nas denúncias</ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                Ao ativar, seus dados pessoais não serão associados às novas denúncias.
              </ThemedText>
            </View>
            <Switch
              disabled={busy}
              onValueChange={changeAnonymization}
              thumbColor={theme.card}
              trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
              value={enabled}
            />
          </View>
        </Card>

        <Card style={styles.card} tone="danger">
          <ThemedText style={{ color: theme.destructive }} type="subtitle">
            Zona de risco
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            A exclusão remove permanentemente sua conta e os dados pessoais associados. Esta ação
            não pode ser desfeita.
          </ThemedText>
          <Button
            disabled={busy}
            icon={Icons.trash}
            onPress={() => {
              setPassword('');
              setFeedback(null);
              setModal('delete');
            }}
            title="Excluir minha conta"
            variant="danger"
          />
        </Card>
      </ScrollView>

      <Modal animationType="fade" onRequestClose={closeModal} transparent visible={modal !== null}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
          <Pressable onPress={closeModal} style={StyleSheet.absoluteFill} />
          <View
            style={[
              styles.modal,
              Shadows.floating,
              { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
            ]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle} type="subtitle">
                {isPasswordModal
                  ? 'Alterar senha'
                  : modal === 'delete'
                    ? 'Excluir conta'
                    : 'Confirmar anonimização'}
              </ThemedText>
              <Pressable
                accessibilityLabel="Fechar"
                accessibilityRole="button"
                hitSlop={Spacing.two}
                onPress={closeModal}
                style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}>
                <Icon color={theme.textSecondary} name={Icons.close} size={16} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {isPasswordModal ? (
                <>
                  <TextField
                    label="Senha atual"
                    onChangeText={setCurrentPassword}
                    placeholder="Sua senha atual"
                    secureTextEntry
                    value={currentPassword}
                  />
                  <TextField
                    label="Nova senha"
                    onChangeText={setNewPassword}
                    placeholder="Nova senha"
                    secureTextEntry
                    value={newPassword}
                  />
                  <TextField
                    label="Confirmar nova senha"
                    onChangeText={setNewPasswordConfirmation}
                    placeholder="Repita a nova senha"
                    secureTextEntry
                    value={newPasswordConfirmation}
                  />
                  <ThemedText themeColor="mutedForeground" type="caption">
                    A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra
                    minúscula, número e caractere especial.
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText themeColor="mutedForeground" type="small">
                    {modal === 'delete'
                      ? 'Informe sua senha para confirmar a exclusão da conta.'
                      : 'Informe sua senha para confirmar a alteração da preferência de anonimização.'}
                  </ThemedText>
                  <TextField
                    label="Senha"
                    onChangeText={setPassword}
                    placeholder="Digite sua senha"
                    secureTextEntry
                    value={password}
                  />
                </>
              )}

              {mfaToken ? (
                <>
                  <InlineMessage
                    message={`Enviamos um código para ${mfaDestination}. Informe-o para concluir a ação.`}
                    tone="info"
                  />
                  <TextField
                    keyboardType="number-pad"
                    label="Código de verificação"
                    maxLength={6}
                    onChangeText={(value) => setMfaCode(value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={styles.codeInput}
                    textAlign="center"
                    value={mfaCode}
                  />
                </>
              ) : null}

              {feedback ? <InlineMessage message={feedback} /> : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={closeModal} title="Cancelar" variant="secondary" />
              <Button
                disabled={confirmDisabled}
                icon={isPasswordModal ? Icons.check : modal === 'delete' ? Icons.trash : Icons.shield}
                loading={busy}
                onPress={() =>
                  void (isPasswordModal
                    ? confirmPasswordChange()
                    : modal === 'delete'
                      ? deleteAccount()
                      : confirmAnonymization())
                }
                title={isPasswordModal ? 'Confirmar' : modal === 'delete' ? 'Excluir conta' : 'Confirmar'}
                variant={modal === 'delete' ? 'danger' : 'primary'}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Updated by AI.
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: Spacing.three, padding: Spacing.three },
  card: { gap: Spacing.two },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    minHeight: 44,
  },
  rowIcon: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  rowCopy: { flex: 1, gap: 1 },
  pressed: { opacity: 0.7 },
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modal: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: '88%',
    maxWidth: 460,
    padding: Spacing.four,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  modalTitle: { flex: 1 },
  closeButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  modalScroll: { gap: Spacing.three },
  codeInput: { fontSize: 22, fontWeight: '700', letterSpacing: 8 },
  modalActions: { gap: Spacing.two, marginTop: Spacing.three },
});
