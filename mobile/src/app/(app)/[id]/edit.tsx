import { useLocalSearchParams } from 'expo-router';

import { DemandFormView } from '@/views/demand-form-view';

/**
 * Route — `/ocorrencias/[id]/edit`, reached from the "Editar ocorrência"
 * button on the detail screen. Reuses the same form as `new`, in edit mode.
 */
// Created by AI.
export default function EditOcorrenciaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DemandFormView demandId={id} />;
}
