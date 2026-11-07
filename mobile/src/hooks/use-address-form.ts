// Created by AI.
import { useCallback, useState } from 'react';

import {
  AddressServiceError,
  formatCepInput,
  geocodeAddress,
  getCurrentAddress,
  hasValidCoordinates,
  lookupCep,
  onlyDigits,
  type AddressFields,
  type Coordinates,
} from '@/services/address-service';

export type AddressFieldErrors = Partial<
  Record<'cep' | 'rua' | 'numero' | 'bairro' | 'cidade' | 'estado' | 'coordinates', string>
>;

const EMPTY_ADDRESS: AddressFields = {
  cep: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  complemento: '',
};

type UseAddressFormOptions = {
  requireNumero?: boolean;
  requireCoordinates?: boolean;
};

// Created by AI.
export function useAddressForm({
  requireNumero = false,
  requireCoordinates = false,
}: UseAddressFormOptions = {}) {
  const [address, setAddressState] = useState<AddressFields>(EMPTY_ADDRESS);
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const [cepError, setCepError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [coordinatesError, setCoordinatesError] = useState<string | null>(null);

  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isResolvingCoords, setIsResolvingCoords] = useState(false);

  // Updated by AI.
  const updateField = useCallback((field: keyof AddressFields, value: string) => {
    setAddressState((previous) => ({ ...previous, [field]: value }));
    if (field !== 'complemento') {
      setCoords(null);
      setCoordinatesError(null);
    }
  }, []);

  const setAddress = useCallback((next: Partial<AddressFields>) => {
    setAddressState((previous) => ({ ...previous, ...next }));
  }, []);

  const applyCoordinates = useCallback((next: Coordinates | null) => {
    if (next && hasValidCoordinates(next)) {
      setCoords(next);
      setCoordinatesError(null);
      return;
    }
    setCoords(null);
  }, []);

  const resolveCoordinates = useCallback(async (nextAddress: AddressFields) => {
    setIsResolvingCoords(true);
    setCoordinatesError(null);
    try {
      const nextCoords = await geocodeAddress(nextAddress);
      if (nextCoords) {
        applyCoordinates(nextCoords);
      } else {
        setCoordinatesError(
          'Não foi possível obter as coordenadas pelo CEP. Use sua localização atual.'
        );
      }
    } finally {
      setIsResolvingCoords(false);
    }
  }, [applyCoordinates]);

  const resolveCep = useCallback(
    async (rawCep: string) => {
      setCepError(null);
      setAddressError(null);
      setIsLookingUpCep(true);

      try {
        const result = await lookupCep(rawCep);
        const nextAddress: AddressFields = {
          ...address,
          cep: formatCepInput(result.cep),
          rua: result.rua || address.rua,
          bairro: result.bairro || address.bairro,
          cidade: result.cidade || address.cidade,
          estado: result.estado || address.estado,
        };

        setAddressState(nextAddress);
        await resolveCoordinates(nextAddress);
      } catch (error) {
        setCepError(
          error instanceof AddressServiceError ? error.message : 'Não foi possível consultar o CEP.'
        );
      } finally {
        setIsLookingUpCep(false);
      }
    },
    [address, resolveCoordinates]
  );

  const handleCepChange = useCallback(
    (value: string) => {
      const formatted = formatCepInput(value);
      setAddressState((previous) => ({ ...previous, cep: formatted }));
      setCoords(null);
      setCoordinatesError(null);
      setCepError(null);

      if (onlyDigits(formatted).length === 8) {
        void resolveCep(formatted);
      }
    },
    [resolveCep]
  );

  const captureCurrentLocation = useCallback(async () => {
    setAddressError(null);
    setCoordinatesError(null);
    setIsCapturingLocation(true);

    try {
      const { address: current, coords: nextCoords } = await getCurrentAddress();

      setAddressState((previous) => ({
        ...previous,
        cep: current.cep ? formatCepInput(current.cep) : previous.cep,
        rua: current.rua || previous.rua,
        numero: current.numero || previous.numero,
        bairro: current.bairro || previous.bairro,
        cidade: current.cidade || previous.cidade,
        estado: current.estado || previous.estado,
      }));
      applyCoordinates(nextCoords);
    } catch (error) {
      setAddressError(
        error instanceof AddressServiceError ? error.message : 'Não foi possível obter sua localização.'
      );
    } finally {
      setIsCapturingLocation(false);
    }
  }, [applyCoordinates]);

  const validate = useCallback((): AddressFieldErrors => {
    const errors: AddressFieldErrors = {};
    const cepDigits = onlyDigits(address.cep);

    if (cepDigits.length !== 8) {
      errors.cep = 'Informe um CEP com 8 dígitos';
    }
    if (!address.rua.trim()) {
      errors.rua = 'Campo obrigatório';
    }
    if (requireNumero && !address.numero.trim()) {
      errors.numero = 'Campo obrigatório';
    }
    if (!address.bairro.trim()) {
      errors.bairro = 'Campo obrigatório';
    }
    if (!address.cidade.trim()) {
      errors.cidade = 'Campo obrigatório';
    }
    if (!/^[A-Za-z]{2}$/.test(address.estado.trim())) {
      errors.estado = 'Use a UF com 2 letras';
    }
    if (requireCoordinates && !hasValidCoordinates(coords)) {
      errors.coordinates = 'Use o CEP ou sua localização atual para obter as coordenadas';
    }

    return errors;
  }, [address, coords, requireCoordinates, requireNumero]);

  return {
    address,
    coords,
    cepError,
    addressError,
    coordinatesError,
    isLookingUpCep,
    isCapturingLocation,
    isResolvingCoords,
    updateField,
    setAddress,
    setCoordinates: applyCoordinates,
    handleCepChange,
    resolveCep,
    captureCurrentLocation,
    validate,
  };
}
