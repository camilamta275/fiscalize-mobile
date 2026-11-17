import pandas as pd

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import (
    StringType,
    StructField,
    StructType,
)

from src.spark_session import criar_sessao_spark


# Colunas da camada silver de chamados
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


# Colunas da camada gold de chamados e clima
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


# Colunas da camada gold de chamados e população
GOLD_CHAMADOS_POPULACAO_COLUMNS = [
    "bairro",
    "chamados",
    "codigo_bairro",
    "populacao",
    "chamados_por_1000",
]


# Colunas da camada gold de clima diário
GOLD_CHAMADOS_CLIMA_DIARIO_COLUMNS = [
    "data",
    "temperatura",
    "precipitacao",
    "chamados",
]


def normalizar_bairro_coluna(nome_coluna: str):
    """
    Normaliza o nome do bairro utilizando funções nativas do Spark.

    Remove espaços excedentes, converte para maiúsculas
    e remove acentos.
    """

    original = F.col(nome_coluna)
    texto = F.upper(F.trim(original))

    texto = F.regexp_replace(texto, r"\s+", " ")

    texto = F.translate(
        texto,
        "ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ",
        "AAAAAEEEEIIIIOOOOOUUUUCN",
    )

    valores_invalidos = ["NAN", "NONE", "NAT"]

    return F.when(
        original.isNull()
        | (texto == "")
        | texto.isin(*valores_invalidos),
        F.lit(None).cast("string"),
    ).otherwise(texto)


