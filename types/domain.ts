export type CropType = { id: string; name: string; defaultHarvestDays: number; defaultWateringIntervalDays: number; defaultFertilizingIntervalDays: number }
export type CareEvent = { id: string; type: 'WATERING' | 'FERTILIZING' | 'HARVEST'; performedAt: string; notes?: string | null }
export type Planting = {
  id: string; plotId: string; cropTypeId: string; plantedAt: string; expectedHarvestAt: string; harvestedAt?: string | null; status: 'ACTIVE' | 'HARVESTED'
  cropType: CropType; events: CareEvent[]; ageInDays: number; nextWateringAt: string; nextFertilizingAt: string
  state: 'HARVESTED' | 'READY' | 'NEEDS_WATERING' | 'NEEDS_FERTILIZING' | 'NEAR_HARVEST' | 'GROWING'
}
export type Plot = { id: string; gardenId: string; row: number; column: number; planting: Planting | null }
export type Garden = { id: string; name: string; rows: number; columns: number; createdAt: string; updatedAt: string }
export type Task = { id: string; type: 'WATERING' | 'FERTILIZING'; label: string; plantingId: string; plot: { row: number; column: number }; garden: Garden }
export type UpcomingHarvest = { plantingId: string; cropName: string; expectedHarvestAt: string; plot: { row: number; column: number }; garden: Garden }
