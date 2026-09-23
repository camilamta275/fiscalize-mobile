import { LoginView } from '@/views/login-view';

/**
 * Route — the expo-router entry for `/login`. Reachable only while signed
 * out; `Stack.Protected` in src/app/_layout.tsx redirects here automatically.
 */
export default function LoginRoute() {
  return <LoginView />;
}
