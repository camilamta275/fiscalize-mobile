import requests

# Verificação de saúde do serviço
def test_api(api_base_url):
    resp = requests.get(f"{api_base_url}/health")
    assert resp.status_code == 200

# Criar demanda/chamado
def test_create_demand(api_base_url, authenticate_user):
    token = authenticate_user
    headers = {"Authorization": f"Bearer {token}"}
    demand_data = {
        "title": "Buraco na pista",
        "description": "Buraco grande na via causando risco a pedestres e veiculos.",
        "category_id": 1,
        "location": "Rua Principal, 123, Recife - PE",
        "latitude": -8.05,
        "longitude": -34.9,
    }
    resp = requests.post(f"{api_base_url}/demands", json=demand_data, headers=headers)
    assert resp.status_code == 201