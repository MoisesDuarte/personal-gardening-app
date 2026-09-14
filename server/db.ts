import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/db/schema'

let pool: Pool | undefined

export function useDb() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new Pool({ connectionString: config.databaseUrl })
  }

  return drizzle(pool, { schema })
}
