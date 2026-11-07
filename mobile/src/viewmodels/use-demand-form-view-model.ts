import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/models/api-error';
import type { Category } from '@/models/category';
import { BLOCKED_EDIT_STATUSES, type DemandStatus } from '@/models/demand';
import { useDemands } from '@/contexts/demand-context';
import { useAddressForm, type AddressFieldErrors } from '@/hooks/use-address-form';
import { hasValidCoordinates } from '@/services/address-service';
import * as categoryService from '@/services/category-service';

type FormFieldErrors = AddressFieldErrors & {
  title?: string;
  description?: string;
  categoryId?: string;
};

/**
 * ViewModel — owns the state and the actions of both the create and the edit
 * form (they're the same fields hitting different service calls). Passing a
 * `demandId` switches it into edit mode: it loads that demand, prefills the
 * fields, and calls `demandService.update` instead of `.create`.
 *
 * The address block is shared with the registration screens through
 * `useAddressForm`: coordinates are never typed by the user. They come from
 * geocoding the CEP or from the current GPS position, and the View only shows
 * them in read-only grey fields.
 */
// Updated by AI.
export function useDemandFormViewModel(demandId?: string) {
  const isEditing = demandId !== undefined;
  const { fetchDetail, createDemand, updateDemand } = useDemands();
  const {
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
    setCoordinates,
    handleCepChange,
    captureCurrentLocation,
    validate: validateAddress,
  } = useAddressForm({ requireCoordinates: true });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingDemand, setIsLoadingDemand] = useState(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  /**
   * The backend's `chamado.fotourl` column has no counterpart in
   * demandController/demandService — create/update never read or write it,
   * and there's no upload endpoint. So this stays device-local: it's never
   * sent in `submit`, only kept for the View to preview.
   */
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DemandStatus | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
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

    fetchDetail(demandId)
      .then((demand) => {
        setTitle(demand.title);
        setDescription(demand.description);
        setCategoryId(demand.category.id);
        setAddress({
          cep: demand.cep ?? '',
          rua: demand.rua ?? '',
          numero: demand.numero ?? '',
          bairro: demand.bairro ?? '',
          cidade: demand.cidade ?? '',
          estado: demand.estado ?? '',
          complemento: demand.complemento ?? '',
        });

        const loadedCoords = {
          latitude: demand.latitude,
          longitude: demand.longitude,
        };
        if (hasValidCoordinates(loadedCoords)) {
          setCoordinates(loadedCoords);
        }

        setCurrentStatus(demand.status);
      })
      .catch(() => setLoadError('Não foi possível carregar esta ocorrência.'))
      .finally(() => setIsLoadingDemand(false));
  }, [demandId, fetchDetail, setAddress, setCoordinates]);

  const isBlocked = currentStatus !== null && BLOCKED_EDIT_STATUSES.includes(currentStatus);

  const submit = useCallback(async () => {
    const baseErrors = validateBase(title, description, categoryId);
    const addressErrors = validateAddress();
    const errors: FormFieldErrors = { ...baseErrors, ...addressErrors };

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        title,
        description,
        category_id: categoryId!,
        cep: address.cep.replace(/\D/g, ''),
        rua: address.rua.trim(),
        ...(address.numero.trim() && { numero: address.numero.trim() }),
        bairro: address.bairro.trim(),
        cidade: address.cidade.trim(),
        estado: address.estado.trim().toUpperCase(),
        ...(address.complemento.trim() && { complemento: address.complemento.trim() }),
        latitude: coords!.latitude,
        longitude: coords!.longitude,
      };

      if (isEditing) {
        await updateDemand(demandId!, input);
      } else {
        await createDemand(input);
      }
      setDidSucceed(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao salvar a ocorrência.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    description,
    categoryId,
    address,
    coords,
    isEditing,
    demandId,
    createDemand,
    updateDemand,
    validateAddress,
  ]);

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
    address,
    coords,
    cepError,
    addressError,
    coordinatesError,
    isLookingUpCep,
    isCapturingLocation,
    isResolvingCoords,
    updateAddressField: updateField,
    handleCepChange,
    captureCurrentLocation,
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

function validateBase(
  title: string,
  description: string,
  categoryId: number | null
): Pick<FormFieldErrors, 'title' | 'description' | 'categoryId'> {
  const errors: Pick<FormFieldErrors, 'title' | 'description' | 'categoryId'> = {};

  if (title.trim().length < 5) {
    errors.title = 'Título deve ter no mínimo 5 caracteres';
  }
  if (description.trim().length < 20) {
    errors.description = 'Descrição deve ter no mínimo 20 caracteres';
  }
  if (categoryId === null) {
    errors.categoryId = 'Selecione uma categoria';
  }

  return errors;
}
