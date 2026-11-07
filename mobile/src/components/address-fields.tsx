// Created by AI.
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Icons } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AddressFieldErrors } from '@/hooks/use-address-form';
import type { AddressFields as AddressValues, Coordinates } from '@/services/address-service';

type AddressFieldsProps = {
  address: AddressValues;
  coords: Coordinates | null;
  errors?: AddressFieldErrors;
  isLookingUpCep: boolean;
  isCapturingLocation: boolean;
  isResolvingCoords: boolean;
  onChange: (field: keyof AddressValues, value: string) => void;
  onCepChange: (value: string) => void;
  onUseCurrentLocation: () => void;
  addressError?: string | null;
  coordinatesError?: string | null;
};

// Created by AI.
export function AddressFields({
  address,
  coords,
  errors,
  isLookingUpCep,
  isCapturingLocation,
  isResolvingCoords,
  onChange,
  onCepChange,
  onUseCurrentLocation,
  addressError,
  coordinatesError,
}: AddressFieldsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextField
        error={errors?.cep}
        hint={isLookingUpCep ? 'Buscando endereço…' : 'Digite o CEP para preencher automaticamente'}
        keyboardType="numeric"
        label="CEP"
        maxLength={9}
        onChangeText={onCepChange}
        placeholder="00000-000"
        value={address.cep}
      />
      <TextField
        error={errors?.rua}
        label="Rua"
        onChangeText={(value) => onChange('rua', value)}
        placeholder="Rua ou avenida"
        value={address.rua}
      />
      <View style={styles.twoColumns}>
        <TextField
          containerStyle={styles.flex}
          error={errors?.numero}
          hint={errors?.numero ? undefined : 'Opcional'}
          label="Número"
          onChangeText={(value) => onChange('numero', value)}
          placeholder="Ex: 123"
          value={address.numero}
        />
        <TextField
          containerStyle={styles.flex}
          error={errors?.bairro}
          label="Bairro"
          onChangeText={(value) => onChange('bairro', value)}
          placeholder="Ex: Boa Viagem"
          value={address.bairro}
        />
      </View>
      <View style={styles.twoColumns}>
        <TextField
          containerStyle={styles.flex}
          error={errors?.cidade}
          label="Cidade"
          onChangeText={(value) => onChange('cidade', value)}
          placeholder="Recife"
          value={address.cidade}
        />
        <TextField
          autoCapitalize="characters"
          containerStyle={styles.uf}
          error={errors?.estado}
          label="UF"
          maxLength={2}
          onChangeText={(value) => onChange('estado', value.toUpperCase())}
          placeholder="PE"
          value={address.estado}
        />
      </View>
      <TextField
        hint="Opcional"
        label="Complemento"
        onChangeText={(value) => onChange('complemento', value)}
        placeholder="Apto, bloco, ponto de referência"
        value={address.complemento}
      />

      <Button
        icon={Icons.mapPin}
        loading={isCapturingLocation}
        onPress={onUseCurrentLocation}
        title="Usar minha localização atual"
        variant="secondary"
      />

      {addressError ? (
        <ThemedText style={{ color: theme.destructive }} type="caption">
          {addressError}
        </ThemedText>
      ) : null}

      <View style={styles.twoColumns}>
        <TextField
          containerStyle={styles.flex}
          editable={false}
          hint={isResolvingCoords ? 'Calculando…' : 'Preenchida automaticamente'}
          label="Latitude"
          value={coords ? coords.latitude.toFixed(6) : ''}
        />
        <TextField
          containerStyle={styles.flex}
          editable={false}
          hint={isResolvingCoords ? 'Calculando…' : 'Preenchida automaticamente'}
          label="Longitude"
          value={coords ? coords.longitude.toFixed(6) : ''}
        />
      </View>
      {coordinatesError || errors?.coordinates ? (
        <ThemedText style={{ color: theme.destructive }} type="caption">
          {coordinatesError ?? errors?.coordinates}
        </ThemedText>
      ) : null}
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  uf: {
    width: 82,
  },
});
