import api from './api'

export interface PointsPackage {
  _id: string
  name: string
  price: number
  points: number
  features: string[]
  is_active: boolean
  sort_order: number
}

export type PointsPackageInput = Omit<PointsPackage, '_id'>

export interface CustomPointsSettings {
  enabled: boolean
  points_per_taka: number
  min_amount: number
  max_amount: number
}

export const pointsPackageService = {
  list: async (): Promise<PointsPackage[]> => {
    const res = await api.get('/api/v1/points-packages/admin')
    return res.data.data || []
  },

  create: async (data: PointsPackageInput) => {
    const res = await api.post('/api/v1/points-packages', data)
    return res.data.data as PointsPackage
  },

  update: async (id: string, data: Partial<PointsPackageInput>) => {
    const res = await api.patch(`/api/v1/points-packages/${id}`, data)
    return res.data.data as PointsPackage
  },

  remove: async (id: string) => {
    await api.delete(`/api/v1/points-packages/${id}`)
  },

  getCustomSettings: async (): Promise<CustomPointsSettings> => {
    const res = await api.get('/api/v1/points-packages/custom-settings')
    return res.data.data
  },

  updateCustomSettings: async (data: CustomPointsSettings) => {
    const res = await api.patch('/api/v1/points-packages/custom-settings', data)
    return res.data.data as CustomPointsSettings
  },
}
