// Created by AI.
import * as Location from 'expo-location';

export type AddressFields = {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CepResult = {
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
};

// Created by AI.
export class AddressServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AddressServiceError';
  }
}

const CEP_LOOKUP_TIMEOUT_MS = 10_000;

// Created by AI.
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// Created by AI.
export function formatCepInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Created by AI.
export function hasValidCoordinates(coords: Coordinates | null): coords is Coordinates {
  if (!coords) return false;
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return false;
  if (coords.latitude === 0 && coords.longitude === 0) return false;
  return (
    coords.latitude >= -33.75 &&
    coords.latitude <= 5.28 &&
    coords.longitude >= -74 &&
    coords.longitude <= -28.8
  );
}

// Created by AI.
export async function lookupCep(rawCep: string): Promise<CepResult> {
  const cep = onlyDigits(rawCep);
  if (cep.length !== 8) {
    throw new AddressServiceError('Informe um CEP com 8 dígitos.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CEP_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new AddressServiceError('Não foi possível consultar o CEP.');
    }

    const data = (await response.json()) as {
      erro?: boolean;
      cep?: string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (data.erro) {
      throw new AddressServiceError('CEP não encontrado.');
    }

    return {
      cep,
      rua: data.logradouro?.trim() ?? '',
      bairro: data.bairro?.trim() ?? '',
      cidade: data.localidade?.trim() ?? '',
      estado: data.uf?.trim().toUpperCase() ?? '',
    };
  } catch (error) {
    if (error instanceof AddressServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AddressServiceError('A consulta do CEP demorou demais. Tente novamente.');
    }
    throw new AddressServiceError('Não foi possível consultar o CEP.');
  } finally {
    clearTimeout(timeout);
  }
}

// Created by AI.
function buildGeocodeQuery(address: AddressFields, includeNumero: boolean): string {
  return [
    address.rua,
    includeNumero ? address.numero : '',
    address.bairro,
    [address.cidade, address.estado].filter(Boolean).join(' - '),
    onlyDigits(address.cep),
  ]
    .filter((part) => part.trim().length > 0)
    .join(', ');
}

// Created by AI.
export async function geocodeAddress(address: AddressFields): Promise<Coordinates | null> {
  const queries = [buildGeocodeQuery(address, true)];

  // Alguns geocoders não reconhecem o número exato e devolvem uma lista vazia.
  // Nesse caso tentamos o logradouro para ainda obter uma coordenada válida em
  // vez de deixar o formulário sem latitude/longitude.
  if (address.numero.trim()) {
    queries.push(buildGeocodeQuery(address, false));
  }

  for (const query of queries) {
    if (query.length === 0) continue;

    try {
      const [result] = await Location.geocodeAsync(query);
      if (!result) continue;

      const coords = { latitude: result.latitude, longitude: result.longitude };
      if (hasValidCoordinates(coords)) return coords;
    } catch {
      // Android exige permissão de localização para geocodificar. Se não houver
      // permissão (ou o aparelho não encontrar o endereço), o usuário ainda pode
      // usar o botão de localização atual.
      return null;
    }
  }

  return null;
}

// Created by AI.
export async function getCurrentAddress(): Promise<{
  address: Partial<AddressFields>;
  coords: Coordinates;
}> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new AddressServiceError('Permissão de localização negada.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const coords = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  if (!hasValidCoordinates(coords)) {
    throw new AddressServiceError('Não foi possível obter uma localização válida.');
  }

  const [result] = await Location.reverseGeocodeAsync(coords);
  if (!result) {
    return { address: {}, coords };
  }

  const cep = onlyDigits(result.postalCode ?? '');
  let estado = result.region ?? '';
  let cidade = result.city ?? result.subregion ?? '';
  let bairro = result.district ?? result.subregion ?? '';
  let rua = result.street ?? result.name ?? '';

  if (cep.length === 8 && (!estado || estado.length !== 2)) {
    try {
      const viaCep = await lookupCep(cep);
      estado = viaCep.estado;
      cidade = cidade || viaCep.cidade;
      bairro = bairro || viaCep.bairro;
      rua = rua || viaCep.rua;
    } catch {
      // Mantém o que o reverse geocode conseguiu preencher.
    }
  }

  return {
    address: {
      cep,
      rua,
      numero: result.streetNumber ?? '',
      bairro,
      cidade,
      estado: estado.length === 2 ? estado.toUpperCase() : estado,
      complemento: '',
    },
    coords,
  };
}
