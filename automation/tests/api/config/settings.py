# Updated by AI.
class Endpoints:
    """Configuration for Fiscalize backend API endpoints"""
    BASE_URL = "http://localhost:3000"
    LOGIN = f"{BASE_URL}/auth/login"
    REFRESH = f"{BASE_URL}/auth/refresh"
    REGISTER = f"{BASE_URL}/auth/register"
    LOGOUT = f"{BASE_URL}/auth/logout"
    HEALTH = f"{BASE_URL}/health"
    GET_USER = f"{BASE_URL}/auth/me"
    EXPORT_USER = f"{GET_USER}/export"
    ANONYMIZATION = f"{GET_USER}/anonymization"
    DEMANDS = f"{BASE_URL}/demands"