import { describe, expect, it } from 'vitest'
import { addDays, daysUntil, expectedHarvestAt, isDue, nextFertilizingAt, nextWateringAt, plantingNeedsCare, plantingState } from '../server/domain/crop'
import { relativeDayLabel } from '../utils/dates'

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

  it('usa a irrigação mais recente, ignorando outros tipos e a ordem recebida', () => {
    expect(nextWateringAt(plantedAt, 2, [
      { type: 'WATERING', performedAt: new Date('2026-01-13T09:00:00.000Z') },
      { type: 'FERTILIZING', performedAt: new Date('2026-01-20T09:00:00.000Z') },
      { type: 'WATERING', performedAt: new Date('2026-01-09T09:00:00.000Z') }
    ])).toEqual(new Date('2026-01-15T09:00:00.000Z'))
  })

  it('calcula adubação a partir do último evento', () => {
    expect(nextFertilizingAt(plantedAt, 14, [{ type: 'FERTILIZING', performedAt: new Date('2026-01-05T12:00:00.000Z') }])).toEqual(new Date('2026-01-19T12:00:00.000Z'))
  })

  it('mantém ciclos independentes para irrigação e adubação', () => {
    const events = [
      { type: 'WATERING' as const, performedAt: new Date('2026-01-09T09:00:00.000Z') },
      { type: 'FERTILIZING' as const, performedAt: new Date('2026-01-10T09:00:00.000Z') }
    ]
    expect(nextWateringAt(plantedAt, 2, events)).toEqual(new Date('2026-01-11T09:00:00.000Z'))
    expect(nextFertilizingAt(plantedAt, 14, events)).toEqual(new Date('2026-01-24T09:00:00.000Z'))
  })

  it('detecta tarefa vencida e prioriza plantio pronto', () => {
    expect(isDue(new Date('2026-01-10T23:00:00Z'), today)).toBe(true)
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, 20), wateringAt: addDays(today, -1), fertilizingAt: addDays(today, 3) }, today)).toBe('NEEDS_WATERING')
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, -1), wateringAt: addDays(today, 4), fertilizingAt: addDays(today, 4) }, today)).toBe('READY')
  })

  it('classifica os dias do calendário sem esconder atrasos', () => {
    expect(daysUntil(new Date('2026-01-09T23:00:00Z'), today)).toBe(-1)
    expect(relativeDayLabel(-1)).toBe('Atrasada há 1 dia')
    expect(relativeDayLabel(0)).toBe('Hoje')
    expect(relativeDayLabel(1)).toBe('Amanhã')
    expect(relativeDayLabel(3)).toBe('Em 3 dias')
  })

  it('considera cuidado pendente quando há cuidado ou colheita próxima', () => {
    expect(plantingNeedsCare({ expectedHarvestAt: addDays(today, 30), needsWatering: false, needsFertilizing: false }, today)).toBe(false)
    expect(plantingNeedsCare({ expectedHarvestAt: addDays(today, 30), needsWatering: true, needsFertilizing: false }, today)).toBe(true)
    expect(plantingNeedsCare({ expectedHarvestAt: addDays(today, 5), needsWatering: false, needsFertilizing: false }, today)).toBe(true)
  })

  it('diferencia um plantio removido de um plantio colhido', () => {
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, 20), wateringAt: addDays(today, 2), fertilizingAt: addDays(today, 3), removedAt: today }, today)).toBe('REMOVED')
    expect(plantingState({ plantedAt, expectedHarvestAt: addDays(today, 20), wateringAt: addDays(today, 2), fertilizingAt: addDays(today, 3), harvestedAt: today }, today)).toBe('HARVESTED')
  })
})
