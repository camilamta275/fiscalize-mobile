import requests

# Obter perfil do usuário - /auth/me
def test_get_user_profile(api_base_url, authenticate_user):
    token = authenticate_user # Não precisa do () pois estamos chamando uma fixture
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{api_base_url}/auth/me", headers=headers )
    assert resp.status_code == 200

# Não autenticado — token ausente, inválido, expirado ou revogado.
def test_get_user_profile_without_token(api_base_url):
    resp = requests.get(f"{api_base_url}/auth/me")
    assert resp.status_code == 401  # Espera-se um erro de não autorizado (401 Unauthorized) 