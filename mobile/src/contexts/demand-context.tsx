import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Demand, DemandDetail, DemandListResult } from '@/models/demand';
import { useSession } from '@/contexts/session-context';
import * as demandService from '@/services/demand-service';

/**
 * Context — the app's shared demand state ("demandStore"), same pattern as
 * `session-context.tsx`. It keeps what the API already returned so the list,
 * the detail and the form read from one place instead of each screen
 * refetching into its own `useState`:
 *
 * - `list` is the last page-accumulated result, tagged with the `listKey` of
 *   the filters that produced it. A screen that remounts with the same
 *   filters renders it right away and revalidates in the background.
 * - `details` holds the full `GET /demands/:id` payloads by id. The detail
 *   screen can fall back to the list item while the fresh one loads.
 * - `create`/`update` write their result back here, so the list reflects an
 *   edit without a refetch and knows (`isListStale`) when a creation means it
 *   must be reloaded.
 *
 * The store is wiped whenever the signed-in user changes, so one account's
 * demands are never shown to the next.
 */

// Created by AI.
type DemandListState = {
  key: string;
  items: Demand[];
  page: number;
  totalPages: number;
};

// Created by AI.
type DemandContextValue = {
  list: DemandListState | null;
  isListStale: boolean;
  // `DemandDetail` only adds optional fields, so a list item is a valid one.
  getCached: (id: string) => DemandDetail | null;
  storeListPage: (key: string, result: DemandListResult) => void;
  fetchDetail: (id: string) => Promise<DemandDetail>;
  createDemand: (input: demandService.DemandInput) => Promise<Demand>;
  updateDemand: (id: string, input: demandService.DemandInput) => Promise<Demand>;
};

// Created by AI.
const DemandContext = createContext<DemandContextValue | null>(null);

// Created by AI.
export function useDemands() {
  const value = use(DemandContext);
  if (!value) {
    throw new Error('useDemands must be used within a <DemandProvider />');
  }
  return value;
}

// Created by AI.
export function DemandProvider({ children }: PropsWithChildren) {
  const { usuario } = useSession();
  const userId = usuario?.id ?? null;

  const [list, setList] = useState<DemandListState | null>(null);
  const [details, setDetails] = useState<Record<string, DemandDetail>>({});
  const [isListStale, setIsListStale] = useState(false);

  // The store is wiped when the signed-in user changes, so one account's
  // demands are never shown to the next. Resetting during render (rather than
  // in an effect) avoids painting a frame with the previous user's data.
  const [ownerId, setOwnerId] = useState(userId);
  if (ownerId !== userId) {
    setOwnerId(userId);
    setList(null);
    setDetails({});
    setIsListStale(false);
  }

  // Only read during render (detail screen), so it may change identity with
  // the state it reads — it's never used as an effect dependency.
  const getCached = useCallback(
    (id: string): DemandDetail | null =>
      details[id] ?? list?.items.find((item) => item.id === id) ?? null,
    [list, details]
  );

  const storeListPage = useCallback((key: string, result: DemandListResult) => {
    setList((previous) => {
      // Page 1, or a different filter set, replaces; later pages append.
      const append = result.page > 1 && previous?.key === key;
      const known = new Set(append ? previous.items.map((item) => item.id) : []);
      const incoming = result.data.filter((item) => !known.has(item.id));
      return {
        key,
        items: append ? [...previous.items, ...incoming] : result.data,
        page: result.page,
        totalPages: result.totalPages,
      };
    });
    setIsListStale(false);
  }, []);

  // Writes a changed demand's list fields into its list item, if it's loaded.
  const patchListItem = useCallback((demand: Demand | DemandDetail) => {
    const fields = pickListFields(demand);
    setList((previous) =>
      previous
        ? {
            ...previous,
            items: previous.items.map((item) =>
              item.id === demand.id ? { ...item, ...fields } : item
            ),
          }
        : previous
    );
  }, []);

  const fetchDetail = useCallback(
    async (id: string) => {
      const detail = await demandService.getById(id);
      setDetails((previous) => ({ ...previous, [id]: detail }));
      patchListItem(detail);
      return detail;
    },
    [patchListItem]
  );

  const createDemand = useCallback(async (input: demandService.DemandInput) => {
    const created = await demandService.create(input);
    // Where the new item lands depends on the active filters and sort order,
    // so the list is flagged for a reload instead of guessing its position.
    setIsListStale(true);
    return created;
  }, []);

  const updateDemand = useCallback(
    async (id: string, input: demandService.DemandInput) => {
      const updated = await demandService.update(id, input);
      patchListItem(updated);
      // The detail's timeline gained an event the PUT response doesn't carry,
      // so the cached detail is dropped and refetched on next focus.
      setDetails((previous) => {
        const { [id]: _stale, ...rest } = previous;
        return rest;
      });
      return updated;
    },
    [patchListItem]
  );

  const value = useMemo(
    () => ({
      list,
      isListStale,
      getCached,
      storeListPage,
      fetchDetail,
      createDemand,
      updateDemand,
    }),
    [list, isListStale, getCached, storeListPage, fetchDetail, createDemand, updateDemand]
  );

  return <DemandContext.Provider value={value}>{children}</DemandContext.Provider>;
}

// Created by AI.
// Only the fields the list endpoint serializes, and only those actually
// present — a partial PUT response must not blank out the list item.
function pickListFields(demand: Demand | DemandDetail): Partial<Demand> {
  const keys: (keyof Demand)[] = [
    'protocolo',
    'title',
    'description',
    'status',
    'location',
    'latitude',
    'longitude',
    'category',
    'creator',
    'createdAt',
    'updatedAt',
  ];
  const fields: Partial<Demand> = {};
  for (const key of keys) {
    if (demand[key] !== undefined) Object.assign(fields, { [key]: demand[key] });
  }
  return fields;
}
