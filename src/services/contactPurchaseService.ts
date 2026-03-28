import api from './api'

export interface ContactPurchase {
  _id: string
  user: string
  bio_user: string
  transaction_id?: string
  createdAt?: string
  updatedAt?: string
  userContact?: { full_name: string; family_number: string; relation: string; bio_receiving_email: string }
  bioUserContact?: { full_name: string; family_number: string; relation: string; bio_receiving_email: string }
  userDetails?: { user_id: number; user_status: string; email: string; points: number }
  bioUserDetails?: { user_id: number; user_status: string; email: string; points: number }
}

export interface ContactPurchaseFilters {
  status?: string
  page?: number
  limit?: number
  search?: string
}

export const contactPurchaseService = {
  getAll: async (filters: ContactPurchaseFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)

    const res = await api.get(`/api/v1/contact-purchase-data/admin/all?${params.toString()}`)
    return res.data
  },
}
