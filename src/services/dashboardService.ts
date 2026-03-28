import api from './api'

export interface DashboardStats {
  users: { total: number; active: number; inactive: number; banned: number; pending: number; recent: number }
  biodatas: { total: number; verified: number; pending: number }
  payments: { total: number; completed: number; pending: number; revenue: number }
  refunds: { total: number; pending: number; approved: number; rejected: number; processed: number }
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/api/admin/dashboard/stats')
    return res.data.data
  },
  getBioStats: async () => {
    const res = await api.get('/api/v1/bio-data/stats')
    return res.data.data
  },
}
