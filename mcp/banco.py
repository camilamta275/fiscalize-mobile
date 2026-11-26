import psycopg2


class BancoNeon:
    def __init__(self, url_conexao):
        # Guarda a URL de conexão (vem do arquivo .env)
        self.url_conexao = url_conexao

    def _conectar(self):
        # Abre uma conexão nova com o banco
        conexao = psycopg2.connect(self.url_conexao)
        # Modo somente leitura: o banco recusa INSERT, UPDATE, DELETE, DROP...
        conexao.set_session(readonly=True)
        return conexao

    def consultar(self, sql):
        """Executa um SELECT e devolve uma lista de dicionários."""
        conexao = self._conectar()
        try:
            with conexao.cursor() as cursor:
                cursor.execute(sql)
                colunas = [coluna[0] for coluna in cursor.description]
                linhas = cursor.fetchall()
        finally:
            conexao.close()
        # Transforma cada linha em um dicionário {coluna: valor}
        return [dict(zip(colunas, linha)) for linha in linhas]

    def listar_tabelas(self):
        """Retorna o nome de todas as tabelas do schema public."""
        sql = """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """
        return [linha["table_name"] for linha in self.consultar(sql)]

    def descrever_tabela(self, tabela):
        """Retorna as colunas e os tipos de uma tabela."""
        conexao = self._conectar()
        try:
            with conexao.cursor() as cursor:
                # O %s evita SQL Injection: o psycopg2 trata o valor com segurança
                cursor.execute(
                    """
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position
                    """,
                    (tabela,),
                )
                return [{"coluna": c, "tipo": t} for c, t in cursor.fetchall()]
        finally:
            conexao.close()

    def esquema_completo(self):
        """Monta um texto com todas as tabelas e colunas (usado pelo GPT)."""
        texto = ""
        for tabela in self.listar_tabelas():
            colunas = self.descrever_tabela(tabela)
            lista = ", ".join(f"{c['coluna']} ({c['tipo']})" for c in colunas)
            texto += f"- {tabela}: {lista}\n"
        return texto


# Created by AI.
class BancoComLimite(BancoNeon):
    # Created by AI.
    def __init__(self, url_conexao):
        super().__init__(url_conexao)

    # Created by AI.
    def consultar(self, sql):
        """Executa a consulta herdada e devolve no máximo 10 linhas."""
        return super().consultar(sql)[:10]
