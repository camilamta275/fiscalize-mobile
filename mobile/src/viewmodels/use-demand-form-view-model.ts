import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/models/api-error';
import type { Category } from '@/models/category';
import { BLOCKED_EDIT_STATUSES, type DemandStatus } from '@/models/demand';
import * as categoryService from '@/services/category-service';
import * as demandService from '@/services/demand-service';

/**
 * ViewModel — owns the state and the actions of both the create and the edit
 * form (they're the same fields hitting different service calls). Passing a
 * `demandId` switches it into edit mode: it loads that demand, prefills the
 * fields, and calls `demandService.update` instead of `.create`.
 *
 * Location is captured once, on demand — `captureLocation` only asks for the
 * foreground permission when the user taps the button, and nothing here ever
 * watches position in the background.
 */
export function useDemandFormViewModel(demandId?: string) {
  const isEditing = demandId !== undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingDemand, setIsLoadingDemand] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  /**
   * The backend's `chamado.fotourl` column has no counterpart in
   * demandController/demandService — create/update never read or write it,
   * and there's no upload endpoint. So this stays device-local: it's never
   * sent in `submit`, only kept for the View to preview.
   */
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DemandStatus | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    categoryId?: string;
    location?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  useEffect(() => {
    categoryService
      .list()
      .then(setCategories)
      .catch(() => setLoadError('Não foi possível carregar as categorias.'))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!demandId) return;

    demandService
      .getById(demandId)
      .then((demand) => {
        setTitle(demand.title);
        setDescription(demand.description);
        setCategoryId(demand.category.id);
        setLocation(demand.location);
        setCoords({ latitude: demand.latitude, longitude: demand.longitude });
        setCurrentStatus(demand.status);
      })
      .catch(() => setLoadError('Não foi possível carregar esta ocorrência.'))
      .finally(() => setIsLoadingDemand(false));
  }, [demandId]);

  const isBlocked = currentStatus !== null && BLOCKED_EDIT_STATUSES.includes(currentStatus);

  const captureLocation = useCallback(async () => {
    setError(null);
    setIsCapturingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('Permissão de localização negada.');
        return;
      }
      const position = await Location.getCurrentPositionAsync();
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      // The GPS fix is the point of this button — the address is a courtesy
      // derived from it, not something the user should also have to type.
      // reverseGeocodeAsync can come back empty (offline, no match, etc.), so
      // this always falls back to something submittable.
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        setLocation((address && formatAddress(address)) || formatCoords(latitude, longitude));
      } catch {
        setLocation(formatCoords(latitude, longitude));
      }
    } catch {
      setError('Não foi possível obter sua localização.');
    } finally {
      setIsCapturingLocation(false);
    }
  }, []);

  const submit = useCallback(async () => {
    const errors = validate(title, description, categoryId, location, coords);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        title,
        description,
        category_id: categoryId!,
        // A GPS fix with no address text (edge case: captured, then cleared
        // by hand) still needs *some* string — the backend requires it.
        location: location.trim() || (coords ? formatCoords(coords.latitude, coords.longitude) : ''),
        ...(coords && { latitude: coords.latitude, longitude: coords.longitude }),
      };

      if (isEditing) {
        await demandService.update(demandId!, input);
      } else {
        await demandService.create(input);
      }
      setDidSucceed(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao salvar a ocorrência.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, categoryId, location, coords, isEditing, demandId]);

  return {
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
  };
}

function validate(
  title: string,
  description: string,
  categoryId: number | null,
  location: string,
  coords: { latitude: number; longitude: number } | null
) {
  const errors: {
    title?: string;
    description?: string;
    categoryId?: string;
    location?: string;
  } = {};

  if (title.trim().length < 5) {
    errors.title = 'Título deve ter no mínimo 5 caracteres';
  }
  if (description.trim().length < 20) {
    errors.description = 'Descrição deve ter no mínimo 20 caracteres';
  }
  if (categoryId === null) {
    errors.categoryId = 'Selecione uma categoria';
  }
  // A captured GPS fix satisfies this on its own — the address field only
  // has to be filled by hand when there's no coordinate to fall back to.
  if (!coords && location.trim().length < 10) {
    errors.location = 'Informe o endereço ou use sua localização atual';
  }

  return errors;
}

function formatAddress(address: Location.LocationGeocodedAddress): string {
  // `formattedAddress` is Android-only (see expo-location docs) — iOS never
  // sets it, so this composes from the individual parts either way.
  if (address.formattedAddress) return address.formattedAddress;

  const parts = [
    [address.street, address.streetNumber].filter(Boolean).join(', '),
    address.district,
    address.city,
    address.region,
  ].filter((part): part is string => !!part && part.length > 0);

  return parts.join(', ');
}

function formatCoords(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
