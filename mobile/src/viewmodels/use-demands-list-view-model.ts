import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { DemandStatus } from '@/models/demand';
import { ApiError } from '@/models/api-error';
import { useDemands } from '@/contexts/demand-context';
import * as categoryService from '@/services/category-service';
import * as demandService from '@/services/demand-service';
import type { Category } from '@/models/category';
import type { DemandOrganization } from '@/services/demand-service';

/**
 * ViewModel — owns the state and the actions of the demands list screen.
 *
 * Pagination is page-based (the API's own shape — `page`/`limit`/`totalPages`
 * in DemandListResult), driven by the View's FlatList `onEndReached`: each
 * call appends a page rather than replacing the list, while `refresh` (pull
 * to refresh, or a filter/search change) resets back to page 1.
 *
 * The fetched pages live in the shared demand store (contexts/demand-context),
 * not here: remounting the screen with the same filters shows them at once and
 * revalidates in the background, and a demand created or edited elsewhere is
 * reflected without a manual refresh.
 */
// Updated by AI.
export function useDemandsListViewModel() {
  const { list, isListStale, storeListPage } = useDemands();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DemandStatus | null>(null);
  const [orgaoFilter, setOrgaoFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'priority' | 'sla'>('recent');
  const [organizations, setOrganizations] = useState<DemandOrganization[]>([]);

  const listKey = JSON.stringify([search, statusFilter, orgaoFilter, categoryFilter, sortBy]);
  // Only a list produced by the current filters may be shown; anything else
  // in the store belongs to a previous query.
  const cached = list?.key === listKey ? list : null;
  const demands = cached?.items ?? [];
  const page = cached?.page ?? 1;
  const totalPages = cached?.totalPages ?? 1;

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode === 'more') setIsLoadingMore(true);
      setError(null);

      try {
        const result = await demandService.list({
          page: targetPage,
          regiao: search || undefined,
          status: statusFilter ?? undefined,
          orgao: orgaoFilter ?? undefined,
          categoria: categoryFilter ?? undefined,
          ordenacao: sortBy,
        });
        storeListPage(listKey, result);
      } catch (caught) {
        setError(
          caught instanceof ApiError ? caught.message : 'Erro inesperado ao buscar ocorrências.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [search, statusFilter, orgaoFilter, categoryFilter, sortBy, listKey, storeListPage]
  );

  const refresh = useCallback(() => fetchPage(1, 'refresh'), [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading || isRefreshing || page >= totalPages) return;
    void fetchPage(page + 1, 'more');
  }, [fetchPage, isLoadingMore, isLoading, isRefreshing, page, totalPages]);

  // Runs on mount and every time a filter or the sort order changes — each
  // restarts the list from page 1, same as `refresh`. With a cached list for
  // this exact query it revalidates silently instead of showing the spinner.
  useEffect(() => {
    if (cached) {
      void demandService
        .list({
          page: 1,
          regiao: search || undefined,
          status: statusFilter ?? undefined,
          orgao: orgaoFilter ?? undefined,
          categoria: categoryFilter ?? undefined,
          ordenacao: sortBy,
        })
        .then((result) => storeListPage(listKey, result))
        .catch(() => {
          // Keep showing the cached list; the next pull-to-refresh surfaces errors.
        });
      return;
    }
    void fetchPage(1, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  // A demand created from the form can't be placed in the list locally (the
  // filters and sort order decide where it goes), so reload when it comes back.
  useFocusEffect(
    useCallback(() => {
      if (isListStale) void fetchPage(1, 'refresh');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isListStale])
  );

  useEffect(() => {
    void categoryService
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
    void demandService
      .listOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]));
  }, []);

  return {
    demands,
    // A cached list for the current query is shown instead of the spinner.
    isLoading: isLoading && !cached,
    isRefreshing,
    isLoadingMore,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    orgaoFilter,
    setOrgaoFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    sortBy,
    setSortBy,
    organizations,
    refresh,
    loadMore,
  };
}
