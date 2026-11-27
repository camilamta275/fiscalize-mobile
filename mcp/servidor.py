import os
from pathlib import Path

from dotenv import load_dotenv
from fastmcp import FastMCP

from assistente import AssistenteGPT
from banco import BancoComLimite

# 1) Lê as variáveis: mcp/.env primeiro e, como reserva, o etl/.env (DATABASE_URL)
AQUI = Path(__file__).resolve().parent
load_dotenv(AQUI / ".env")
load_dotenv(AQUI.parent / "etl" / ".env")

url_banco = os.getenv("NEON") or os.getenv("DATABASE_URL")

# 2) Objetos que fazem o trabalho de verdade
# Updated by AI.
# BancoComLimite devolve no máximo 10 linhas em consultar (Exercício 3).
# Tabelas e colunas não são limitadas: listar_tabelas usa _executar.
banco = BancoComLimite(url_banco)
# Updated by AI.
gpt = AssistenteGPT(
    os.getenv("GPT"),
    modelo=os.getenv("MODELO") or "gpt-6-luna",
    base_url=os.getenv("LLM_BASE_URL") or None,
)

# 3) Servidor MCP
mcp = FastMCP("Servidor Neon + GPT (Fiscalize ETL)")


@mcp.tool
def listar_tabelas() -> list[str]:
    """Lista as tabelas existentes no banco de dados (camadas silver e gold do ETL do Fiscalize)."""
    return banco.listar_tabelas()


@mcp.tool
def descrever_tabela(tabela: str) -> list[dict]:
    """Mostra as colunas e os tipos de uma tabela."""
    return banco.descrever_tabela(tabela)


@mcp.tool
def executar_select(sql: str) -> list[dict]:
    """Executa um comando SELECT no banco e devolve as linhas."""
    return banco.consultar(sql)


@mcp.tool
def perguntar_ao_banco(pergunta: str) -> dict:
    """Responde uma pergunta em português: o GPT gera o SQL, o banco executa e o GPT explica."""
    sql = gpt.gerar_sql(pergunta, banco.esquema_completo())
    dados = banco.consultar(sql)
    resposta = gpt.explicar_resultado(pergunta, dados)
    return {"sql": sql, "dados": dados, "resposta": resposta}


# Created by AI.
@mcp.tool
def contar_linhas(tabela: str) -> int:
    """Devolve quantas linhas a tabela informada possui."""
    # Nome de tabela não pode ir no %s; por isso só é aceito se existir de verdade no banco.
    if tabela not in banco.listar_tabelas():
        raise ValueError(f"Tabela '{tabela}' não existe no banco.")
    # O nome já foi validado acima; as aspas protegem nomes com maiúsculas ou caracteres especiais.
    resultado = banco.consultar(f'SELECT COUNT(*) AS total FROM "{tabela}"')
    return int(resultado[0]["total"])


if __name__ == "__main__":
    mcp.run()  # padrão: transporte stdio
