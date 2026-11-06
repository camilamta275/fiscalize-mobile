import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/models/api-error';
import type { DemandStatus } from '@/models/demand';
import { useDemands } from '@/contexts/demand-context';

/**
 * ViewModel — loads one demand for the detail screen. It re-fetches whenever
 * the screen regains focus, so coming back from the edit form shows the new
 * data (and the new timeline event) without a manual pull-to-refresh.
 *
 * It reads through the shared demand store: if the demand is already known
 * (from the list or an earlier visit) it renders that immediately and only
 * the revalidation runs in the background, instead of a blank loading state.
 *
 * It also owns the delete action (the ⋮ menu on the screen): the store drops
 * the demand from its caches and the View navigates back to the list.
 *
 * The Gestor's status update lives here too: it delegates to the store's
 * `updateDemandStatus` and, on failure, keeps the inline `statusError` for the
 * status picker modal to display (the modal stays open, per the delete menu's
 * pattern).
 */
// Created by AI.
// Updated by AI.
export function useDemandDetailViewModel(demandId: string) {
  const { getCached, fetchDetail, deleteDemand: removeDemand, updateDemandStatus } = useDemands();
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // `DemandDetail` makes every extra field optional precisely so a cached
  // list item still type-checks here.
  const demand = getCached(demandId);
  const isLoading = isFetching && !demand;

  const load = useCallback(async () => {
    try {
      await fetchDetail(demandId);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Não foi possível carregar esta ocorrência.'
      );
    } finally {
      setIsFetching(false);
    }
  }, [demandId, fetchDetail]);

  // Created by AI.
  const deleteDemand = useCallback(async () => {
    setIsDeleting(true);
    try {
      await removeDemand(demandId);
    } finally {
      setIsDeleting(false);
    }
  }, [demandId, removeDemand]);

  // Created by AI.
  // The thrown error is rethrown on purpose: the View keeps the modal open
  // and shows it from `statusError`.
  const updateStatus = useCallback(
    async (status: DemandStatus) => {
      setIsUpdatingStatus(true);
      setStatusError(null);
      try {
        await updateDemandStatus(demandId, status);
      } catch (caught) {
        setStatusError(
          caught instanceof ApiError
            ? caught.message
            : 'Erro inesperado ao atualizar o status.'
        );
        throw caught;
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [demandId, updateDemandStatus]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    demand,
    isLoading,
    error,
    isDeleting,
    deleteDemand,
    reload: load,
    isUpdatingStatus,
    statusError,
    updateStatus,
  };
}
