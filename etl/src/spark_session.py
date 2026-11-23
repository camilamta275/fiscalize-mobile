import os
import sys

from pyspark.sql import SparkSession

# Updated by AI. JDKs suportados pelo Spark 4.0.
JDKS_COMPATIVEIS = [
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
]


# Updated by AI.
def criar_sessao_spark(
    app_name: str = "FiscalizeETL",
) -> SparkSession:
    """
    Cria ou recupera uma sessão local do Apache Spark
    para processamento dos dados do Fiscalize.
    """

    # Updated by AI. Os workers precisam usar o mesmo interpretador da venv.
    os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
    os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)

    # Updated by AI. O Spark 4.0 não funciona com Java 24+ (Subject.getSubject
    # foi removido). Se JAVA_HOME não estiver definido, usa um JDK 21 ou 17.
    if "JAVA_HOME" not in os.environ:
        for candidato in JDKS_COMPATIVEIS:
            if os.path.isdir(candidato):
                os.environ["JAVA_HOME"] = candidato
                break

    spark = (
        SparkSession.builder
        .master("local[*]")
        .appName(app_name)
        .config("spark.sql.session.timeZone", "America/Recife")
        .config("spark.sql.shuffle.partitions", "4")
        .getOrCreate()
    )

    return spark


def encerrar_sessao_spark() -> None:
    """
    Encerra a sessão Spark ativa, caso exista.
    """

    spark = SparkSession.getActiveSession()

    if spark is not None:
        spark.stop()
        print("Sessão Spark encerrada com sucesso.")
    else:
        print("Nenhuma sessão Spark ativa para encerrar.")
