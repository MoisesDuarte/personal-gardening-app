import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://garden:garden@localhost:5432/garden' })
await client.connect()

// Valores aproximados para validação do MVP; futuramente podem ser configuráveis por família/cultivo.
await client.query(`
  INSERT INTO crop_types (name, emoji, is_active, default_harvest_days, default_watering_interval_days, default_fertilizing_interval_days)
  VALUES ('Alface', '🥬', true, 45, 2, 14), ('Cenoura', '🥕', true, 75, 3, 21)
  ON CONFLICT (lower(name)) DO UPDATE SET
    emoji = EXCLUDED.emoji,
    default_harvest_days = EXCLUDED.default_harvest_days,
    default_watering_interval_days = EXCLUDED.default_watering_interval_days,
    default_fertilizing_interval_days = EXCLUDED.default_fertilizing_interval_days
`)
await client.end()
console.log('Seed completed.')
