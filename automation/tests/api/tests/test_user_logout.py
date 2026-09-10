import requests
from automation.tests.api.config.settings import Endpoints as endpoints

# Logout de usuário - /auth/logout
def test_logout_user(authenticate_user):
    token = authenticate_user # Não precisa do () pois estamos chamando uma fixture
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(endpoints.LOGOUT, headers=headers)
    assert resp.status_code == 200

# Logout de usuário sem token
def test_logout_user_without_token():
    resp = requests.post(endpoints.LOGOUT)
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized)

# Logout de usuário com token inválido
def test_logout_user_with_invalid_token():
    headers = {"Authorization": "Bearer invalid_token"}
    resp = requests.post(endpoints.LOGOUT, headers=headers)
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized)