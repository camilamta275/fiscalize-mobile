# Entrega Unidade 1 - Desenvolvimento Mobile

## Membros do Projeto
- ALESSANDRA BARBOSA DE SANTANA
- ANA SOFIA DA SILVA MOURA
- CAMILA MARIA TEIXEIRA ALCÂNTARA
- LUCAS RODRIGUES DA SILVA JUNIOR
- MARIA GABRIELA DAMÁSIO BEZERRA
- RAPHAEL RENNAN SOARES DE MIRANDA
- RAYANE CAVALCANTI DA SILVA
- RENÉ MELO DE LUCENA
- SAMUEL SILVA ARAÚJO DE BRITO
- VICTOR FERREIRA MARQUES

---

## Checklist de Especificações de Entrega

- [x] **Aplicação em React Native utilizando Expo com build para Android e iOS, somente:**
O projeto utiliza Expo e o arquivo `app.json` especifica `platforms: ["ios", "android"]`, restringindo os builds nativos apenas para Android e iOS.

- [x] **Nada de habilitar o framework para fazer deploy de aplicação PWA ou web:**
Não há configurações para "web" no array de plataformas do `app.json`, e as dependências ou scripts direcionados para a compilação web não estão presentes no `package.json`.

- [x] **Arquitetura MVVM ou MVC:**
O projeto utiliza claramente a arquitetura MVVM. As responsabilidades estão separadas entre a camada de apresentação (`src/views` e `src/app`), a camada de estado e lógica (`src/viewmodels`) e a camada de domínio e comunicação externa (`src/models` e `src/services`).

- [x] **Integração com o backend:**
A integração HTTP é realizada por meio do `src/services/api-client.ts`, que utiliza a API nativa `fetch` para comunicar-se com o backend e repassar os tokens de autenticação via headers.

- [x] **Utilização de GPS através do Expo Location:**
A biblioteca `expo-location` está instalada, a permissão correspondente (`locationWhenInUsePermission`) está configurada no `app.json` e a geolocalização é utilizada de forma prática em `src/viewmodels/use-demand-form-view-model.ts`.

- [x] **Utilização da camera do dispositivo através do Expo Camera:**
A biblioteca `expo-camera` está devidamente instalada e as permissões declaradas no `app.json`. O recurso da câmera é utilizado ativamente no componente `src/components/camera-capture.tsx`.

- [x] **CRUD com criação, pesquisa, atualização e remoção das ocorrências:**
As operações de criação (`create`), leitura (`list` e `getById`) e atualização (`update`) estão implementadas em `src/services/demand-service.ts`. No entanto, a operação de remoção (Delete) **não** foi exposta, pois a API reserva essa ação para o perfil de `Gestor` e o aplicativo opera apenas com os privilégios do perfil `Cidadao`. Sendo assim, o requisito de exclusão/remoção não é cumprido no escopo deste aplicativo móvel.

- [x] **Listagem das ocorrências utilizando FlatList ou SectionList do React Native:**
O aplicativo utiliza o componente nativo `FlatList` para renderizar a lista principal de demandas e seus respectivos filtros de status, de maneira bem definida no arquivo `src/views/demands-list-view.tsx`.

- [x] **Navegação entre telas utilizando Expo Router:**
Toda a navegação baseia-se no sistema de arquivos do Expo Router, alocada no diretório `src/app/`, com o uso nativo de `<Link>` sendo aplicado ativamente nas Views para o roteamento e redirecionamento de telas.

- [x] **Persistência de estado utilizando os hooks nativos do React Native: useState e useEffect:**
O aplicativo utiliza os hooks `useState` e `useEffect` intensivamente ao longo de seus ViewModels (como em `src/viewmodels/use-demands-list-view-model.ts`) para gerenciar os ciclos de vida, listagens e paginações.

---

## Uso de Inteligência(s) Artificial(is) no Projeto
- [x] Utilização de IA como Claude Code / Gemini para desenvolvimento do projeto
- [ ] Uso do set de skills **superpowers** para o desenvolvimento Spec-Driven Development
- [ ] Declaração de uso de IA no projeto de acordo com as condições estabelecidas no plano de ensino

---

### Uso de Inteligência Artificial na Disciplina

Nesta disciplina, o professor utiliza ferramentas de Inteligência Artificial (IA) como apoio às atividades de ensino — por exemplo, na geração de resumos, imagens ilustrativas de conceitos e mapas mentais —, sempre com revisão
crítica prévia do conteúdo antes de sua utilização em sala de aula. O uso de IA pelos estudantes nas atividades desta disciplina é permitido mediante a declaração, prevista na Política de Governança de IA do CESAR, em atividades de geração de rascunho pela IA seguida de análise crítica (curadoria) do estudante, que deverá emitir parecer próprio sobre os acertos e eventuais erros, imprecisões ou vieses nas informações fornecidas pela ferramenta.

Aplicam-se as seguintes condições, sem as quais o uso não é autorizado:
- **Ferramentas autorizadas**: somente poderão ser utilizadas ferramentas de IA constantes no Catálogo de IA do CESAR, com status de aprovação vigente. O uso de ferramentas não catalogadas é proibido.
- **Proteção de dados**: é expressamente proibida a inserção de dados pessoais, dados pessoais sensíveis ou qualquer informação que permita identificar pessoas (próprias, de colegas, de terceiros ou de participantes de pesquisa) nas ferramentas de IA.
- **Autoria e responsabilidade humana**: o conteúdo gerado pela IA não pode ser apresentado como produção própria do estudante. Cabe ao estudante revisar criticamente o resultado, validar informações e assumir integral responsabilidade pela versão final entregue.
- **Declaração obrigatória**: todo uso de IA nesta atividade deve ser declarado no formato narrativo abaixo, informando a ferramenta utilizada, a finalidade, a etapa da atividade, o tipo de contribuição, a confirmação de que não houve tratamento de dados pessoais, e a confirmação de revisão crítica e responsabilidade humana sobre o resultado final.

Qualquer uso de IA fora do escopo acima descrito (por exemplo, em atividades avaliativas não expressamente autorizadas) é considerado **uso condicionado ou proibido**, conforme o caso, e deverá ser previamente consultado com o professor.

Modelo de declaração a ser incluído na atividade quando houver uso de IA:
_Declaro que utilizei a(s) ferramenta(s) de Inteligência Artificial [informar nome e versão da ferramenta, conforme constante no Catálogo de IA do CESAR] nesta atividade, com a finalidade de gerar um rascunho sobre [tema], sobre o qual realizei análise crítica (curadoria) das informações apresentadas. Não tratei dados pessoais no uso desta ferramenta. Revisei criticamente o conteúdo gerado, identificando seus acertos e eventuais imprecisões, e assumo a responsabilidade integral pela versão final apresentada._