class SparkTransform:
    """
    Responsável pelas transformações das camadas Silver e Gold
    utilizando Apache Spark.
    """

    def __init__(self, spark: SparkSession | None = None):
        self.spark = spark or criar_sessao_spark()

    # ------------------------------------------------------------------
    # SILVER
    # ------------------------------------------------------------------

    def build_silver_chamado(
        self,
        chamados: list[dict],
    ) -> DataFrame:
        """
        Monta a tabela silver_chamado a partir dos chamados
        sincronizados do backend e armazenados no MongoDB.
        """

        if not chamados:
            raise ValueError(
                "Nenhum chamado foi recebido para a camada silver."
            )

        colunas_entrada = [
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

        esquema = StructType([
            StructField(coluna, StringType(), True)
            for coluna in colunas_entrada
        ])

        # Ignora campos extras do MongoDB, como _id e data_extracao.
        registros = [
            tuple(
                str(registro[coluna])
                if registro.get(coluna) is not None
                else None
                for coluna in colunas_entrada
            )
            for registro in chamados
        ]

        df = self.spark.createDataFrame(
            registros,
            schema=esquema,
        )

        # Normaliza os bairros com funções nativas do Spark.
        df = df.withColumn(
            "bairro",
            normalizar_bairro_coluna("bairro"),
        )

        # Converte latitude e longitude de forma segura.
        # Valores inválidos são transformados em NULL.
        for coluna in ("latitude", "longitude"):
            df = df.withColumn(
                coluna,
                F.expr(f"try_cast(`{coluna}` AS DOUBLE)"),
            )

        # Converte a data do chamado.
        # Datas inválidas são transformadas em NULL.
        df = df.withColumn(
            "data_chamado",
            F.expr("try_cast(`data_chamado` AS DATE)"),
        )

        # Converte o instante de criação do chamado.
        df = df.withColumn(
            "criadoem",
            F.to_timestamp(F.col("criadoem")),
        )

        # Quando data_chamado estiver ausente, utiliza criadoem
        # convertido para o fuso horário de Recife.
        df = df.withColumn(
            "data_chamado",
            F.coalesce(
                F.col("data_chamado"),
                F.to_date(
                    F.from_utc_timestamp(
                        F.col("criadoem"),
                        "America/Recife",
                    )
                ),
            ),
        )

        # Determina se as coordenadas são válidas.
        coordenadas_validas = (
            F.col("latitude").isNotNull()
            & F.col("longitude").isNotNull()
            & ~(
                (F.col("latitude") == 0)
                & (F.col("longitude") == 0)
            )
        )

        df = df.withColumn(
            "coordenada_valida",
            F.when(
                F.lower(F.col("coordenada_valida")).isin(
                    "true",
                    "1",
                    "t",
                    "yes",
                ),
                True,
            ).otherwise(
                F.when(
                    F.col("coordenada_valida").isNull(),
                    coordenadas_validas,
                ).otherwise(False)
            ),
        )

        # Garante a ordem e a presença de todas as colunas.
        df = df.select(*SILVER_CHAMADO_COLUMNS)

        total = df.count()

        sem_bairro = df.filter(
            F.col("bairro").isNull()
        ).count()

        sem_coordenada = df.filter(
            ~F.col("coordenada_valida")
        ).count()

        print(
            f"Camada silver de chamados montada com Spark: "
            f"{total} registro(s), "
            f"{sem_bairro} sem bairro, "
            f"{sem_coordenada} sem coordenada válida."
        )

        return df

    def build_silver_clima_diario(
        self,
        data: dict | pd.DataFrame,
    ) -> DataFrame:
        """
        Monta a tabela silver_clima_diario a partir da carga
        mais recente do Open-Meteo armazenada no MongoDB.

        Retorna uma linha por dia com temperatura média
        e precipitação total.
        """

        # Trata a entrada quando ela vier como DataFrame Pandas.
        if isinstance(data, pd.DataFrame):
            if data.empty:
                raise ValueError("A carga de clima está vazia.")

            if len(data) != 1:
                raise ValueError(
                    "A carga de clima deve conter um documento "
                    "com as listas diárias completas."
                )

            data = data.drop(
                columns=["_id"],
                errors="ignore",
            ).to_dict(orient="records")[0]

        if not isinstance(data, dict):
            raise TypeError(
                "A carga de clima deve ser um dicionário "
                "ou DataFrame Pandas."
            )

        # Verifica a existência dos dados diários.
        daily = data.get("daily")

        if not isinstance(daily, dict):
            raise ValueError(
                "A carga de clima não contém a estrutura 'daily'."
            )

        datas = daily.get("time", [])
        temperaturas = daily.get("temperature_2m_mean", [])
        precipitacoes = daily.get("precipitation_sum", [])

        if not datas:
            raise ValueError(
                "A carga de clima não contém datas."
            )

        if not (
            len(datas) == len(temperaturas) == len(precipitacoes)
        ):
            raise ValueError(
                "As listas de datas, temperaturas e precipitações "
                "possuem tamanhos diferentes."
            )

        # Organiza os dados em registros.
        registros = [
            (
                str(data_dia) if data_dia is not None else None,
                str(temperatura) if temperatura is not None else None,
                str(precipitacao) if precipitacao is not None else None,
            )
            for data_dia, temperatura, precipitacao in zip(
                datas,
                temperaturas,
                precipitacoes,
            )
        ]

        esquema = StructType([
            StructField("data", StringType(), True),
            StructField("temperatura", StringType(), True),
            StructField("precipitacao", StringType(), True),
        ])

        df = self.spark.createDataFrame(
            registros,
            schema=esquema,
        )

        # Converte as colunas para seus tipos definitivos.
        # try_cast transforma valores inválidos em NULL.
        df = df.withColumn(
            "data",
            F.expr("try_cast(`data` AS DATE)"),
        )

        df = df.withColumn(
            "temperatura",
            F.expr("try_cast(`temperatura` AS DOUBLE)"),
        )

        df = df.withColumn(
            "precipitacao",
            F.expr("try_cast(`precipitacao` AS DOUBLE)"),
        )

        # Remove datas inválidas e duplicadas.
        df = (
            df.dropna(subset=["data"])
            .dropDuplicates(["data"])
            .select(
                "data",
                "temperatura",
                "precipitacao",
            )
        )

        total = df.count()

        print(
            "Dados climáticos transformados com Spark: "
            f"{total} registro(s) diário(s)."
        )

        return df

    def build_silver_bairro_populacao(
        self,
        data: pd.DataFrame,
    ) -> DataFrame:
        """
        Monta a tabela silver_bairro_populacao a partir dos
        dados demográficos do Censo 2022 disponibilizados pelo IBGE.

        codigo_bairro e populacao são convertidos para BIGINT,
        conforme os tipos definidos no Neon.
        """

        if not isinstance(data, pd.DataFrame):
            raise TypeError(
                "Os dados de população devem ser um DataFrame Pandas."
            )

        if data.empty:
            raise ValueError(
                "Os dados de população do IBGE estão vazios."
            )

        colunas_necessarias = [
            "CD_BAIRRO",
            "NM_BAIRRO",
            "V01006",
        ]

        colunas_ausentes = [
            coluna
            for coluna in colunas_necessarias
            if coluna not in data.columns
        ]

        if colunas_ausentes:
            raise ValueError(
                "Colunas necessárias ausentes nos dados do IBGE: "
                f"{colunas_ausentes}"
            )

        # Seleciona somente as colunas necessárias.
        dados_selecionados = data[colunas_necessarias].copy()

        # Converte para registros compatíveis com o Spark.
        registros = []

        for codigo, bairro, populacao in dados_selecionados.itertuples(
            index=False,
            name=None,
        ):
            codigo_valido = (
                str(codigo).strip()
                if pd.notna(codigo)
                else None
            )

            # Evita códigos IBGE com sufixo decimal .0.
            if codigo_valido and codigo_valido.endswith(".0"):
                codigo_valido = codigo_valido[:-2]

            registros.append(
                (
                    codigo_valido,
                    str(bairro).strip()
                    if pd.notna(bairro)
                    else None,
                    str(populacao).strip()
                    if pd.notna(populacao)
                    else None,
                )
            )

        esquema = StructType([
            StructField("codigo_bairro", StringType(), True),
            StructField("bairro", StringType(), True),
            StructField("populacao", StringType(), True),
        ])

        df = self.spark.createDataFrame(
            registros,
            schema=esquema,
        )

        # Trata marcadores de valores ausentes.
        valores_invalidos = ["", "-", "N/A", "NA", "..."]

        for coluna in ("codigo_bairro", "bairro", "populacao"):
            df = df.withColumn(
                coluna,
                F.when(
                    F.upper(F.trim(F.col(coluna))).isin(
                        *valores_invalidos
                    ),
                    F.lit(None).cast("string"),
                ).otherwise(F.trim(F.col(coluna))),
            )

        # Mantém somente os bairros pertencentes a Recife.
        df = df.filter(
            F.col("codigo_bairro").startswith("2611606")
        )

        # Normaliza os nomes dos bairros.
        df = df.withColumn(
            "bairro",
            normalizar_bairro_coluna("bairro"),
        )

        # Remove o sufixo decimal .0 de valores populacionais.
        # Isso permite tratar valores recebidos como 1234.0
        # sem perder a informação da contagem inteira.
        df = df.withColumn(
            "populacao",
            F.regexp_replace(
                F.col("populacao"),
                r"\.0+$",
                "",
            ),
        )

        # Converte o código do bairro para BIGINT.
        # Valores inválidos são transformados em NULL.
        df = df.withColumn(
            "codigo_bairro",
            F.expr("try_cast(`codigo_bairro` AS BIGINT)"),
        )

        # Converte população para BIGINT.
        # Valores ausentes ou inválidos permanecem como NULL.
        df = df.withColumn(
            "populacao",
            F.expr("try_cast(`populacao` AS BIGINT)"),
        )

        # Remove registros sem código ou nome de bairro.
        df = df.filter(
            F.col("codigo_bairro").isNotNull()
            & F.col("bairro").isNotNull()
        )

        # Remove duplicações pelo código do bairro.
        df = df.dropDuplicates(["codigo_bairro"])

        # Garante a estrutura e a ordem das colunas.
        df = df.select(
            "codigo_bairro",
            "bairro",
            "populacao",
        )

        total = df.count()

        sem_populacao = df.filter(
            F.col("populacao").isNull()
        ).count()

        print(
            "Camada silver de população montada com Spark: "
            f"{total} bairro(s), "
            f"{sem_populacao} sem informação populacional."
        )

        return df

    # ------------------------------------------------------------------
    # GOLD
    # ------------------------------------------------------------------

    def build_gold_chamados_clima(
        self,
        silver_chamado: DataFrame,
        silver_clima_diario: DataFrame,
    ) -> DataFrame:
        """
        Cruza silver_chamado com silver_clima_diario pela data
        local de cada chamado.

        Mantém todos os chamados, mesmo quando não existe
        informação climática para determinada data.
        """

        if silver_chamado.limit(1).count() == 0:
            raise ValueError(
                "Nenhum chamado foi recebido para o cruzamento com o clima."
            )

        if silver_clima_diario.limit(1).count() == 0:
            raise ValueError(
                "A camada silver de clima está vazia."
            )

        # Realiza o LEFT JOIN pela data do chamado.
        df_final = (
            silver_chamado.alias("ch")
            .join(
                silver_clima_diario.alias("cl"),
                F.col("ch.data_chamado") == F.col("cl.data"),
                "left",
            )
            .select(
                F.col("ch.id"),
                F.col("ch.protocolo"),
                F.col("ch.categoria"),
                F.col("ch.subcategoria"),
                F.col("ch.bairro"),
                F.col("cl.data"),
                F.col("cl.temperatura"),
                F.col("cl.precipitacao"),
            )
        )

        df_final = df_final.select(
            *GOLD_CHAMADOS_CLIMA_COLUMNS
        )

        print(
            "Gold chamados_clima gerada com Spark: "
            f"{df_final.count()} registro(s)."
        )

        return df_final

    def build_gold_chamados_populacao(
        self,
        silver_chamado: DataFrame,
        silver_bairro_populacao: DataFrame,
    ) -> DataFrame:
        """
        Agrega os chamados por bairro e cruza o resultado
        com a população disponibilizada pelo IBGE.

        Calcula a quantidade de chamados por mil habitantes.
        """

        if silver_chamado.limit(1).count() == 0:
            raise ValueError(
                "Nenhum chamado foi recebido para o cruzamento "
                "com a população."
            )

        # Normaliza os bairros dos chamados.
        # Chamados sem bairro são contabilizados como NAO INFORMADO.
        df_chamados = silver_chamado.withColumn(
            "bairro",
            F.coalesce(
                normalizar_bairro_coluna("bairro"),
                F.lit("NAO INFORMADO"),
            ),
        )

        # Agrupa os chamados por bairro.
        df_chamados_por_bairro = (
            df_chamados
            .groupBy("bairro")
            .agg(
                F.count("*").alias("chamados")
            )
        )

        # Normaliza os bairros da população.
        df_populacao = silver_bairro_populacao.select(
            F.col("codigo_bairro"),
            normalizar_bairro_coluna("bairro").alias("bairro_pop"),
            F.col("populacao"),
        )

        # Relaciona os chamados com a população pelo nome do bairro.
        df_bairros = (
            df_chamados_por_bairro.alias("ch")
            .join(
                df_populacao.alias("pop"),
                F.col("ch.bairro") == F.col("pop.bairro_pop"),
                "left",
            )
        )

        # Calcula chamados por mil habitantes.
        # Quando a população é nula ou zero, o resultado fica nulo.
        df_bairros = df_bairros.select(
            F.col("ch.bairro").alias("bairro"),
            F.col("ch.chamados").alias("chamados"),
            F.col("pop.codigo_bairro").alias("codigo_bairro"),
            F.col("pop.populacao").alias("populacao"),
            F.when(
                F.col("pop.populacao") > 0,
                F.round(
                    (
                        F.col("ch.chamados")
                        / F.col("pop.populacao")
                    ) * 1000,
                    2,
                ),
            ).otherwise(
                F.lit(None).cast("double")
            ).alias("chamados_por_1000"),
        )

        # Identifica bairros sem informação populacional.
        sem_populacao = df_bairros.filter(
            F.col("populacao").isNull()
        ).count()

        if sem_populacao:
            print(
                f"Atenção: {sem_populacao} bairro(s) sem correspondência "
                "ou sem informação de população do IBGE."
            )

        # Garante a estrutura e a ordem das colunas.
        df_bairros = df_bairros.select(
            *GOLD_CHAMADOS_POPULACAO_COLUMNS
        )

        print(
            "Gold chamados_populacao gerada com Spark: "
            f"{df_bairros.count()} registro(s)."
        )

        return df_bairros

    def build_gold_chamados_clima_diario(
        self,
        silver_chamado: DataFrame,
        silver_clima_diario: DataFrame,
    ) -> DataFrame:
        """
        Gera uma linha por dia com temperatura, precipitação
        e volume de chamados.

        Dias sem chamados recebem quantidade igual a zero.
        """

        if silver_clima_diario.limit(1).count() == 0:
            raise ValueError(
                "A camada silver de clima está vazia."
            )

        # Remove datas inválidas da camada de clima.
        df_clima = silver_clima_diario.filter(
            F.col("data").isNotNull()
        )

        # Conta os chamados por data.
        # Se não houver chamados, cria uma contagem vazia.
        df_contagem = (
            silver_chamado
            .filter(F.col("data_chamado").isNotNull())
            .groupBy(
                F.col("data_chamado").alias("data")
            )
            .agg(
                F.count("*").alias("chamados")
            )
        )

        # Relaciona o clima com a quantidade de chamados.
        df_final = (
            df_clima.alias("cl")
            .join(
                df_contagem.alias("ch"),
                F.col("cl.data") == F.col("ch.data"),
                "left",
            )
            .select(
                F.col("cl.data").alias("data"),
                F.col("cl.temperatura").alias("temperatura"),
                F.col("cl.precipitacao").alias("precipitacao"),
                F.coalesce(
                    F.col("ch.chamados"),
                    F.lit(0),
                ).cast("long").alias("chamados"),
            )
        )

        # Ordena os registros cronologicamente.
        df_final = df_final.orderBy("data")

        # Garante a estrutura e a ordem das colunas.
        df_final = df_final.select(
            *GOLD_CHAMADOS_CLIMA_DIARIO_COLUMNS
        )

        total_dias = df_final.count()

        total_chamados = (
            df_final
            .agg(F.sum("chamados").alias("total"))
            .first()["total"]
        )

        print(
            "Gold chamados_clima_diario gerada com Spark: "
            f"{total_dias} dia(s), "
            f"{total_chamados or 0} chamado(s)."
        )

        return df_final
