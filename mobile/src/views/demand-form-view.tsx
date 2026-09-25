import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraCapture } from '@/components/camera-capture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDemandFormViewModel } from '@/viewmodels/use-demand-form-view-model';

/**
 * View — the create/edit form for a demand. Holds no state of its own;
 * everything comes from the ViewModel, which decides create-vs-edit from
 * whether a `demandId` was passed in.
 */
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={theme.text} style={styles.centered} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={styles.centered} themeColor="textSecondary">
          {loadError}
        </ThemedText>
      </SafeAreaView>
    );
  }

  if (didSucceed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle">
            {isEditing ? 'Ocorrência atualizada!' : 'Ocorrência registrada!'}
          </ThemedText>
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="button"
              style={StyleSheet.flatten([
                styles.button,
                { backgroundColor: theme.backgroundSelected },
              ])}>
              <ThemedText type="smallBold">Voltar para a lista</ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {isBlocked ? (
          <ThemedView style={styles.card} type="backgroundElement">
            <ThemedText type="smallBold">Não é possível editar</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              Esta ocorrência está com status &quot;{currentStatus}&quot; e não aceita mais
              alterações.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <Field
              error={fieldErrors.title}
              label="Título"
              onChangeText={setTitle}
              placeholder="Ex: Buraco na via"
              theme={theme}
              value={title}
            />

            <Field
              error={fieldErrors.description}
              label="Descrição"
              multiline
              onChangeText={setDescription}
              placeholder="Descreva o problema com detalhes"
              theme={theme}
              value={description}
            />

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">Categoria</ThemedText>
              <ThemedView style={styles.chipsWrap} type="background">
                {categories.map((category) => {
                  const selected = categoryId === category.id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={category.id}
                      onPress={() => setCategoryId(category.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText type="small">{category.nome}</ThemedText>
                    </Pressable>
                  );
                })}
              </ThemedView>
              {fieldErrors.categoryId ? (
                <ThemedText themeColor="textSecondary" type="small">
                  {fieldErrors.categoryId}
                </ThemedText>
              ) : null}
            </ThemedView>

            <Field
              error={fieldErrors.location}
              label="Endereço"
              onChangeText={setLocation}
              placeholder="Rua, número, bairro, cidade"
              theme={theme}
              value={location}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isCapturingLocation}
              onPress={captureLocation}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              {isCapturingLocation ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <ThemedText type="smallBold">
                  {coords ? 'Localização capturada ✓' : 'Usar minha localização atual'}
                </ThemedText>
              )}
            </Pressable>

            <ThemedView style={styles.field}>
              <ThemedText type="smallBold">Foto</ThemedText>
              {photoUri ? (
                <Image contentFit="cover" source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsCameraOpen(true)}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">
                  {photoUri ? 'Tirar outra foto' : 'Tirar foto'}
                </ThemedText>
              </Pressable>
              <ThemedText themeColor="textSecondary" type="small">
                A foto fica só no aparelho por enquanto — o backend ainda não tem onde guardá-la.
              </ThemedText>
            </ThemedView>

            {error ? (
              <ThemedText style={styles.feedback} themeColor="textSecondary">
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={submit}
              style={[
                styles.button,
                { backgroundColor: theme.backgroundSelected },
                isSubmitting && styles.buttonDisabled,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <ThemedText type="smallBold">
                  {isEditing ? 'Salvar alterações' : 'Criar ocorrência'}
                </ThemedText>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  error,
  label,
  multiline,
  onChangeText,
  placeholder,
  theme,
  value,
}: {
  error?: string;
  label: string;
  multiline?: boolean;
  onChangeText: (text: string) => void;
  placeholder: string;
  theme: ReturnType<typeof useTheme>;
  value: string;
}) {
  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
        value={value}
      />
      {error ? (
        <ThemedText themeColor="textSecondary" type="small">
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    marginTop: Spacing.six,
    textAlign: 'center',
  },
  container: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  feedback: {
    marginTop: Spacing.one,
  },
  button: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  photoPreview: {
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
    width: '100%',
  },
});
