import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://garden:garden@localhost:5432/garden' })
await client.connect()
await client.query(await readFile(resolve('db/migrations/0000_initial.sql'), 'utf8'))
await client.end()
console.log('Migration applied.')
