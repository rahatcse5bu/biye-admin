import api from './api'

export interface FeaturedSettings {
  enabled: boolean
  price: number
  duration_days: number
}

export interface FeaturedRequest {
  _id: string
  email: string
  bio_user_id?: number
  payment_id: string
  transaction_id?: string
  amount: number
  duration_days: number
  status: 'pending' | 'approved' | 'rejected'
  refunded: boolean
  admin_note?: string
  reviewed_at?: string
  featured_until?: string
  createdAt: string
  biodata?: { _id: string; isFeatured?: boolean; featured_until?: string | null; biodata_status?: string } | null
}

export interface FeaturedRequestList {
  data: FeaturedRequest[]
  total: number
  page: number
  limit: number
  pending: number
}

export const featuredRequestService = {
  getSettings: async (): Promise<FeaturedSettings> => {
    const res = await api.get('/api/v1/featured-requests/settings')
    return res.data.data
  },

  updateSettings: async (data: FeaturedSettings): Promise<FeaturedSettings> => {
    const res = await api.patch('/api/v1/featured-requests/settings', data)
    return res.data.data
  },

  list: async (status: string, page = 1): Promise<FeaturedRequestList> => {
    const res = await api.get('/api/v1/featured-requests', { params: { status: status === 'all' ? undefined : status, page } })
    return res.data
  },

  approve: async (id: string, note: string) => {
    const res = await api.post(`/api/v1/featured-requests/${id}/approve`, { note })
    return res.data
  },

  // TODO: refunds go through bKash, so give them more time than the default 15s.
  reject: async (id: string, note: string, refund: boolean) => {
    const res = await api.post(`/api/v1/featured-requests/${id}/reject`, { note, refund }, { timeout: 60000 })
    return res.data
  },
}
