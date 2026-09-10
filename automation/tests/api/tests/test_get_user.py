import requests
from automation.tests.api.config.settings import Endpoints as endpoints

# Obter perfil do usuário - /auth/me
def test_get_user_profile(authenticate_user):
    token = authenticate_user # Não precisa do () pois estamos chamando uma fixture
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(endpoints.GET_USER, headers=headers )
    assert resp.status_code == 200

# Não autenticado — token ausente, inválido, expirado ou revogado.
def test_get_user_profile_without_token():
    resp = requests.get(endpoints.GET_USER)
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized) 