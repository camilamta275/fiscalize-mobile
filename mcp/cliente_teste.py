import asyncio

from fastmcp import Client

from servidor import mcp


async def main():
    # Conecta direto no objeto do servidor (em memória)
    async with Client(mcp) as cliente:
        ferramentas = await cliente.list_tools()
        print("Ferramentas disponíveis:")
        for ferramenta in ferramentas:
            print(f"  - {ferramenta.name}: {ferramenta.description}")

        tabelas = await cliente.call_tool("listar_tabelas", {})
        print("\nTabelas:", tabelas.data)

        pergunta = input("\nFaça uma pergunta sobre o banco (ou Enter para sair): ")
        if pergunta:
            resultado = await cliente.call_tool("perguntar_ao_banco", {"pergunta": pergunta})
            print("\nSQL gerado:", resultado.data["sql"])
            print("Resposta:", resultado.data["resposta"])


asyncio.run(main())
