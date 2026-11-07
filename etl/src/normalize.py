# Created by AI.
import unicodedata


# Created by AI.
def normalize_bairro(value: str | None) -> str | None:
    """
    Normaliza o nome do bairro para o mesmo formato usado pelo IBGE:
    trim, maiúsculas, sem acentos e com espaços colapsados.
    """
    if value is None:
        return None

    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "nat"}:
        return None

    text = " ".join(text.upper().split())
    text = unicodedata.normalize("NFKD", text)
    text = "".join(char for char in text if not unicodedata.combining(char))
    return text or None
