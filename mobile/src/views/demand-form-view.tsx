import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraCapture } from '@/components/camera-capture';
import { CategoryEmoji } from '@/components/category-emoji';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDemandFormViewModel } from '@/viewmodels/use-demand-form-view-model';

/**
 * View — the create/edit form for a demand. Holds no state of its own;
 * everything comes from the ViewModel, which decides create-vs-edit from
 * whether a `demandId` was passed in. The layout follows the reference's
 * "new ticket" wizard: one card per step, with a category grid, a location
 * card and a dashed photo slot.
 */
// Updated by AI.
export function DemandFormView({ demandId }: { demandId?: string }) {
  const {
    isEditing,
    categories,
    isLoadingCategories,
    isLoadingDemand,
    loadError,
    title,
    setTitle,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    location,
    setLocation,
    coords,
    captureLocation,
    isCapturingLocation,
    photoUri,
    setPhotoUri,
    isBlocked,
    currentStatus,
    fieldErrors,
    error,
    isSubmitting,
    didSucceed,
    submit,
  } = useDemandFormViewModel(demandId);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (isCameraOpen) {
    return (
      <CameraCapture
        onCancel={() => setIsCameraOpen(false)}
        onCapture={(uri) => {
          setPhotoUri(uri);
          setIsCameraOpen(false);
        }}
      />
    );
  }

  if (isLoadingCategories || isLoadingDemand) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader
          onBack={goBack}
          subtitle={isEditing ? 'Carregando ocorrência…' : 'Nova ocorrência'}
          title={isEditing ? 'Editar ocorrência' : 'Nova ocorrência'}
        />
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader onBack={goBack} title="Ocorrência" />
        <View style={styles.stateContainer}>
          <InlineMessage message={loadError} />
        </View>
      </View>
    );
  }

  if (didSucceed) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader onBack={goBack} title={isEditing ? 'Editar ocorrência' : 'Nova ocorrência'} />
        <View style={styles.success}>
          <View style={[styles.successIcon, { backgroundColor: theme.statusProgressBg }]}>
            <Icon color={theme.statusProgress} name={Icons.checkCircle} size={34} />
          </View>
          <ThemedText style={styles.centered} type="heading">
            {isEditing ? 'Ocorrência atualizada!' : 'Ocorrência registrada!'}
          </ThemedText>
          <ThemedText style={styles.centered} themeColor="mutedForeground" type="small">
            {isEditing
              ? 'As alterações já estão salvas.'
              : 'Agora é só acompanhar o andamento em Meus Chamados.'}
          </ThemedText>
          <Button
            icon={Icons.arrowLeft}
            onPress={() => router.replace('/')}
            style={styles.successButton}
            title="Voltar para a lista"
          />
        </View>
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader
          onBack={goBack}
          subtitle="Somente leitura"
          title={isEditing ? 'Editar ocorrência' : 'Nova ocorrência'}
        />
        <View style={styles.stateContainer}>
          <Card style={styles.blockedCard} tone="gold">
            <View style={styles.sectionTitle}>
              <View style={[styles.sectionIcon, { backgroundColor: theme.goldSoft }]}>
                <Icon color={theme.gold} name={Icons.lock} size={16} />
              </View>
              <ThemedText type="subtitle">Não é possível editar</ThemedText>
            </View>
            <ThemedText themeColor="textSecondary" type="small">
              Esta ocorrência está com status &quot;{currentStatus}&quot; e não aceita mais
              alterações.
            </ThemedText>
            <Button icon={Icons.arrowLeft} onPress={goBack} title="Voltar" variant="secondary" />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={goBack}
        subtitle={isEditing ? 'Atualize os dados da ocorrência' : 'Registre um problema urbano'}
        title={isEditing ? 'Editar ocorrência' : 'Nova ocorrência'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <SectionTitle icon={Icons.edit} title="O que aconteceu?" />
            <TextField
              error={fieldErrors.title}
              label="Título"
              onChangeText={setTitle}
              placeholder="Ex: Buraco na via"
              value={title}
            />
            <TextField
              error={fieldErrors.description}
              label="Descrição"
              multiline
              onChangeText={setDescription}
              placeholder="Descreva o problema com detalhes, incluindo pontos de referência."
              value={description}
            />
          </Card>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.filter} title="Categoria" />
            <ThemedText themeColor="mutedForeground" type="small">
              Selecione a categoria que melhor descreve a ocorrência.
            </ThemedText>
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const selected = categoryId === category.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    style={({ pressed }) => [
                      styles.categoryTile,
                      {
                        backgroundColor: selected ? theme.primarySoft : theme.background,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <CategoryEmoji name={category.nome} size={22} />
                    <ThemedText
                      numberOfLines={2}
                      style={{ color: selected ? theme.primary : theme.text }}
                      type="smallBold">
                      {category.nome}
                    </ThemedText>
                    {selected ? (
                      <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                        <Icon color={theme.primaryForeground} name={Icons.check} size={10} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {fieldErrors.categoryId ? (
              <ThemedText style={{ color: theme.destructive }} type="caption">
                {fieldErrors.categoryId}
              </ThemedText>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.mapPin} title="Localização" />
            <TextField
              error={fieldErrors.location}
              label="Endereço"
              onChangeText={setLocation}
              placeholder="Rua, número, bairro, cidade"
              value={location}
            />
            <Button
              icon={Icons.mapPin}
              loading={isCapturingLocation}
              onPress={captureLocation}
              title={coords ? 'Atualizar minha localização' : 'Usar minha localização atual'}
              variant="secondary"
            />
            {coords ? (
              <View style={[styles.coords, { backgroundColor: theme.accentSoft }]}>
                <Icon color={theme.accent} name={Icons.checkCircle} size={14} />
                <ThemedText style={{ color: theme.accent }} type="caption">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </ThemedText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <SectionTitle icon={Icons.camera} title="Foto" />
            {photoUri ? (
              <>
                <Image contentFit="cover" source={{ uri: photoUri }} style={styles.photoPreview} />
                <Button
                  icon={Icons.camera}
                  onPress={() => setIsCameraOpen(true)}
                  title="Trocar foto"
                  variant="secondary"
                />
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsCameraOpen(true)}
                style={({ pressed }) => [
                  styles.photoDropzone,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.dropzoneIcon, { backgroundColor: theme.primarySoft }]}>
                  <Icon color={theme.primary} name={Icons.camera} size={22} />
                </View>
                <ThemedText type="smallBold">Tirar foto da ocorrência</ThemedText>
                <ThemedText themeColor="mutedForeground" type="caption">
                  Ajuda a equipe a identificar o problema
                </ThemedText>
              </Pressable>
            )}
            <ThemedText themeColor="mutedForeground" type="caption">
              A foto fica só no aparelho por enquanto — o backend ainda não tem onde guardá-la.
            </ThemedText>
          </Card>

          {error ? <InlineMessage message={error} /> : null}

          <Button
            icon={isEditing ? Icons.check : Icons.send}
            loading={isSubmitting}
            onPress={submit}
            title={isEditing ? 'Salvar alterações' : 'Criar ocorrência'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  loading: {
    marginTop: Spacing.six,
  },
  stateContainer: {
    padding: Spacing.three,
  },
  card: {
    gap: Spacing.three,
  },
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryTile: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.one,
    justifyContent: 'center',
    minHeight: 92,
    padding: Spacing.two,
  },
  checkBadge: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 18,
  },
  coords: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  photoDropzone: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: Spacing.one,
    padding: Spacing.four,
  },
  dropzoneIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 48,
    justifyContent: 'center',
    marginBottom: Spacing.one,
    width: 48,
  },
  photoPreview: {
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    width: '100%',
  },
  blockedCard: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.8,
  },
  centered: {
    textAlign: 'center',
  },
  success: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.three,
    maxWidth: 420,
    padding: Spacing.four,
    width: '100%',
  },
  successIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  successButton: {
    alignSelf: 'stretch',
  },
});
