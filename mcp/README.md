# Servidor MCP — Fiscalize ETL

Servidor MCP (FastMCP) que consulta o Neon (camadas silver/gold do ETL) e usa um LLM
compatível com a API da OpenAI para responder perguntas em português. Baseado na aula 10.

## Configuração
```bash
cd mcp
python -m venv .venv && source .venv/bin/activate   # Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # preencha GPT (chave do LLM); NEON é opcional
```
Sem `NEON`, usa o `DATABASE_URL` de `../etl/.env`. Chave gratuita do Groq: console.groq.com.
O modelo é configurado pela variável `MODELO`; se ela estiver vazia ou ausente,
o padrão é `gpt-6-luna`.

## Uso
- Terminal: `python cliente_teste.py`
- Inspector: `fastmcp dev inspector servidor.py`
- Claude Desktop / VS Code: `command` = python do `.venv`, `args` = caminho do `servidor.py`.

## Segurança
Conexão `readonly=True` (o banco recusa DELETE/UPDATE/DROP), `%s` nas consultas parametrizadas,
O `.env` nunca vai para o Git.
Atenção: `perguntar_ao_banco` envia o esquema e as linhas retornadas ao provedor de LLM.

## Atividades pendentes (TODO)
As atividades pendentes têm um comentário `TODO` no código, no ponto onde devem ser feitas.
- [x] **Exercício 1** (`servidor.py`): ferramenta `contar_linhas(tabela: str) -> int`.
- [x] **Exercício 2** (`servidor.py`, `assistente.py`): ler o modelo do `.env` (`MODELO`), com padrão `gpt-6-luna`.
- [x] **Exercício 3** (`banco.py`, `servidor.py`): classe `BancoComLimite(BancoNeon)` com no máximo 10 linhas em `consultar`.
- [ ] **Teste de segurança**: no Inspector, `executar_select` com `DELETE FROM ...` deve ser recusado (read-only).

## Provedor de LLM
Usamos o Groq (gratuito): no `.env`, `LLM_BASE_URL=https://api.groq.com/openai/v1` e `GPT=<chave do Groq>`.
