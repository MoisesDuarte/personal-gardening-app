import type { CropType, Garden, Plot } from '~/types/domain'

export function useGarden() {
  const garden = useState<Garden | null>('garden', () => null)
  const plots = useState<Plot[]>('plots', () => [])
  const cropTypes = useState<CropType[]>('crop-types', () => [])
  const loading = useState('garden-loading', () => false)
  const error = useState<string | null>('garden-error', () => null)

  async function loadGarden(id: string) {
    loading.value = true
    error.value = null
    try {
      const [gardenData, plotsData] = await Promise.all([ $fetch<Garden>(`/api/gardens/${id}`), $fetch<Plot[]>(`/api/gardens/${id}/plots`) ])
      garden.value = gardenData
      plots.value = plotsData
    } catch (cause: any) {
      error.value = cause?.data?.statusMessage || 'Não foi possível carregar a horta.'
    } finally { loading.value = false }
  }

  async function loadCropTypes() { cropTypes.value = await $fetch<CropType[]>('/api/crop-types') }

  return { garden, plots, cropTypes, loading, error, loadGarden, loadCropTypes }
}
