# cultiva.

MVP web para controle familiar de plantio, cuidados e colheita. A aplicação representa a horta como uma grade 2D e deriva as tarefas a partir do plantio, dos parâmetros do cultivo e do último evento de cuidado.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Instalação e execução

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`. O pgAdmin estará em `http://localhost:5050` usando as credenciais do `.env`. Para conectar ao banco no pgAdmin, use `postgres` como host, a porta `5432` e as credenciais configuradas.

Testes:

```bash
npm test
```

## Modo Desenvolvedor

As ferramentas internas de QA ficam desativadas por padrão. Para habilitá-las localmente:

```bash
DEV_MODE=true npm run dev
```

O painel inferior permite substituir o relógio da aplicação, ajustar parâmetros em runtime, inspecionar o estado derivado, criar eventos/cenários e resetar dados de desenvolvimento. Os endpoints `/api/dev/*` retornam `404` quando `DEV_MODE` não está habilitado. Nunca ative esse modo em produção.

## Arquitetura

- `pages/` e `components/`: interface Nuxt/Vue.
- `server/api/`: rotas Nitro REST.
- `server/domain/crop.ts`: cálculos de datas e estados, sem dependência do banco ou da UI.
- `db/schema.ts`: schema Drizzle/PostgreSQL.
- `db/migrations/`: SQL versionado; `db/seed/`: migração e dados iniciais.

O banco possui `gardens`, `plots`, `crop_types`, `plantings` e `care_events`. Um índice único parcial garante que cada célula tenha no máximo um plantio ativo. O histórico de cuidados é persistido, mas tarefas futuras não são materializadas.

## Cortes do MVP

O sistema assume um único núcleo familiar e não implementa autenticação, notificações, sensores, clima, GIS ou administração dos parâmetros agronômicos. Alface e Cenoura usam valores padrão aproximados (`45/2/14` e `75/3/21` dias para colheita/irrigação/adubação) apenas para validar o fluxo; esses parâmetros estão no modelo para futura configuração.
