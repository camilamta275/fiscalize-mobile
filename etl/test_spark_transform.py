import pandas as pd
from pyspark.sql import DataFrame as SparkDataFrame

from flow_etl import construir_silver, construir_gold
from src.spark_session import criar_sessao_spark
from src.spark_transform import SparkTransform


def main():
    spark = criar_sessao_spark("Fiscalize-Teste-Silver-Gold")

    try:
        transform = SparkTransform(spark)

        # ==========================================================
        # DADOS DE ENTRADA
        # ==========================================================

        chamados = [
            {
                "id": "1",
                "protocolo": "FIS-001",
                "categoria": "Iluminação",
                "subcategoria": "Poste apagado",
                "bairro": " Boa Viagem ",
                "cidade": "Recife",
                "estado": "PE",
                "latitude": "-8.1185",
                "longitude": "-34.9012",
                "data_chamado": "2026-11-15",
                "criadoem": "2026-11-15T12:30:00",
                "status": "ABERTO",
                "prioridade": "ALTA",
                "coordenada_valida": None,
            },
            {
                "id": "2",
                "protocolo": "FIS-002",
                "categoria": "Limpeza",
                "subcategoria": "Descarte irregular",
                "bairro": "Casa Amarela",
                "cidade": "Recife",
                "estado": "PE",
                "latitude": "0",
                "longitude": "0",
                "data_chamado": None,
                "criadoem": "2026-11-16T12:30:00",
                "status": "EM_ANALISE",
                "prioridade": "MEDIA",
                "coordenada_valida": None,
            },
        ]

        clima_bruto = {
            "daily": {
                "time": [
                    "2026-11-15",
                    "2026-11-16",
                    "2026-11-17",
                    "2026-11-17",
                    "data-invalida",
                ],
                "temperature_2m_mean": [
                    28.5,
                    27.2,
                    29.1,
                    29.1,
                    26.0,
                ],
                "precipitation_sum": [
                    2.5,
                    0.0,
                    5.3,
                    5.3,
                    1.0,
                ],
            }
        }

        populacao_bruta = pd.DataFrame({
            "CD_BAIRRO": [
                "2611606001",
                "2611606002",
                "2611606003",
                "9999999001",
                "2611606004",
            ],
            "NM_BAIRRO": [
                "Boa Viagem",
                "Casa Amarela",
                "Santo Amaro",
                "Bairro Fora de Recife",
                "Pina",
            ],
            "V01006": [
                100000,
                50000,
                30000,
                20000,
                "-",
            ],
        })

        # ==========================================================
        # TESTE 1: SILVER DE CHAMADOS
        # ==========================================================

        resultado_chamados = transform.build_silver_chamado(
            chamados
        )

        print("\n=== TESTE 1: SILVER DE CHAMADOS ===")
        resultado_chamados.printSchema()
        resultado_chamados.show(truncate=False)

        assert resultado_chamados.count() == 2
        assert (
            resultado_chamados
            .filter("bairro = 'BOA VIAGEM'")
            .count() == 1
        )
        assert (
            resultado_chamados
            .filter("coordenada_valida = true")
            .count() == 1
        )

        print("TESTE 1 APROVADO!")

        # ==========================================================
        # TESTE 2: SILVER DE CLIMA DIÁRIO
        # ==========================================================

        resultado_clima = transform.build_silver_clima_diario(
            clima_bruto
        )

        print("\n=== TESTE 2: SILVER DE CLIMA ===")
        resultado_clima.printSchema()
        resultado_clima.show(truncate=False)

        assert resultado_clima.count() == 3
        assert (
            resultado_clima
            .filter("data = DATE '2026-11-17'")
            .count() == 1
        )

        print("TESTE 2 APROVADO!")

        # ==========================================================
        # TESTE 3: SILVER DE POPULAÇÃO
        # ==========================================================

        resultado_populacao = (
            transform.build_silver_bairro_populacao(
                populacao_bruta
            )
        )

        print("\n=== TESTE 3: SILVER DE POPULAÇÃO ===")
        resultado_populacao.printSchema()
        resultado_populacao.show(truncate=False)

        assert resultado_populacao.count() == 4
        assert (
            resultado_populacao
            .filter("bairro = 'BOA VIAGEM'")
            .count() == 1
        )
        assert (
            resultado_populacao
            .filter("bairro = 'PINA' AND populacao IS NULL")
            .count() == 1
        )
        assert (
            resultado_populacao
            .filter("codigo_bairro LIKE '9999999%'")
            .count() == 0
        )

        print("TESTE 3 APROVADO!")

        # ==========================================================
        # TESTE 4: GOLD DE CHAMADOS E CLIMA
        # ==========================================================

        resultado_gold_clima = (
            transform.build_gold_chamados_clima(
                resultado_chamados,
                resultado_clima,
            )
        )

        print("\n=== TESTE 4: GOLD DE CHAMADOS + CLIMA ===")
        resultado_gold_clima.printSchema()
        resultado_gold_clima.show(truncate=False)

        assert resultado_gold_clima.count() == 2

        chamado_1 = (
            resultado_gold_clima
            .filter("protocolo = 'FIS-001'")
            .first()
        )

        assert chamado_1 is not None
        assert str(chamado_1["data"]) == "2026-11-15"
        assert chamado_1["temperatura"] == 28.5
        assert chamado_1["precipitacao"] == 2.5

        chamado_2 = (
            resultado_gold_clima
            .filter("protocolo = 'FIS-002'")
            .first()
        )

        assert chamado_2 is not None
        assert str(chamado_2["data"]) == "2026-11-16"
        assert chamado_2["temperatura"] == 27.2

        print("TESTE 4 APROVADO!")

        # ==========================================================
        # TESTE 5: GOLD DE CHAMADOS E POPULAÇÃO
        # ==========================================================

        resultado_gold_populacao = (
            transform.build_gold_chamados_populacao(
                resultado_chamados,
                resultado_populacao,
            )
        )

        print("\n=== TESTE 5: GOLD DE CHAMADOS + POPULAÇÃO ===")
        resultado_gold_populacao.printSchema()
        resultado_gold_populacao.show(truncate=False)

        assert resultado_gold_populacao.count() == 2

        boa_viagem = (
            resultado_gold_populacao
            .filter("bairro = 'BOA VIAGEM'")
            .first()
        )

        assert boa_viagem is not None
        assert boa_viagem["chamados"] == 1
        assert boa_viagem["populacao"] == 100000
        assert boa_viagem["chamados_por_1000"] == 0.01

        casa_amarela = (
            resultado_gold_populacao
            .filter("bairro = 'CASA AMARELA'")
            .first()
        )

        assert casa_amarela is not None
        assert casa_amarela["chamados"] == 1
        assert casa_amarela["populacao"] == 50000
        assert casa_amarela["chamados_por_1000"] == 0.02

        print("TESTE 5 APROVADO!")

        # ==========================================================
        # TESTE 6: GOLD DE CLIMA DIÁRIO
        # ==========================================================

        resultado_gold_clima_diario = (
            transform.build_gold_chamados_clima_diario(
                resultado_chamados,
                resultado_clima,
            )
        )

        print("\n=== TESTE 6: GOLD DE CLIMA DIÁRIO ===")
        resultado_gold_clima_diario.printSchema()
        resultado_gold_clima_diario.show(truncate=False)

        assert resultado_gold_clima_diario.count() == 3

        dia_15 = (
            resultado_gold_clima_diario
            .filter("data = DATE '2026-11-15'")
            .first()
        )

        assert dia_15 is not None
        assert dia_15["chamados"] == 1

        dia_16 = (
            resultado_gold_clima_diario
            .filter("data = DATE '2026-11-16'")
            .first()
        )

        assert dia_16 is not None
        assert dia_16["chamados"] == 1

        dia_17 = (
            resultado_gold_clima_diario
            .filter("data = DATE '2026-11-17'")
            .first()
        )

        assert dia_17 is not None
        assert dia_17["chamados"] == 0

        print("TESTE 6 APROVADO!")

        # ==========================================================
        # TESTE 7: INTEGRAÇÃO DA TAREFA SILVER DO PREFECT
        # ==========================================================

        print("\n=== TESTE 7: TAREFA SILVER DO PREFECT ===")

        # Simula a estrutura de uma extração de clima do MongoDB.
        clima_para_fluxo = pd.DataFrame([clima_bruto])

        # Executa somente o corpo da tarefa, sem iniciar o fluxo.
        silver_fluxo = construir_silver.fn(
            chamados,
            clima_para_fluxo,
            populacao_bruta,
        )

        assert set(silver_fluxo.keys()) == {
            "silver_chamado",
            "silver_clima_diario",
            "silver_bairro_populacao",
        }

        assert isinstance(
            silver_fluxo["silver_chamado"],
            SparkDataFrame,
        )
        assert isinstance(
            silver_fluxo["silver_clima_diario"],
            SparkDataFrame,
        )
        assert isinstance(
            silver_fluxo["silver_bairro_populacao"],
            SparkDataFrame,
        )

        assert silver_fluxo["silver_chamado"].count() == 2
        assert silver_fluxo["silver_clima_diario"].count() == 3
        assert silver_fluxo["silver_bairro_populacao"].count() == 4

        for nome, dataframe in silver_fluxo.items():
            print(f"{nome}: {dataframe.count()} registros")

        print("TESTE 7 APROVADO!")

        # ==========================================================
        # TESTE 8: INTEGRAÇÃO DA TAREFA GOLD DO PREFECT
        # ==========================================================

        print("\n=== TESTE 8: TAREFA GOLD DO PREFECT ===")

        # Recebe diretamente a saída da tarefa Silver.
        gold_fluxo = construir_gold.fn(silver_fluxo)

        assert set(gold_fluxo.keys()) == {
            "chamados_clima",
            "chamados_populacao",
            "chamados_clima_diario",
        }

        assert isinstance(
            gold_fluxo["chamados_clima"],
            SparkDataFrame,
        )
        assert isinstance(
            gold_fluxo["chamados_populacao"],
            SparkDataFrame,
        )
        assert isinstance(
            gold_fluxo["chamados_clima_diario"],
            SparkDataFrame,
        )

        assert gold_fluxo["chamados_clima"].count() == 2
        assert gold_fluxo["chamados_populacao"].count() == 2
        assert gold_fluxo["chamados_clima_diario"].count() == 3

        for nome, dataframe in gold_fluxo.items():
            print(f"{nome}: {dataframe.count()} registros")

        print("TESTE 8 APROVADO!")

        # ==========================================================
        # RESUMO FINAL
        # ==========================================================

        print("\n" + "=" * 55)
        print("TODOS OS 8 TESTES FORAM APROVADOS!")
        print("=" * 55)

    finally:
        spark.stop()


if __name__ == "__main__":
    main()
