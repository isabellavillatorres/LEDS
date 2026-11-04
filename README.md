# LEDS

Protótipo de uma matriz de competências e alocação de desenvolvedores do LEDS / IFES: mostra quem sabe o quê e quem tem horas livres para entrar em um projeto. Roda inteiro no navegador, com um banco SQLite de verdade.

## O problema que resolve

No LEDS, os alunos desenvolvedores trabalham em vários projetos ao mesmo tempo, cada um com uma carga horária semanal diferente. Hoje, quando um gestor precisa de "dois devs Python nível 3+, com 10 h por semana", não existe um lugar único para descobrir quem tem a habilidade, qual o nível e quantas horas a pessoa ainda tem livres.

O LEDS resolve isso de dois lados. O aluno mantém o próprio perfil: habilidades, nível de proficiência (de 1 a 5) e carga horária semanal. O gestor filtra os talentos por tecnologia, nível mínimo e horas livres, vê os candidatos ordenados por aderência e já aloca a pessoa no projeto, com as horas escolhidas. A ocupação de cada pessoa é sempre calculada a partir das alocações ativas, então nunca fica desatualizada.

## Telas

- **Perfil do talento**: o aluno vê seus dados, ajusta a carga horária semanal, define o nível (1 a 5) de cada habilidade, remove habilidades, adiciona novas pelo catálogo e salva o perfil, o que atualiza a data de última atualização.
- **Busca do gestor**: o gestor filtra por tecnologia, nível mínimo e horas livres, pesquisa por texto (nome, curso ou habilidade) e recebe uma lista de perfis com percentual de match, barra de horas livres e botão para alocar no Projeto X, com confirmação.
- **Ocupação da equipe** (painel dentro da Busca): mostra horas alocadas, horas livres e taxa de ocupação de cada pessoa, com alerta quando alguém está perto do limite de horas, além de quantas vagas do Projeto X já foram preenchidas.
- **Consulta SQL e registro** (rodapé das duas telas): mostra a consulta SQL gerada pelos filtros atuais e o registro dos últimos comandos executados no banco, além de um botão para restaurar os dados iniciais.

## Tecnologias

- HTML, CSS e JavaScript puros, sem framework e sem etapa de build.
- [sql.js](https://github.com/sql-js/sql.js) 1.8.0 (SQLite compilado para JavaScript), carregado pelo cdnjs.
- `localStorage` do navegador para guardar o banco e os filtros entre uma visita e outra.
- Modelo de dados em SQL portável: `aluno`, `habilidade`, `nivel_proficiencia`, `aluno_habilidade`, `projeto`, `projeto_requisito`, `alocacao` e a view `vw_ocupacao_aluno`.
- Layout responsivo, com navegação inferior no celular e layout em colunas no computador.

## Como rodar

1. Baixe ou clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd <pasta-do-projeto>
   ```
2. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge).
   - Opcional: no VS Code, use a extensão Live Server e clique em "Go Live".
3. Mantenha a internet ligada na primeira abertura: a biblioteca sql.js é baixada do cdnjs.

Não é preciso instalar nada nem subir servidor. Para voltar ao estado original, use o botão **Restaurar dados iniciais do SQL**, no final da página.

## Quem fez o quê

| Integrante | Parte |
| --- | --- |
| _Nome do integrante_ | _Ex.: modelo de dados e script SQL_ |
| _Nome do integrante_ | _Ex.: tela Perfil do talento_ |
| _Nome do integrante_ | _Ex.: tela Busca do gestor e regra de match_ |
| _Nome do integrante_ | _Ex.: design, responsividade e testes_ |

## Status

**Já funciona**

- Perfil do talento: editar carga horária, níveis, adicionar e remover habilidades, salvar perfil.
- Busca do gestor: filtros de tecnologia, nível e horas livres, busca por texto e ordenação por match, menor taxa de ocupação, maior nível e perfil mais recente.
- Alocar e encerrar alocação no Projeto X, escolhendo as horas, com confirmação.
- Painel de ocupação da equipe, calculado pela view `vw_ocupacao_aluno`.
- Banco SQLite persistido no navegador, com restauração dos dados iniciais.
- Layout responsivo para celular e computador.

**Ainda não funciona**

- Não há login: o perfil exibido é sempre o do aluno de id 1 (Heitor Santos).
- Os dados ficam só no navegador de quem abriu; não há servidor nem banco compartilhado entre pessoas.
- Não há tela para criar projetos ou editar os requisitos de vagas; o Projeto X e seus requisitos vêm do script SQL.
- As vagas do projeto são informativas: o sistema não impede alocar mais gente do que o previsto.
- Não há tela para cadastrar novos alunos nem para alterar o catálogo de habilidades.
- Depende de internet para carregar o sql.js.
