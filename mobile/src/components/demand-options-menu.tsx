import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Icons } from '@/constants/icons';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The detail screen's ⋮ overflow menu: a kebab button for the header's top
 * right corner opening a popover with "Excluir chamado", which flips to a
 * yes/no confirmation modal warning the action can't be undone. The parent
 * owns the actual deletion — `deleteRequest` resolves when the call settles,
 * and an API failure keeps the modal open with the error shown in it.
 */
// Created by AI.
export function DemandOptionsMenu({
  deleteRequest,
  isDeleting,
}: {
  deleteRequest: () => Promise<void>;
  isDeleting: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    setError(null);
    try {
      await deleteRequest();
      setConfirmOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado ao excluir.');
    }
  };

  return (
    <View>
      <Pressable
        accessibilityLabel="Mais opções"
        accessibilityRole="button"
        hitSlop={Spacing.two}
        onPress={() => setMenuOpen(true)}
        style={({ pressed }) => [
          styles.kebab,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <Icon color={theme.textSecondary} name={Icons.more} size={18} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        transparent
        visible={menuOpen}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.menuCard,
              Shadows.floating,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                top: insets.top + Spacing.five,
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
              <Icon color={theme.destructive} name={Icons.trash} size={16} />
              <ThemedText style={{ color: theme.destructive }} type="smallBold">
                Excluir chamado
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
        transparent
        visible={confirmOpen}>
        <Pressable style={styles.backdrop}>
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.confirmCard,
              Shadows.floating,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}>
            <ThemedText type="subtitle">Excluir ocorrência</ThemedText>
            <ThemedText type="small">
              Tem certeza de que deseja excluir este chamado? Ele sai da sua lista de ocorrências.
            </ThemedText>
            <ThemedText style={{ color: theme.destructive }} type="caption">
              Esta ação não pode ser desfeita.
            </ThemedText>
            {error ? (
              <ThemedText style={{ color: theme.destructive }} type="caption">
                {error}
              </ThemedText>
            ) : null}
            <View style={styles.confirmButtons}>
              <Button
                onPress={() => setConfirmOpen(false)}
                style={styles.confirmButton}
                title="Não"
                variant="secondary"
              />
              <Button
                icon={Icons.trash}
                loading={isDeleting}
                onPress={confirmDelete}
                style={styles.confirmButton}
                title="Sim, excluir"
                variant="danger"
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  kebab: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
  },
  menuCard: {
    alignSelf: 'flex-end',
    borderRadius: Radius.md,
    borderWidth: 1,
    elevation: 8,
    marginRight: Spacing.three,
    overflow: 'hidden',
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
    position: 'absolute',
    width: 190,
  },
  menuRow: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  confirmCard: {
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    elevation: 8,
    gap: Spacing.two,
    marginTop: 'auto',
    marginBottom: 'auto',
    maxWidth: 420,
    padding: Spacing.three,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  confirmButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
