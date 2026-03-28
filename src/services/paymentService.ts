import api from './api'

export interface Payment {
  _id: string
  transaction_id?: string
  method?: string
  user: string
  amount?: number
  status: string          // "Completed" | "Pending" | "Refunded"
  type?: string
  points?: number
  bio_id?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaymentFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export const paymentService = {
  // Admin: list payments
  getPayments: async (filters: PaymentFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    try {
      const res = await api.get(`/api/admin/payments?${params.toString()}`)
      return res.data
    } catch {
      // fallback to regular payment API
      const res = await api.get(`/api/v1/payments?${params.toString()}`)
      const items = res.data?.data || []
      return {
        success: true,
        data: {
          payments: Array.isArray(items) ? items : [items],
          pagination: { currentPage: 1, totalPages: 1, totalItems: Array.isArray(items) ? items.length : 1, itemsPerPage: 20, hasNext: false, hasPrev: false },
        },
      }
    }
  },

  // Admin: get single payment
  getPaymentById: async (id: string) => {
    try {
      const res = await api.get(`/api/admin/payments/${id}`)
      return res.data
    } catch {
      const res = await api.get(`/api/v1/payments/${id}`)
      return res.data
    }
  },

  // Admin: update payment status
  updatePaymentStatus: async (id: string, status: string) => {
    const res = await api.patch(`/api/admin/payments/${id}/status`, { status })
    return res.data
  },

  // Admin: payment stats
  getPaymentStats: async () => {
    const res = await api.get('/api/admin/payments/stats')
    return res.data
  },
}
