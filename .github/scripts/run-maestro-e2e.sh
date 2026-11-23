#!/usr/bin/env bash
# Executado de dentro do reactivecircus/android-emulator-runner,
# com o emulador já iniciado.
# Toda a lógica multilinha fica neste arquivo Bash.
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP não definido}"

# Raiz do repositório no PYTHONPATH.
# Permite que os scripts importem corretamente o pacote automation.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PYTHONPATH="$REPO_ROOT${PYTHONPATH:+:$PYTHONPATH}"

METRO_PORT=8081
METRO_LOG="$RUNNER_TEMP/maestro-metro.log"
METRO_PID_FILE="$RUNNER_TEMP/maestro-metro.pid"

# Variáveis usadas no build e no Metro do app mobile.
E2E_ENV=(
  MAESTRO_E2E_BUILD=true
  EAS_BUILD_PROFILE=e2e
  NODE_ENV=development
  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
  EXPO_PUBLIC_E2E=true
  MAESTRO_E2E_DEVICE_ID=fiscalize-maestro-ci
)

# Guarda as credenciais e remove do ambiente para que não
# sejam repassadas desnecessariamente ao Gradle, Metro e npx.
tc02_email="${MAESTRO_TC02_EMAIL:-}"
tc03_email="${MAESTRO_TC03_EMAIL:-}"
tc03_password="${MAESTRO_TC03_PASSWORD:-}"
tc06_email="${MAESTRO_TC06_EMAIL:-}"
tc06_password="${MAESTRO_TC06_PASSWORD:-}"

unset MAESTRO_TC02_EMAIL MAESTRO_TC03_EMAIL MAESTRO_TC03_PASSWORD
unset MAESTRO_TC06_EMAIL MAESTRO_TC06_PASSWORD

# Encerra o Metro ao finalizar o script.
cleanup() {
  if [ -f "$METRO_PID_FILE" ]; then
    kill "$(cat "$METRO_PID_FILE")" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Aceita as licenças do Android SDK.
# O código 141 é permitido porque o yes pode receber SIGPIPE
# quando o sdkmanager fecha o stdin após concluir a leitura.
set +e
yes | sdkmanager --licenses > /dev/null 2>&1
license_status=$?
set -e

if [[ "$license_status" -ne 0 && "$license_status" -ne 141 ]]; then
  echo "Falha ao aceitar licenças do Android SDK. Código: $license_status" >&2
  exit "$license_status"
fi

# Instala a plataforma e os build-tools necessários.
sdkmanager --install "platforms;android-36" "build-tools;36.0.0"

# Inicia o Metro em background.
(
  cd mobile
  env "${E2E_ENV[@]}" \
    npx expo start --dev-client --host localhost --port "$METRO_PORT" \
    > "$METRO_LOG" 2>&1 &
  echo $! > "$METRO_PID_FILE"
)

# Aguarda o Metro responder.
metro_ready=false

for _ in $(seq 1 30); do
  if curl --fail --silent "http://localhost:${METRO_PORT}/status" > /dev/null; then
    metro_ready=true
    break
  fi

  sleep 2
done

if [ "$metro_ready" != true ]; then
  echo "Metro não respondeu em http://localhost:${METRO_PORT}/status" >&2
  cat "$METRO_LOG"
  exit 1
fi

# Configura o encaminhamento de portas entre host e emulador.
adb reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}"

# Build e instalação do aplicativo Android.
(
  cd mobile
  env "${E2E_ENV[@]}" \
    npx expo run:android --variant debug --no-bundler
)

adb shell pm grant br.com.fiscalize.mobile android.permission.POST_NOTIFICATIONS
adb shell pm grant br.com.fiscalize.mobile android.permission.ACCESS_FINE_LOCATION
adb shell pm grant br.com.fiscalize.mobile android.permission.ACCESS_COARSE_LOCATION
adb shell pm grant br.com.fiscalize.mobile android.permission.CAMERA

# Prepara o dispositivo confiável (TC06).
MAESTRO_TC06_EMAIL="$tc06_email" \
MAESTRO_TC06_PASSWORD="$tc06_password" \
  python automation/scripts/prepare_maestro_trusted_device.py

# Executa os fluxos de testes Maestro.
MAESTRO_TC02_EMAIL="$tc02_email" \
MAESTRO_TC03_EMAIL="$tc03_email" \
MAESTRO_TC03_PASSWORD="$tc03_password" \
MAESTRO_TC06_EMAIL="$tc06_email" \
MAESTRO_TC06_PASSWORD="$tc06_password" \
  python automation/scripts/run_maestro_e2e.py --reset-app-state
