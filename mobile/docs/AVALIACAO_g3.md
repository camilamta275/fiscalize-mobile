# Relatório de Avaliação - Unidade 1 - Desenvolvimento Mobile

## Resumo do Projeto
O grupo G3 desenvolveu a versão mobile do sistema **Fiscalize**, para gestão urbana em Pernambuco. Utiliza React Native com Expo, e reaproveita uma API REST (Express/Node.js/PostgreSQL) como submódulo. A estrutura foca no padrão MVVM, tem gerência de estados globais combinados com estado local, navegação com Expo Router, e integração aos recursos nativos como GPS e Câmera.

## Membros
- RAPHAEL RENNAN SOARES DE MIRANDA
- RENÉ MELO DE LUCENA
- ALESSANDRA BARBOSA DE SANTANA
- MARIA GABRIELA DAMÁSIO BEZERRA
- ANA SOFIA DA SILVA MOURA
- CAMILA MARIA TEIXEIRA ALCÂNTARA
- SAMUEL SILVA ARAÚJO DE BRITO
- RAYANE CAVALCANTI DA SILVA
- LUCAS RODRIGUES DA SILVA JUNIOR
- VICTOR FERREIRA MARQUES

## Tabela de Avaliação (Total: 4,0 pontos)

| Critério | Valor Máximo | Nota Atribuída | Observações |
| :--- | :---: | :---: | :--- |
| **Entrega 1 (08/09)** | | | |
| Inclusão do colaborador `mr-costaalencar` | 0,2 | 0,2 | |
| **Entrega 2 (15/09)** | | | |
| Aplicação em React Native/Expo (Android/iOS) | 0,4 | 0,4 | App criado com framework Expo, focado no mobile (Android/iOS). |
| Arquitetura clara (MVVM ou MVC) | 0,3 | 0,3 | Separação utilizando padrão MVVM (models, views, viewmodels, services). |
| Integração com o backend definido | 0,3 | 0,3 | Backend presente como submódulo git (`backend/`), consumido adequadamente em `services/`. |
| **Entrega 3 (22/09)** | | | |
| Implementação de CRUD das ocorrências | 0,4 | 0,4 | Presente nos viewmodels e services (leitura em lista e detalhes, criação). |
| Listagem com componentes nativos | 0,3 | 0,3 | Confirmado o uso de `FlatList` em `demands-list-view.tsx`. |
| Uso de GPS (Expo Location) | 0,3 | 0,3 | `expo-location` instalado e descrito. |
| Uso de Câmera (Expo Camera/Image Picker) | 0,3 | 0,3 | `expo-camera` instalado e documentado. |
| **Entrega 4 (29/09)** | | | |
| Navegação com Expo Router | 0,5 | 0,5 | Configuração do roteamento por pastas em `app/` perfeitamente alinhada. |
| Persistência/Estado (`useState`, `useEffect`)| 0,5 | 0,5 | Uso de hooks nativos no contexto MVVM está bem organizado. |
| Relatório de Uso de IA | 0,5 | 0,2 | Encontrada seção detalhada "Uso de IA" no arquivo `README.md`. Entretanto, falta relatório descrevendo os resultados da IA e como foi feito a avaliação humana sobre tais resultados. |
| **TOTAL** |  | **3,7** |  |

## Pontos Positivos
- A adoção do padrão arquitetural **MVVM**.
- A decisão de utilizar submódulo do git (`fiscalize-backend`) mantém os repositórios organizados.
- Documentação de como rodar o app mobile em conjunto com o backend.

## Pontos de Melhoria
- Incluir relatório detalhado sobre o uso de IA, descrevendo os resultados obtidos e a avaliação humana sobre tais resultados.
