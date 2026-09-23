import { RegisterView } from '@/views/register-view';

/**
 * Route — the expo-router entry for `/register`. Reachable only while signed
 * out, same as `/login` — `Stack.Protected` in src/app/_layout.tsx guards both.
 */
export default function RegisterRoute() {
  return <RegisterView />;
}
