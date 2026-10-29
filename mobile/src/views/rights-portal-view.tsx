import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import type { Perfil, Usuario } from '@/models/usuario';

// Created by AI.
const PERFIL_LABEL: Record<Perfil, string> = {
  Cidadao: 'Cidadão',
  Gestor: 'Gestor de Setor',
  Admin: 'Administrador',
};

// Created by AI.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

// Created by AI.
function composeAddress(usuario: Usuario): string {
  const street = [usuario.rua, usuario.numero].filter(Boolean).join(', ');
  const parts = [street, usuario.bairro, usuario.cidade, usuario.estado, usuario.cep].filter(
    (part): part is string => !!part && part.length > 0
  );

  return parts.length > 0 ? parts.join(' · ') : 'Não informado';
}

/**
 * View — the profile hub ("Meus dados e privacidade"), laid out like the
 * reference's `ManagerProfile`: an avatar card, an information card, and the
 * navigation/actions below it.
 */
// Updated by AI.
export function RightsPortalView() {
  const { usuario, signOut } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!usuario) return null;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader onBack={goBack} title="Meu perfil" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primaryForeground }} type="title">
              {initials(usuario.nome)}
            </ThemedText>
          </View>
          <View style={styles.profileCopy}>
            <ThemedText type="heading">{usuario.nome}</ThemedText>
            <ThemedText themeColor="mutedForeground" type="small">
              {PERFIL_LABEL[usuario.perfil]}
            </ThemedText>
            <View style={styles.profileMeta}>
              <View style={styles.metaItem}>
                <Icon color={theme.mutedForeground} name={Icons.mail} size={12} />
                <ThemedText numberOfLines={1} style={styles.metaText} themeColor="mutedForeground" type="caption">
                  {usuario.email}
                </ThemedText>
              </View>
              {usuario.cpf ? (
                <View style={styles.metaItem}>
                  <Icon color={theme.mutedForeground} name={Icons.person} size={12} />
                  <ThemedText themeColor="mutedForeground" type="caption">
                    {usuario.cpf}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        <Card padded={false} style={styles.menuCard}>
          <MenuRow
            description="Nome, e-mail e endereço"
            icon={Icons.edit}
            onPress={() => router.push('/profile/edit')}
            title="Editar meus dados"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuRow
            description="Senha, anonimização e exclusão da conta"
            icon={Icons.shield}
            onPress={() => router.push('/profile/security')}
            title="Segurança e privacidade"
          />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Informações</ThemedText>
          <InfoRow label="Nome completo" value={usuario.nome} />
          <InfoRow label="E-mail" value={usuario.email} />
          <InfoRow label="CPF" value={usuario.cpf ?? 'Não informado'} />
          <InfoRow label="Endereço" value={composeAddress(usuario)} />
        </Card>

        <Button
          icon={Icons.logOut}
          onPress={signOut}
          title="Sair da conta"
          variant="danger"
        />

        <ThemedText style={styles.centered} themeColor="mutedForeground" type="caption">
          Fiscalize • Sistema integrado de gestão urbana de Pernambuco
        </ThemedText>
      </ScrollView>
    </View>
  );
}

// Created by AI.
function MenuRow({
  description,
  icon,
  onPress,
  title,
}: {
  description: string;
  icon: IconName;
  onPress: () => void;
  title: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={[styles.menuIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon color={theme.primary} name={icon} size={18} />
      </View>
      <View style={styles.menuCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText themeColor="mutedForeground" type="caption">
          {description}
        </ThemedText>
      </View>
      <Icon color={theme.mutedForeground} name={Icons.chevronRight} size={18} />
    </Pressable>
  );
}

// Created by AI.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText themeColor="mutedForeground" type="caption">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

// Updated by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileMeta: {
    gap: 2,
    marginTop: Spacing.one,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  metaText: {
    flexShrink: 1,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  menuIcon: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  menuCopy: {
    flex: 1,
    gap: 1,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.three + 38 + Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
  infoRow: {
    gap: 1,
  },
  centered: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
