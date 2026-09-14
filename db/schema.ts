import { relations, sql } from 'drizzle-orm'
import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const plantingStatus = pgEnum('planting_status', ['ACTIVE', 'HARVESTED'])
export const careEventType = pgEnum('care_event_type', ['WATERING', 'FERTILIZING', 'HARVEST'])

export const gardens = pgTable('gardens', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  rows: integer('rows').notNull(),
  columns: integer('columns').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const cropTypes = pgTable('crop_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  defaultHarvestDays: integer('default_harvest_days').notNull(),
  defaultWateringIntervalDays: integer('default_watering_interval_days').notNull(),
  defaultFertilizingIntervalDays: integer('default_fertilizing_interval_days').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const plots = pgTable('plots', {
  id: uuid('id').defaultRandom().primaryKey(),
  gardenId: uuid('garden_id').notNull().references(() => gardens.id, { onDelete: 'cascade' }),
  row: integer('row').notNull(),
  column: integer('column').notNull()
}, (table) => ({
  gardenPosition: uniqueIndex('plots_garden_position_idx').on(table.gardenId, table.row, table.column)
}))

export const plantings = pgTable('plantings', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotId: uuid('plot_id').notNull().references(() => plots.id, { onDelete: 'cascade' }),
  cropTypeId: uuid('crop_type_id').notNull().references(() => cropTypes.id),
  plantedAt: timestamp('planted_at', { withTimezone: true }).notNull(),
  expectedHarvestAt: timestamp('expected_harvest_at', { withTimezone: true }).notNull(),
  harvestedAt: timestamp('harvested_at', { withTimezone: true }),
  status: plantingStatus('status').default('ACTIVE').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  oneActivePerPlot: uniqueIndex('one_active_planting_per_plot_idx')
    .on(table.plotId)
    .where(sql`${table.status} = 'ACTIVE'`)
}))

export const careEvents = pgTable('care_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  plantingId: uuid('planting_id').notNull().references(() => plantings.id, { onDelete: 'cascade' }),
  type: careEventType('type').notNull(),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const gardenRelations = relations(gardens, ({ many }) => ({ plots: many(plots) }))
export const cropTypeRelations = relations(cropTypes, ({ many }) => ({ plantings: many(plantings) }))
export const plotRelations = relations(plots, ({ one, many }) => ({ garden: one(gardens, { fields: [plots.gardenId], references: [gardens.id] }), plantings: many(plantings) }))
export const plantingRelations = relations(plantings, ({ one, many }) => ({ plot: one(plots, { fields: [plantings.plotId], references: [plots.id] }), cropType: one(cropTypes, { fields: [plantings.cropTypeId], references: [cropTypes.id] }), events: many(careEvents) }))
export const careEventRelations = relations(careEvents, ({ one }) => ({ planting: one(plantings, { fields: [careEvents.plantingId], references: [plantings.id] }) }))

export type Garden = typeof gardens.$inferSelect
export type CropType = typeof cropTypes.$inferSelect
export type Plot = typeof plots.$inferSelect
export type Planting = typeof plantings.$inferSelect
export type CareEvent = typeof careEvents.$inferSelect
