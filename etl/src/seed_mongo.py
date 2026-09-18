from src.extract import Extract
from src.load import Load

class Seed_Mongo:
    """
    Funções responsáveis por extrair os dados brutos das fontes externas
    (API Open-Meteo e IBGE) e salvá-los no MongoDB, para que sejam
    transformados posteriormente pelo pipeline de ETL.

    Este módulo deve ser executado apenas na carga inicial do projeto ou
    quando for necessário atualizar os dados brutos armazenados no Mongo.
    """
    def __init__(self):
        pass;


    def extrair_clima_da_api_e_salvar_no_mongo(self, ext: Extract, ld: Load):
        """
        Extrai os dados climáticos da API Open-Meteo e salva o resultado
        bruto na coleção 'clima_raw' do MongoDB.
    
        Só precisa ser executada uma vez (ou quando quiser atualizar os
        dados brutos salvos no Mongo).
        """
    
        print("Extraindo dados climáticos da API!")
    
        data = ext.clima(
            latitude=-8.0631,
            longitude=-34.8711,
            data_inicio="2026-02-01",
            data_fim="2026-02-28"
        )
    
        ld.load_mongo(data, "clima_raw")
    
        print("Dados climáticos salvos no MongoDB!")


    def extrair_populacao_da_api_e_salvar_no_mongo(self, ext: Extract, ld: Load):
        """
        Extrai os dados de população do IBGE e salva o resultado bruto
        na coleção 'populacao_ibge_raw' do MongoDB.
    
        Só precisa ser executada uma vez (ou quando quiser atualizar os
        dados brutos salvos no Mongo).
        """
    
        print("Extraindo dados de população do IBGE!")
    
        df_demografia = ext.populacao_bairros()
    
        dados_populacao = df_demografia.to_dict(orient="records")
    
        ld.load_mongo(dados_populacao, "populacao_ibge_raw")
    
        print("Dados de população salvos no MongoDB!")
