// Created by AI.
import { useCallback, useEffect, useRef, useState } from 'react';

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

/**
 * Campos que compõem o endereço usado na geocodificação. Alterar qualquer um
 * deles invalida a coordenada atual e agenda uma nova resolução.
 */
const GEOCODE_FIELDS: readonly (keyof AddressFields)[] = [
  'rua',
  'numero',
  'bairro',
  'cidade',
  'estado',
];

/** Espera o usuário parar de digitar antes de chamar o geocoder. */
const GEOCODE_DEBOUNCE_MS = 600;

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

  /**
   * `addressRef` mantém sempre a versão mais recente do endereço para os
   * callbacks assíncronos (busca de CEP e geocodificação), evitando que um
   * closure antigo sobrescreva o que o usuário acabou de digitar.
   */
  const addressRef = useRef<AddressFields>(EMPTY_ADDRESS);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeRequestRef = useRef(0);

  useEffect(() => {
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, []);

  const commitAddress = useCallback((next: AddressFields) => {
    addressRef.current = next;
    setAddressState(next);
  }, []);

  const cancelScheduledGeocode = useCallback(() => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
  }, []);

  /**
   * Descarta uma geocodificação em andamento/agendada. Incrementar o token
   * garante que uma resposta atrasada não sobrescreva coordenadas mais novas
   * (por exemplo, as obtidas pelo GPS).
   */
  const invalidateGeocoding = useCallback(() => {
    cancelScheduledGeocode();
    geocodeRequestRef.current += 1;
    setIsResolvingCoords(false);
  }, [cancelScheduledGeocode]);

  const applyCoordinates = useCallback((next: Coordinates | null) => {
    if (next && hasValidCoordinates(next)) {
      setCoords(next);
      setCoordinatesError(null);
      return;
    }
    setCoords(null);
  }, []);

  const resolveCoordinates = useCallback(
    async (nextAddress: AddressFields) => {
      const requestId = geocodeRequestRef.current + 1;
      geocodeRequestRef.current = requestId;

      setIsResolvingCoords(true);
      setCoordinatesError(null);

      try {
        const nextCoords = await geocodeAddress(nextAddress);
        if (geocodeRequestRef.current !== requestId) return;

        if (nextCoords) {
          applyCoordinates(nextCoords);
        } else {
          setCoords(null);
          setCoordinatesError(
            'Não foi possível obter as coordenadas pelo endereço informado. Revise o número ou use sua localização atual.'
          );
        }
      } finally {
        if (geocodeRequestRef.current === requestId) {
          setIsResolvingCoords(false);
        }
      }
    },
    [applyCoordinates]
  );

  const scheduleGeocode = useCallback(
    (nextAddress: AddressFields) => {
      cancelScheduledGeocode();
      if (onlyDigits(nextAddress.cep).length !== 8) return;

      geocodeTimerRef.current = setTimeout(() => {
        geocodeTimerRef.current = null;
        void resolveCoordinates(nextAddress);
      }, GEOCODE_DEBOUNCE_MS);
    },
    [cancelScheduledGeocode, resolveCoordinates]
  );

  // Updated by AI.
  const updateField = useCallback(
    (field: keyof AddressFields, value: string) => {
      const nextAddress = { ...addressRef.current, [field]: value };
      commitAddress(nextAddress);

      if (field === 'complemento') return;

      setCoordinatesError(null);
      invalidateGeocoding();

      const hasCep = onlyDigits(nextAddress.cep).length === 8;
      if (!hasCep) {
        // Sem CEP válido não há como recalcular; evita manter uma coordenada
        // que não corresponde mais ao endereço digitado.
        setCoords(null);
        return;
      }

      if (requireCoordinates && GEOCODE_FIELDS.includes(field)) {
        scheduleGeocode(nextAddress);
      }
    },
    [commitAddress, invalidateGeocoding, requireCoordinates, scheduleGeocode]
  );

  const setAddress = useCallback(
    (next: Partial<AddressFields>) => {
      commitAddress({ ...addressRef.current, ...next });
    },
    [commitAddress]
  );

  const resolveCep = useCallback(
    async (rawCep: string) => {
      setCepError(null);
      setAddressError(null);
      setIsLookingUpCep(true);

      try {
        const result = await lookupCep(rawCep);
        const previous = addressRef.current;
        const nextAddress: AddressFields = {
          ...previous,
          cep: formatCepInput(result.cep),
          rua: result.rua || previous.rua,
          bairro: result.bairro || previous.bairro,
          cidade: result.cidade || previous.cidade,
          estado: result.estado || previous.estado,
        };

        commitAddress(nextAddress);
        invalidateGeocoding();
        await resolveCoordinates(nextAddress);
      } catch (error) {
        setCepError(
          error instanceof AddressServiceError ? error.message : 'Não foi possível consultar o CEP.'
        );
      } finally {
        setIsLookingUpCep(false);
      }
    },
    [commitAddress, invalidateGeocoding, resolveCoordinates]
  );

  const handleCepChange = useCallback(
    (value: string) => {
      const formatted = formatCepInput(value);
      commitAddress({ ...addressRef.current, cep: formatted });

      setCoords(null);
      setCoordinatesError(null);
      setCepError(null);
      invalidateGeocoding();

      if (onlyDigits(formatted).length === 8) {
        void resolveCep(formatted);
      }
    },
    [commitAddress, invalidateGeocoding, resolveCep]
  );

  const captureCurrentLocation = useCallback(async () => {
    setAddressError(null);
    setCoordinatesError(null);
    setIsCapturingLocation(true);

    try {
      const { address: current, coords: nextCoords } = await getCurrentAddress();

      const previous = addressRef.current;
      commitAddress({
        ...previous,
        cep: current.cep ? formatCepInput(current.cep) : previous.cep,
        rua: current.rua || previous.rua,
        numero: current.numero || previous.numero,
        bairro: current.bairro || previous.bairro,
        cidade: current.cidade || previous.cidade,
        estado: current.estado || previous.estado,
      });
      invalidateGeocoding();
      applyCoordinates(nextCoords);
    } catch (error) {
      setAddressError(
        error instanceof AddressServiceError ? error.message : 'Não foi possível obter sua localização.'
      );
    } finally {
      setIsCapturingLocation(false);
    }
  }, [applyCoordinates, commitAddress, invalidateGeocoding]);

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
