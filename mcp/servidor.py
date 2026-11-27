import os
from pathlib import Path

from dotenv import load_dotenv
from fastmcp import FastMCP

from assistente import AssistenteGPT
from banco import BancoNeon

# 1) Lê as variáveis: mcp/.env primeiro e, como reserva, o etl/.env (DATABASE_URL)
AQUI = Path(__file__).resolve().parent
load_dotenv(AQUI / ".env")
load_dotenv(AQUI.parent / "etl" / ".env")

url_banco = os.getenv("NEON") or os.getenv("DATABASE_URL")

# 2) Objetos que fazem o trabalho de verdade
# TODO (Exercício 3): trocar BancoNeon por BancoComLimite (criar em banco.py).
banco = BancoNeon(url_banco)
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


# TODO (Exercício 1): criar a ferramenta contar_linhas(tabela: str) -> int, que devolve
# quantas linhas a tabela tem. Valide o nome da tabela contra banco.listar_tabelas()
# antes de montar o SQL (nome de tabela não pode ir no %s).


if __name__ == "__main__":
    mcp.run()  # padrão: transporte stdio
