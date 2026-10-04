import api from './api'

export interface RefundRequest {
  _id: string
  payment: string
  email: string
  transaction_id: string
  paid_amount: number
  refund_amount: number
  points_held: number
  reason: string
  status: 'requested' | 'refunded' | 'rejected'
  admin_note?: string
  refund_trx_id?: string
  createdAt: string
  processed_at?: string
}

export const refundService = {
  listRequests: async (status: string): Promise<RefundRequest[]> => {
    const res = await api.get('/api/v1/refund-requests', { params: { status } })
    return res.data.data || []
  },

  approveRequest: async (id: string) => {
    const res = await api.post(`/api/v1/refund-requests/${id}/approve`, {}, { timeout: 60000 })
    return res.data
  },

  rejectRequest: async (id: string, note: string) => {
    const res = await api.post(`/api/v1/refund-requests/${id}/reject`, { note })
    return res.data
  },

  // bKash refund (admin)
  refundBkash: async (data: { paymentID: string; trxID: string; amount: string }) => {
    const res = await api.post('/api/v1/bkash/refund', data, { timeout: 60000 })
    return res.data
  },

  // bKash search transaction
  searchBkash: async (trxID: string) => {
    const res = await api.post('/api/v1/bkash/search', { trxID })
    return res.data
  },
}
