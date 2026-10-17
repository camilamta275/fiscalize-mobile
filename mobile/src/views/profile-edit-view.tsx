import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/contexts/session-context';
import * as authService from '@/services/auth-service';

// Created by AI.
export function ProfileEditView() {
  const { usuario, setUsuario } = useSession();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [rua, setRua] = useState(usuario?.rua ?? '');
  const [numero, setNumero] = useState(usuario?.numero ?? '');
  const [bairro, setBairro] = useState(usuario?.bairro ?? '');
  const [cidade, setCidade] = useState(usuario?.cidade ?? '');
  const [estado, setEstado] = useState(usuario?.estado ?? '');
  const [cep, setCep] = useState(usuario?.cep ?? '');
  const [complemento, setComplemento] = useState(usuario?.complemento ?? '');

  if (!usuario) return null;

  const saveProfile = async () => {
    setIsBusy(true);
    try {
      const updated = await authService.updateMe({ nome, email, rua, numero, bairro, cidade, estado, cep, complemento });
      setUsuario(updated);
      setIsEditing(false);
      Alert.alert('Dados atualizados', 'Seus dados foram atualizados com sucesso.');
    } catch (error) {
      Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Editar meus dados</ThemedText>
        <Field editable={isEditing} label="Nome" onChangeText={setNome} theme={theme} value={nome} />
        <Field editable={isEditing} label="E-mail" onChangeText={setEmail} theme={theme} value={email} />
        <Field editable={false} label="CPF" theme={theme} value={usuario.cpf ?? ''} />
        <Field editable={isEditing} label="CEP" keyboardType="numeric" onChangeText={setCep} theme={theme} value={cep} />
        <Field editable={isEditing} label="Rua" onChangeText={setRua} theme={theme} value={rua} />
        <Field editable={isEditing} label="Número" onChangeText={setNumero} theme={theme} value={numero} />
        <Field editable={isEditing} label="Bairro" onChangeText={setBairro} theme={theme} value={bairro} />
        <Field editable={isEditing} label="Cidade" onChangeText={setCidade} theme={theme} value={cidade} />
        <Field editable={isEditing} label="Estado" onChangeText={setEstado} theme={theme} value={estado} />
        <Field editable={isEditing} label="Complemento (opcional)" onChangeText={setComplemento} theme={theme} value={complemento} />
        <Pressable disabled={isBusy} onPress={() => (isEditing ? void saveProfile() : setIsEditing(true))} style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{isEditing ? 'Salvar dados' : 'Editar dados'}</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ editable = true, keyboardType, label, onChangeText, theme, value }: {
  editable?: boolean;
  keyboardType?: 'default' | 'numeric';
  label: string;
  onChangeText?: (value: string) => void;
  theme: ReturnType<typeof useTheme>;
  value: string;
}) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput editable={editable} keyboardType={keyboardType} onChangeText={onChangeText} style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, opacity: editable ? 1 : 0.6 }]} value={value} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { gap: Spacing.three, padding: Spacing.three },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, fontSize: 16, padding: Spacing.three },
  button: { alignItems: 'center', borderRadius: Spacing.two, padding: Spacing.three },
});
