import requests

# Logout de usuário - /auth/logout
def test_logout_user(api_base_url, authenticate_user):
    token = authenticate_user # Não precisa do () pois estamos chamando uma fixture
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{api_base_url}/auth/logout", headers=headers)
    assert resp.status_code == 200

# Logout de usuário sem token
def test_logout_user_without_token(api_base_url):
    resp = requests.post(f"{api_base_url}/auth/logout")
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized)

# Logout de usuário com token inválido
def test_logout_user_with_invalid_token(api_base_url):
    headers = {"Authorization": "Bearer invalid_token"}
    resp = requests.post(f"{api_base_url}/auth/logout", headers=headers)
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized)