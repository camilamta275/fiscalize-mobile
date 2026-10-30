import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import * as authService from '@/services/auth-service';

// Created by AI.
// Updated by AI.
export function ProfileEditView() {
  const { usuario, setUsuario } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  const resetFields = () => {
    setNome(usuario.nome ?? '');
    setEmail(usuario.email ?? '');
    setRua(usuario.rua ?? '');
    setNumero(usuario.numero ?? '');
    setBairro(usuario.bairro ?? '');
    setCidade(usuario.cidade ?? '');
    setEstado(usuario.estado ?? '');
    setCep(usuario.cep ?? '');
    setComplemento(usuario.complemento ?? '');
  };

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
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={goBack}
        subtitle={isEditing ? 'Altere os campos e salve' : 'Toque em editar para alterar'}
        title="Editar meus dados"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <SectionTitle icon={Icons.person} title="Dados pessoais" />
          <TextField
            editable={isEditing}
            label="Nome completo"
            onChangeText={setNome}
            value={nome}
          />
          <TextField
            autoCapitalize="none"
            editable={isEditing}
            keyboardType="email-address"
            label="E-mail"
            onChangeText={setEmail}
            value={email}
          />
          <TextField editable={false} label="CPF" value={usuario.cpf ?? ''} />
        </Card>

        <Card style={styles.card}>
          <SectionTitle icon={Icons.mapPin} title="Endereço" />
          <TextField
            editable={isEditing}
            keyboardType="numeric"
            label="CEP"
            onChangeText={setCep}
            value={cep}
          />
          <TextField editable={isEditing} label="Rua" onChangeText={setRua} value={rua} />
          <View style={styles.twoColumns}>
            <TextField
              containerStyle={styles.flex}
              editable={isEditing}
              label="Número"
              onChangeText={setNumero}
              value={numero}
            />
            <TextField
              containerStyle={styles.flex}
              editable={isEditing}
              label="Bairro"
              onChangeText={setBairro}
              value={bairro}
            />
          </View>
          <View style={styles.twoColumns}>
            <TextField
              containerStyle={styles.flex}
              editable={isEditing}
              label="Cidade"
              onChangeText={setCidade}
              value={cidade}
            />
            <TextField
              autoCapitalize="none"
              containerStyle={styles.uf}
              editable={isEditing}
              label="UF"
              maxLength={2}
              onChangeText={setEstado}
              value={estado}
            />
          </View>
          <TextField
            editable={isEditing}
            label="Complemento (opcional)"
            onChangeText={setComplemento}
            value={complemento}
          />
        </Card>

        {isEditing ? (
          <View style={styles.actions}>
            <Button
              disabled={isBusy}
              icon={Icons.close}
              onPress={() => {
                resetFields();
                setIsEditing(false);
              }}
              title="Cancelar"
              variant="secondary"
            />
            <Button
              icon={Icons.check}
              loading={isBusy}
              onPress={() => void saveProfile()}
              title="Salvar dados"
            />
          </View>
        ) : (
          <Button
            icon={Icons.edit}
            onPress={() => setIsEditing(true)}
            title="Editar dados"
          />
        )}
      </ScrollView>
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
  root: { flex: 1 },
  scroll: { gap: Spacing.three, padding: Spacing.three },
  card: { gap: Spacing.three },
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
  flex: { flex: 1 },
  uf: { width: 84 },
  actions: { gap: Spacing.two },
});
