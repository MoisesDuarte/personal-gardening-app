import { describe, expect, it } from 'vitest'
import { addDays, expectedHarvestAt, isDue, nextFertilizingAt, nextWateringAt, plantingState } from '../server/domain/crop'

const plantedAt = new Date('2026-01-01T12:00:00.000Z')
const today = new Date('2026-01-10T12:00:00.000Z')

describe('regras do plantio', () => {
  it('calcula a previsão de colheita', () => {
    expect(expectedHarvestAt(plantedAt, { defaultHarvestDays: 45, defaultWateringIntervalDays: 2, defaultFertilizingIntervalDays: 14 })).toEqual(new Date('2026-02-15T12:00:00.000Z'))
  })

  it('usa a data do plantio e depois o último evento para irrigação', () => {
    expect(nextWateringAt(plantedAt, 2)).toEqual(new Date('2026-01-03T12:00:00.000Z'))
    expect(nextWateringAt(plantedAt, 2, [{ type: 'WATERING', performedAt: new Date('2026-01-09T09:00:00.000Z') }])).toEqual(new Date('2026-01-11T09:00:00.000Z'))
  })

  it('calcula adubação a partir do último evento', () => {
    expect(nextFertilizingAt(plantedAt, 14, [{ type: 'FERTILIZING', performedAt: new Date('2026-01-05T12:00:00.000Z') }])).toEqual(new Date('2026-01-19T12:00:00.000Z'))
  })

  it('detecta tarefa vencida e prioriza plantio pronto', () => {
    expect(isDue(new Date('2026-01-10T23:00:00Z'), today)).toBe(true)
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, 20), wateringAt: addDays(today, -1), fertilizingAt: addDays(today, 3) }, today)).toBe('NEEDS_WATERING')
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, -1), wateringAt: addDays(today, 4), fertilizingAt: addDays(today, 4) }, today)).toBe('READY')
  })
})
