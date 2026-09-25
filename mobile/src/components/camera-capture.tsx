import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Full-screen photo capture, used inline by demand-form-view.tsx instead of a
 * separate route — there's no result to pass across a navigation boundary
 * other than a single URI, so a local view-state toggle is simpler.
 *
 * The permission prompt only fires when this mounts, i.e. only once the user
 * taps "Tirar foto" — never eagerly on screen load.
 */
export function CameraCapture({
  onCancel,
  onCapture,
}: {
  onCancel: () => void;
  onCapture: (uri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <ActivityIndicator style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ThemedView style={styles.permissionCard}>
          <ThemedText themeColor="textSecondary">
            Precisamos da câmera pra fotografar a ocorrência.
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={requestPermission} style={styles.permissionButton}>
            <ThemedText type="smallBold">Permitir câmera</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.permissionButton}>
            <ThemedText type="smallBold">Cancelar</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
    if (photo) onCapture(photo.uri);
  };

  return (
    <CameraView facing="back" ref={cameraRef} style={styles.camera}>
      <SafeAreaView style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelChip}>
          <Text style={styles.chipText}>Cancelar</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Tirar foto"
          accessibilityRole="button"
          onPress={capture}
          style={styles.shutter}
        />
        <ThemedView style={styles.spacer} />
      </SafeAreaView>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  permissionCard: {
    gap: Spacing.three,
  },
  permissionButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  camera: {
    flex: 1,
  },
  controls: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    position: 'absolute',
    width: '100%',
  },
  cancelChip: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  shutter: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 36,
    borderWidth: 4,
    height: 72,
    width: 72,
  },
  spacer: {
    backgroundColor: 'transparent',
    width: 70,
  },
});
