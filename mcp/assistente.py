from openai import OpenAI


# Updated by AI.
class AssistenteGPT:
    # Updated by AI.
    def __init__(self, chave_api, modelo="gpt-6-luna", base_url=None):
        # base_url permite usar serviços gratuitos compatíveis com a API da OpenAI
        self.cliente = OpenAI(api_key=chave_api, base_url=base_url)
        self.modelo = modelo

    def perguntar(self, instrucao, pergunta):
        """Envia uma pergunta ao GPT e devolve o texto da resposta."""
        resposta = self.cliente.chat.completions.create(
            model=self.modelo,
            messages=[
                {"role": "system", "content": instrucao},
                {"role": "user", "content": pergunta},
            ],
        )
        return resposta.choices[0].message.content.strip()

    def gerar_sql(self, pergunta, esquema):
        """Transforma uma pergunta em português em um comando SELECT."""
        instrucao = (
            "Você é especialista em PostgreSQL. "
            "Com base nas tabelas abaixo, escreva UM comando SELECT que responda à pergunta. "
            "Responda somente com o SQL, sem explicações e sem ```.\n\n"
            f"Tabelas:\n{esquema}"
        )
        sql = self.perguntar(instrucao, pergunta)
        # Remove ``` caso o modelo coloque mesmo assim
        return sql.replace("```sql", "").replace("```", "").strip()

    def explicar_resultado(self, pergunta, dados):
        """Escreve uma resposta amigável a partir dos dados do banco."""
        instrucao = (
            "Responda à pergunta do usuário em português, de forma curta, "
            "usando apenas os dados fornecidos."
        )
        return self.perguntar(instrucao, f"Pergunta: {pergunta}\nDados: {dados}")
