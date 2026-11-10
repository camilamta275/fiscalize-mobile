import pandas as pd

from src.normalize import normalize_bairro


# Created by AI.
SILVER_CHAMADO_COLUMNS = [
    "id",
    "protocolo",
    "categoria",
    "subcategoria",
    "bairro",
    "cidade",
    "estado",
    "latitude",
    "longitude",
    "data_chamado",
    "criadoem",
    "status",
    "prioridade",
    "coordenada_valida",
]

# Created by AI.
GOLD_CHAMADOS_CLIMA_COLUMNS = [
    "id",
    "protocolo",
    "categoria",
    "subcategoria",
    "bairro",
    "data",
    "temperatura",
    "precipitacao",
]

# Created by AI.
GOLD_CHAMADOS_POPULACAO_COLUMNS = [
    "bairro",
    "chamados",
    "codigo_bairro",
    "populacao",
    "chamados_por_1000",
]

# Created by AI.
GOLD_CHAMADOS_CLIMA_DIARIO_COLUMNS = [
    "data",
    "temperatura",
    "precipitacao",
    "chamados",
]


# Updated by AI.
class Transform:
    """
    Transforma os dados brutos (bronze) em tabelas silver normalizadas e,
    a partir delas, gera as tabelas gold consumidas pelo dashboard.
    """

    # Updated by AI.
    def __init__(self):
        pass

    # ------------------------------------------------------------------
    # SILVER
    # ------------------------------------------------------------------

    # Updated by AI.
    def transform_clima(self, data: dict) -> pd.DataFrame:
        """
        Normaliza a carga mais recente do Open-Meteo.

        Retorna o conteúdo da tabela `silver_clima_diario`: uma linha por
        dia, com temperatura média e precipitação total.
        """

        # A extração já restringe o DataFrame à carga mais recente.
        if isinstance(data, pd.DataFrame):
            if data.empty:
                raise ValueError("A carga de clima está vazia.")
            if len(data) != 1:
                raise ValueError(
                    "A carga de clima deve conter um documento com as "
                    "listas diárias completas."
                )
            data = next(iter(
                data.drop(columns=["_id"], errors="ignore").to_dict(
                    orient="records"
                )
            ))

        # Cria um DataFrame a partir dos dados de clima obtidos da API,
        # contendo as colunas "data", "precipitacao" e "temperatura".
        daily = data["daily"]

        df = pd.DataFrame({
            "data": daily["time"],
            "temperatura": daily["temperature_2m_mean"],
            "precipitacao": daily["precipitation_sum"]
        })

        df["temperatura"] = pd.to_numeric(
            df["temperatura"],
            errors="coerce",
        )
        df["precipitacao"] = pd.to_numeric(
            df["precipitacao"],
            errors="coerce",
        )
        df["data"] = pd.to_datetime(df["data"], errors="coerce").dt.date
        df = df.dropna(subset=["data"]).drop_duplicates(subset=["data"])

        print("Dados climáticos transformados com sucesso!")

        return df

    # Created by AI.
    def build_silver_clima_diario(self, data: dict) -> pd.DataFrame:
        """Monta a tabela silver `silver_clima_diario`."""
        df = self.transform_clima(data)
        return df[["data", "temperatura", "precipitacao"]].reset_index(drop=True)

    # Updated by AI.
    def transform_populacao(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Transforma os dados demográficos do IBGE,
        mantendo apenas os dados necessários dos bairros de Recife.

        V01006 = Quantidade de moradores
        codigo_recife = 2611606 (RECIFE)
        """

        if data.empty:
            raise ValueError("A carga de população está vazia.")

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

        df["bairro"] = df["bairro"].map(normalize_bairro)

        df[["codigo_bairro", "bairro"]] = df[
            ["codigo_bairro", "bairro"]
        ].replace(["", "-", "N/A", "NA", "..."], pd.NA)
        df["populacao"] = pd.to_numeric(
            df["populacao"],
            errors="coerce"
        )

        print("Dados de população transformados com sucesso!")

        return df

    # Created by AI.
    def build_silver_bairro_populacao(self, data: pd.DataFrame) -> pd.DataFrame:
        """Monta a tabela silver `silver_bairro_populacao`."""
        df = self.transform_populacao(data)

        df = df.dropna(subset=["codigo_bairro", "bairro"])
        df = df.drop_duplicates(subset=["codigo_bairro"])

        return df[
            ["codigo_bairro", "bairro", "populacao"]
        ].reset_index(drop=True)

    # Created by AI.
    def build_silver_chamado(self, chamados: list[dict]) -> pd.DataFrame:
        """
        Monta a tabela silver `silver_chamado` a partir dos chamados
        sincronizados do backend (bronze `chamados_raw`).

        O bairro é normalizado aqui também para garantir que a silver não
        dependa do formato em que o backend gravou o valor.
        """

        df = pd.DataFrame(chamados)

        if df.empty:
            raise ValueError("Nenhum chamado foi recebido para a camada silver.")

        if "bairro" not in df.columns:
            df["bairro"] = None
        df["bairro"] = df["bairro"].map(normalize_bairro)

        for column in ("latitude", "longitude"):
            if column not in df.columns:
                df[column] = None
            df[column] = pd.to_numeric(df[column], errors="coerce")

        if "data_chamado" in df.columns:
            df["data_chamado"] = pd.to_datetime(
                df["data_chamado"],
                errors="coerce",
            ).dt.date
        else:
            df["data_chamado"] = (
                pd.to_datetime(df["criadoem"], utc=True, errors="coerce")
                .dt.tz_convert("America/Recife")
                .dt.date
            )

        if "coordenada_valida" not in df.columns:
            df["coordenada_valida"] = (
                df["latitude"].notna()
                & df["longitude"].notna()
                & ~((df["latitude"] == 0) & (df["longitude"] == 0))
            )
        df["coordenada_valida"] = df["coordenada_valida"].fillna(False).astype(bool)

        # Created by AI.
        # Mantém o instante do chamado com fuso para a silver relacional.
        if "criadoem" in df.columns:
            df["criadoem"] = pd.to_datetime(
                df["criadoem"],
                utc=True,
                errors="coerce",
            )
        else:
            df["criadoem"] = pd.NaT

        for column in SILVER_CHAMADO_COLUMNS:
            if column not in df.columns:
                df[column] = None

        df = df[SILVER_CHAMADO_COLUMNS]

        print(
            f"Camada silver de chamados montada: {len(df)} registro(s), "
            f"{int(df['bairro'].isna().sum())} sem bairro, "
            f"{int((~df['coordenada_valida']).sum())} sem coordenada válida."
        )

        return df

    # ------------------------------------------------------------------
    # GOLD
    # ------------------------------------------------------------------

    # Updated by AI.
    def build_gold_chamados_clima(
        self,
        silver_chamado: pd.DataFrame,
        silver_clima_diario: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Cruza `silver_chamado` com `silver_clima_diario` pela data local
        (America/Recife) de cada chamado.
        """

        if silver_chamado.empty:
            raise ValueError("Nenhum chamado foi recebido para o cruzamento com o clima.")
        if silver_clima_diario.empty:
            raise ValueError("A camada silver de clima está vazia.")

        df_chamados = silver_chamado.copy()
        df_chamados["data"] = pd.to_datetime(
            df_chamados["data_chamado"],
            errors="coerce",
        ).dt.date

        df_clima = silver_clima_diario.copy()
        df_clima["data"] = pd.to_datetime(
            df_clima["data"],
            errors="coerce",
        ).dt.date

        df_final = df_chamados.merge(
            df_clima,
            on="data",
            how="left"
        )

        df_final = df_final[GOLD_CHAMADOS_CLIMA_COLUMNS]

        print("Gold chamados_clima gerada com sucesso!")

        return df_final

    # Updated by AI.
    def build_gold_chamados_populacao(
        self,
        silver_chamado: pd.DataFrame,
        silver_bairro_populacao: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Agrega `silver_chamado` por bairro e cruza com a população do IBGE
        (`silver_bairro_populacao`).
        """

        if silver_chamado.empty:
            raise ValueError("Nenhum chamado foi recebido para o cruzamento com a população.")

        df_chamados = silver_chamado.copy()

        # O bairro é obrigatório em chamados novos; registros antigos sem
        # bairro continuam contabilizados em "NAO INFORMADO" em vez de sumir.
        df_chamados["bairro"] = (
            df_chamados["bairro"]
            .map(normalize_bairro)
            .fillna("NAO INFORMADO")
        )

        df_chamados_por_bairro = (
            df_chamados
            .groupby("bairro", dropna=False)
            .size()
            .reset_index(name="chamados")
        )

        df_populacao = silver_bairro_populacao.copy()
        df_populacao["bairro"] = df_populacao["bairro"].map(normalize_bairro)

        df_bairros = df_chamados_por_bairro.merge(
            df_populacao[
                ["codigo_bairro", "bairro", "populacao"]
            ],
            on="bairro",
            how="left"
        )

        populacao_valida = df_bairros["populacao"].where(
            df_bairros["populacao"] > 0
        )
        df_bairros["chamados_por_1000"] = (
            df_bairros["chamados"] / populacao_valida
        ) * 1000

        df_bairros["chamados_por_1000"] = (
            df_bairros["chamados_por_1000"]
            .round(2)
        )

        sem_populacao = df_bairros["populacao"].isna().sum()
        if sem_populacao:
            print(
                f"Atenção: {sem_populacao} bairro(s) sem correspondência "
                "na população do IBGE."
            )

        df_bairros = df_bairros[GOLD_CHAMADOS_POPULACAO_COLUMNS]

        print("Gold chamados_populacao gerada com sucesso!")

        return df_bairros

    # Created by AI.
    def build_gold_chamados_clima_diario(
        self,
        silver_chamado: pd.DataFrame,
        silver_clima_diario: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Gera a tabela diária que finalmente usa o clima no dashboard:
        uma linha por dia com temperatura, precipitação e volume de chamados.
        """

        if silver_clima_diario.empty:
            raise ValueError("A camada silver de clima está vazia.")

        df_clima = silver_clima_diario.copy()
        df_clima["data"] = pd.to_datetime(
            df_clima["data"],
            errors="coerce",
        ).dt.date
        df_clima = df_clima.dropna(subset=["data"])

        if silver_chamado.empty:
            df_contagem = pd.DataFrame(columns=["data", "chamados"])
        else:
            df_contagem = (
                silver_chamado
                .assign(
                    data=pd.to_datetime(
                        silver_chamado["data_chamado"],
                        errors="coerce",
                    ).dt.date
                )
                .dropna(subset=["data"])
                .groupby("data")
                .size()
                .reset_index(name="chamados")
            )

        df_final = df_clima.merge(
            df_contagem,
            on="data",
            how="left"
        )
        df_final["chamados"] = (
            df_final["chamados"]
            .fillna(0)
            .astype(int)
        )

        df_final = df_final.sort_values("data").reset_index(drop=True)
        df_final = df_final[GOLD_CHAMADOS_CLIMA_DIARIO_COLUMNS]

        print(
            f"Gold chamados_clima_diario gerada com sucesso: "
            f"{len(df_final)} dia(s), {int(df_final['chamados'].sum())} chamado(s)."
        )

        return df_final
