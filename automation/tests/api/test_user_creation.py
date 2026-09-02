import requests

# Criação de usuário - /auth/register
def test_create_user(api_base_url, create_uuid):
    name = create_uuid # Não precisa do () pois estamos chamando uma fixture
    password = create_uuid # Não precisa do () pois estamos chamando uma fixture
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 201
    
# --- Testes para casos de erro na criação de usuário ---
# Criação de usuário com email inválido
def test_create_user_invalid_email(api_base_url, create_uuid):
    name = create_uuid
    password = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}example.com",  # Email inválido (sem @)
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Criação de usuário com email inválido (formato incorreto)
def test_create_user_invalid_email_format(api_base_url, create_uuid):
    name = create_uuid
    password = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}@example",  # Email inválido (sem domínio)
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Criação de usuário com email inválido (espaços)
def test_create_user_invalid_email_format_with_spaces(api_base_url, create_uuid):
    name = create_uuid
    password = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name} @example.com",  # Email inválido (espaço)
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)

# Criação de usuário com campos obrigatórios ausentes
def test_create_user_missing_fields(api_base_url):
    new_user_data = {
        "nome": "Test User"
        # Campos obrigatórios "email" e "senha" estão ausentes
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)

# Criação de usuário com email duplicado
def test_create_user_duplicate_email(api_base_url, register_user):
    # Tenta registrar outro usuário com o mesmo email
    duplicate_user_data = {
        "nome": "Duplicate User",
        "email": register_user["email"],  # Email já registrado
        "senha": "anotherpassword"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=duplicate_user_data)
    assert resp.status_code == 409  # Espera-se um erro de conflito (409 Conflict)

# Criação de usuário com senha curta
def test_create_user_short_password(api_base_url, create_uuid):
    name = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": "123"  # Senha curta
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)
    
# Criação de usuário com caracteres especiais no nome
def test_create_user_special_characters_in_name(api_base_url, create_uuid):
    name = create_uuid + "!@#$%^&*()"  # Nome com caracteres especiais
    password = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)

# Criação de usuário com campos vazios
def test_create_user_empty_name(api_base_url, create_uuid):
    password = create_uuid
    new_user_data = {
        "nome": "",  # Nome vazio
        "email": f"{password}@example.com",
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)

# Criação de usuário com senha vazia
def test_create_user_empty_password(api_base_url, create_uuid):
    name = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": f"{name}@example.com",
        "senha": ""  # Senha vazia
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)

# Criação de usuário com email vazio
def test_create_user_empty_email(api_base_url, create_uuid):
    name = create_uuid
    password = create_uuid
    new_user_data = {
        "nome": f"{name}",
        "email": "",  # Email vazio
        "senha": f"{password}"
    }
    resp = requests.post(f"{api_base_url}/auth/register", json=new_user_data)
    assert resp.status_code == 400  # Espera-se um erro de validação (400 Bad Request)