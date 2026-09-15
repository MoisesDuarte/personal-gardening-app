# cultiva.

Aplicação web para organizar hortas familiares. O sistema permite criar várias hortas, representar cada uma como uma grade de células e acompanhar plantios, irrigação, adubação, previsão de colheita e histórico de cultivos concluídos.

## Stack

- Nuxt `3.15.4` com Vue `3.5.42` e TypeScript em modo estrito (`5.9.3` resolvido no lockfile; `^5.7.2` declarado no `package.json`).
- Nitro para as rotas de API do servidor.
- PostgreSQL `16` no Docker Compose, acessado pela biblioteca `pg`.
- Drizzle ORM para consultas e definição do schema em `db/schema.ts`.
- Reka UI para popovers, hover cards, sheets, dialogs e toggle groups.
- `vue-sonner` para notificações toast e Zod para validação dos payloads da API.
- Vitest para os testes de domínio.
- CSS global em `assets/css/main.css`; não há configuração de Tailwind no repositório.

O `package-lock.json` indica que o gerenciador adotado é o npm. O repositório não fixa uma versão de Node.js por `engines` ou arquivo `.nvmrc`; use uma versão LTS compatível com o Nuxt instalado.

## Pré-requisitos

- Node.js e npm.
- Docker com Docker Compose.

## Executar localmente

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Abra <http://localhost:3000>.

O Compose inicia:

- PostgreSQL em `localhost:5432`;
- pgAdmin em <http://localhost:5050>.

As credenciais padrão estão em `.env.example`. No pgAdmin, ao criar uma conexão a partir do container, use `postgres` como host, `5432` como porta e as credenciais do banco. Do host local, a aplicação usa `localhost`.

Os scripts de migração e seed leem `DATABASE_URL` do ambiente do processo e, se ela não existir, usam `postgres://garden:garden@localhost:5432/garden`. O arquivo `.env` é carregado pelo Nuxt, mas não por esses scripts Node; para usar uma URL diferente, exporte-a antes de executar os comandos:

```bash
DATABASE_URL=postgres://usuario:senha@host:5432/banco npm run db:migrate
DATABASE_URL=postgres://usuario:senha@host:5432/banco npm run db:seed
```

## Scripts disponíveis

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor Nuxt em desenvolvimento. O script força `DEV_MODE=true`. |
| `npm run build` | Gera o build de produção do Nuxt. |
| `npm run preview` | Serve o build gerado para pré-visualização. |
| `npm run db:migrate` | Executa os arquivos SQL pendentes de `db/migrations/`. |
| `npm run db:seed` | Insere ou atualiza os cultivos iniciais. |
| `npm run test` | Executa os testes uma vez com Vitest. |
| `npm run test:watch` | Executa o Vitest em modo de observação. |

Não há scripts de lint ou de verificação de tipos no `package.json` atual.

## Funcionalidades atuais

### Dashboard

- Lista e seleciona entre várias hortas.
- Mostra a horta selecionada, quantidade de plantios ativos e cuidados pendentes.
- Lista tarefas de irrigação e adubação para o dia atual.
- Exibe as próximas colheitas, quando estão dentro da janela de sete dias ou já vencidas.
- Permite criar uma nova horta com nome e dimensões de 1 a 30 linhas e 1 a 30 colunas.

### Mapa da horta

- Exibe a horta como uma grade 2D, com linhas identificadas por letras e colunas por números.
- Diferencia células livres e células com plantios ativos.
- Permite filtrar todas as células, apenas as livres ou as que precisam de cuidado.
- Permite registrar um plantio escolhendo um tipo de cultivo e uma data.
- Mostra, para cada plantio, idade, estado atual, próxima irrigação, próxima adubação e colheita prevista.
- Oferece hover card informativo em telas que suportam hover e um popover contextual para as ações.
- Permite registrar irrigação, adubação e colheita.
- Permite remover/descartar uma planta, opcionalmente com motivo; o espaço é liberado e o histórico é preservado.
- Exibe toasts de sucesso e erro após as operações.

### Histórico

- Mostra o histórico completo de um plantio, incluindo linha do tempo, eventos, duração e parâmetros do cultivo.
- Mantém uma lista separada de plantios concluídos por colheita ou remoção.
- Permite abrir os detalhes de cada plantio concluído.

Os cultivos inseridos pelo seed são `Alface` e `Cenoura`, com parâmetros padrão de ciclo, irrigação e adubação. A tela `Plantas` permite administrar outros tipos, seus emojis e o status ativo/inativo.

## Regras de domínio

- Cada célula pode ter no máximo um plantio ativo.
- A próxima irrigação é calculada a partir da data do plantio ou do último evento de irrigação.
- A próxima adubação segue a mesma regra, usando o último evento de adubação.
- A previsão de colheita é derivada da data do plantio e do ciclo do cultivo.
- Os parâmetros do tipo de planta são a referência atual dos cálculos: editar um `CropType` pode recalcular as próximas datas de plantios ativos e a exibição derivada do histórico; a tela pede confirmação quando existem plantios ativos.
- As tarefas são derivadas sob demanda; não existe uma tabela de tarefas futuras.
- Um plantio pode estar em crescimento, perto da colheita, pronto para colher, precisando irrigar ou precisando adubar. Plantios encerrados ficam com status `HARVESTED` ou `REMOVED`.
- As datas de calendário e os rótulos relativos são calculados no fuso `America/Sao_Paulo`.

