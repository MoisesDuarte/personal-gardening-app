export type CropType = { id: string; name: string; emoji: string; isActive: boolean; defaultHarvestDays: number; defaultWateringIntervalDays: number; defaultFertilizingIntervalDays: number; activePlantingCount?: number }
export type CareEvent = { id: string; type: 'WATERING' | 'FERTILIZING' | 'HARVEST' | 'REMOVAL'; performedAt: string; notes?: string | null }
export type Planting = {
  id: string; plotId: string; cropTypeId: string; plantedAt: string; expectedHarvestAt: string; harvestedAt?: string | null; removedAt?: string | null; status: 'ACTIVE' | 'HARVESTED' | 'REMOVED'
  cropType: CropType; events: CareEvent[]; ageInDays: number; nextWateringAt: string; nextFertilizingAt: string; wateringOverdueDays: number; fertilizingOverdueDays: number; wateringDaysUntil: number; fertilizingDaysUntil: number; needsWatering: boolean; needsFertilizing: boolean; needsCare: boolean; daysToHarvest: number
  state: 'HARVESTED' | 'REMOVED' | 'READY' | 'NEEDS_WATERING' | 'NEEDS_FERTILIZING' | 'NEAR_HARVEST' | 'GROWING'
}
export type Plot = { id: string; gardenId: string; row: number; column: number; planting: Planting | null }
export type HistoricalPlanting = Planting & { plot: Pick<Plot, 'id' | 'row' | 'column'>; endedAt: string; durationInDays: number }
export type Garden = { id: string; name: string; rows: number; columns: number; createdAt: string; updatedAt: string }
export type Task = { id: string; type: 'WATERING' | 'FERTILIZING'; label: string; plantingId: string; plot: { row: number; column: number }; garden: Garden }
export type UpcomingHarvest = { plantingId: string; cropName: string; cropEmoji?: string; expectedHarvestAt: string; plot: { row: number; column: number }; garden: Garden }
export type GardenSummary = { garden: Garden; activeCount: number; freeCount: number; careCount: number }
export type DashboardAttentionItem = { plantingId: string; kind: 'WATERING' | 'FERTILIZING' | 'HARVEST'; cropType: CropType; plot: Pick<Plot, 'id' | 'row' | 'column'>; garden: Garden; daysUntil: number }
export type DashboardData = { attentionItems: DashboardAttentionItem[]; attentionTotal: number; gardens: GardenSummary[]; upcomingHarvests: UpcomingHarvest[]; activePlantingsCount: number; careCount: number }
export type GlobalHistoricalPlanting = HistoricalPlanting & { garden: Garden }
