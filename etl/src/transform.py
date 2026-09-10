import pandas as pd

class Transform:
    """
        Responsável por transformar os dados extraídos, deixando-os prontos
        para carga em um banco relacional (SQLite).
    """
     
    def __init__(self):
        pass

    def transform_clima(self, data: dict) -> pd.DataFrame:
        """
        Transforma os dados climáticos da API Open-Meteo em um DataFrame.

        Parâmetros:
            data: resultado bruto retornado pela API Open-Meteo.

        Retorna:
            DataFrame com data, temperatura média e precipitação.
        """

        # Cria um DataFrame a partir dos dados de clima obtidos da API, 
        # contendo as colunas "data", "precipitacao" e "temperatura".
        daily = data["daily"] 

        df = pd.DataFrame({
            "data": daily["time"],
            "temperatura": daily["temperature_2m_mean"],
            "precipitacao": daily["precipitation_sum"]
        })

        # Converte a coluna "data" do DataFrame para o tipo datetime e extrai apenas a data
        df["data"] = pd.to_datetime(df["data"]) 
 
        print("Dados climáticos transformados com sucesso!")

        return df

    def merge_chamados_clima(
        self,
        chamados: list[dict],
        df_clima: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Combina os chamados com os dados climáticos
        correspondentes à data de cada chamado.

        Parâmetros:
            chamados: lista de chamados.
            df_clima: DataFrame com os dados climáticos transformados.

        Retorna:
            DataFrame com os chamados enriquecidos com os dados climáticos.
        """

        df_chamados = pd.DataFrame(chamados)

        df_chamados["data"] = pd.to_datetime(
            df_chamados["criadoem"]
        ).dt.date

        df_clima["data"] = pd.to_datetime(
            df_clima["data"]
        ).dt.date

        df_final = df_chamados.merge(
            df_clima,
            on="data",
            how="left"
        )

        print("Chamados e dados climáticos combinados com sucesso!")

        return df_final

    def transform_populacao(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Transforma os dados demográficos do IBGE,
        mantendo apenas os dados necessários dos bairros de Recife.

        Parâmetros:
            data: DataFrame bruto extraído do IBGE.

        Retorna:
            DataFrame com código, bairro e população.

        V01006 = Quantidade de moradores
        codigo_recife = 2611606 (RECIFE)
        """

        df = data[
            ["CD_BAIRRO", "NM_BAIRRO", "V01006"]
        ].copy()

        df = df.rename(
            columns={
                "CD_BAIRRO": "codigo_bairro",
                "NM_BAIRRO": "bairro",
                "V01006": "populacao"
            }
        )

        codigo_recife = "2611606"

        df = df[
            df["codigo_bairro"]
            .astype(str)
            .str.startswith(codigo_recife)
        ].copy()

        df["bairro"] = (
            df["bairro"]
            .str.strip()
            .str.upper()
        )

        df["populacao"] = pd.to_numeric(
            df["populacao"],
            errors="coerce"
        )

        print("Dados de população transformados com sucesso!")

        return df

    def merge_chamados_populacao(
        self,
        chamados: list[dict],
        df_populacao: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Combina os chamados com os dados de população
        dos bairros e calcula a quantidade de chamados por 1.000 habitantes.

        Parâmetros:
            chamados: lista de chamados.
            df_populacao: DataFrame com os dados de população dos bairros.

        Retorna:
            DataFrame com chamados, população e chamados por 1.000 habitantes.
        """

        df_chamados = pd.DataFrame(chamados)

        # Conta quantos chamados existem em cada bairro
        df_chamados_por_bairro = (
            df_chamados
            .groupby("bairro")
            .size()
            .reset_index(name="chamados")
        )

        # Padroniza os nomes dos bairros
        df_chamados_por_bairro["bairro"] = (
            df_chamados_por_bairro["bairro"]
            .str.strip()
            .str.upper()
        )

        df_populacao["bairro"] = (
            df_populacao["bairro"]
            .str.strip()
            .str.upper()
        )

        # Junta chamados e população pelo bairro
        df_bairros = df_chamados_por_bairro.merge(
            df_populacao[
                ["codigo_bairro", "bairro", "populacao"]
            ],
            on="bairro",
            how="left"
        )

        # Calcula chamados por 1.000 habitantes
        df_bairros["chamados_por_1000"] = (
            df_bairros["chamados"]
            / df_bairros["populacao"]
        ) * 1000

        df_bairros["chamados_por_1000"] = (
            df_bairros["chamados_por_1000"]
            .round(2)
        )

        print(
            "Chamados e população combinados com sucesso!"
        )

        return df_bairros