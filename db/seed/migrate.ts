import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://garden:garden@localhost:5432/garden' })
await client.connect()
await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
const migrationFiles = (await readdir(resolve('db/migrations'))).filter((file) => file.endsWith('.sql')).sort()
for (const file of migrationFiles) {
  const version = file.split('_')[0]
  const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version])
  if (applied.rowCount) continue
  const alreadyInitialized = version === '0000' && (await client.query("SELECT to_regclass('public.gardens') IS NOT NULL AS exists")).rows[0].exists
  if (!alreadyInitialized) await client.query(await readFile(resolve('db/migrations', file), 'utf8'))
  await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version])
}
await client.end()
console.log('Migration applied.')
