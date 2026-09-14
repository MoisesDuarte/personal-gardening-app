import { toast } from 'vue-sonner'

export function useGardenToast() {
  return {
    success: (title: string, description?: string) => toast.success(title, { description }),
    error: (title: string, description?: string) => toast.error(title, { description })
  }
}