## Modo de desenvolvimento

O painel interno aparece quando `DEV_MODE=true`. Como `npm run dev` já define essa variável, o painel fica disponível nesse comando. A configuração padrão do `.env.example` é `DEV_MODE=false` para outros modos de execução.

O painel inferior possui as abas `State`, `Time`, `Parameters`, `Events`, `Scenarios`, `Database` e `Raw`. Ele permite:

- inspecionar o estado derivado de uma célula e copiar o JSON bruto;
- substituir o relógio da aplicação;
- aplicar parâmetros de cultivo apenas em runtime ou persistir novos valores em `crop_types`;
- inserir eventos de cuidado;
- aplicar cenários de teste, como cuidado vencido ou planta pronta para colher;
- criar rapidamente um plantio com idade definida;
- alterar a data do plantio;
- limpar eventos, células, plantios ou uma horta.

Os endpoints `/api/dev/*` respondem `404` quando o modo não está habilitado. As operações da aba `Database` podem alterar ou apagar dados persistidos; não habilite esse modo em produção.

## Arquitetura

```text
Nuxt
├── pages/                 telas do dashboard e da horta
├── components/            UI da grade, plantios, histórico e componentes visuais
├── composables/            estado compartilhado e notificações
├── server/api/             API Nitro para hortas, plantios, eventos e tarefas
├── server/domain/          regras puras de cálculo do ciclo do cultivo
├── server/utils/           enriquecimento de plantios, erros HTTP e Dev Mode
├── db/                     schema PostgreSQL, migrações SQL e seed
└── utils/                  datas e regras de apresentação compartilhadas
```

As páginas e componentes consomem a API Nitro. O domínio em `server/domain/crop.ts` calcula datas, vencimentos e estados sem depender da UI. `server/utils/planting.ts` combina esses cálculos com os registros do PostgreSQL. O acesso ao banco é criado em `server/db.ts` usando um pool `pg` e o schema do Drizzle.

## Estrutura de dados

O schema em `db/schema.ts` contém:

- `gardens`: nome e dimensões da horta;
- `plots`: células geradas ao criar uma horta, com posição única dentro dela;
- `crop_types`: nome, emoji, status e intervalos padrão de colheita, irrigação e adubação;
- `plantings`: ciclo de um cultivo em uma célula, com status `ACTIVE`, `HARVESTED` ou `REMOVED`;
- `care_events`: eventos de irrigação, adubação, colheita e remoção.

Há chaves estrangeiras com cascata de horta para células e de células para plantios. Um índice único parcial em `plantings` impede mais de um plantio `ACTIVE` por célula.

As migrações são SQL versionado em `db/migrations/` e aplicadas por `db/seed/migrate.ts`, que controla as versões na tabela `schema_migrations`. Não há `drizzle.config.*` nem um script baseado em Drizzle Kit. O seed atual faz upsert de `Alface` e `Cenoura`.

## API principal

As rotas públicas implementadas são:

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/api/gardens` | Lista hortas. |
| `POST` | `/api/gardens` | Cria uma horta e suas células. |
| `GET` | `/api/gardens/:id` | Busca uma horta. |
| `GET` | `/api/gardens/:id/plots` | Busca células e plantios ativos enriquecidos. |
| `GET` | `/api/gardens/:id/plantings/history` | Lista plantios colhidos ou removidos. |
| `GET` | `/api/crop-types` | Lista tipos de cultivo. |
| `GET` | `/api/dashboard` | Resumo operacional global, atenção e resumo das hortas. |
| `GET` | `/api/plantings/history` | Lista cultivos concluídos de todas as hortas. |
| `POST` | `/api/crop-types` | Cria um tipo de cultivo. |
| `PATCH` | `/api/crop-types/:id` | Atualiza nome, emoji ou parâmetros. |
| `POST` | `/api/crop-types/:id/deactivate` | Desativa sem apagar referências ou histórico. |
| `POST` | `/api/crop-types/:id/reactivate` | Reativa para novos plantios. |
| `GET` | `/api/tasks/today` | Calcula tarefas e próximas colheitas. |
| `POST` | `/api/plots/:id/plantings` | Cria um plantio em uma célula livre. |
| `GET` | `/api/plantings/:id` | Busca um plantio enriquecido. |
| `POST` | `/api/plantings/:id/events` | Registra irrigação, adubação, colheita ou remoção. |

Os payloads de escrita são validados com Zod e os erros principais usam `400`, `404` e `409`.

## Escopo atual

O código atual não contém autenticação, usuários, isolamento entre famílias, notificações externas, sensores, clima ou integração GIS. A interface representa um único contexto familiar e o banco ainda não possui entidades de usuário ou família.
