export type DevCropOverride = { wateringIntervalDays?: number; fertilizingIntervalDays?: number; harvestDays?: number }

export type DevTab = 'state' | 'time' | 'parameters' | 'events' | 'scenarios' | 'database' | 'raw'

export function useDevMode() {
  const config = useRuntimeConfig()
  const selectedGardenId = useState<string | null>('dev-selected-garden', () => null)
  const selectedPlotId = useState<string | null>('dev-selected-plot', () => null)
  const clockOverride = useState<string | null>('dev-clock-override', () => null)
  const parameterOverrides = useState<Record<string, DevCropOverride>>('dev-parameter-overrides', () => ({}))
  const activeTab = useState<DevTab>('dev-active-tab', () => 'state')
  const expanded = useState('dev-expanded', () => true)
  const revision = useState('dev-revision', () => 0)

  function setContext(gardenId: string, plotId: string | null = null) {
    selectedGardenId.value = gardenId
    selectedPlotId.value = plotId
  }

  function notifyChanged() { revision.value += 1 }

  return { enabled: computed(() => Boolean(config.public.devModeEnabled)), selectedGardenId, selectedPlotId, clockOverride, parameterOverrides, activeTab, expanded, revision, setContext, notifyChanged }
}
