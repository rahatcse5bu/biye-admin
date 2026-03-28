import api from './api'

export const refundService = {
  // bKash refund (admin)
  refundBkash: async (data: { paymentID: string; trxID: string; amount: string }) => {
    const res = await api.post('/api/v1/bkash/refund', data)
    return res.data
  },

  // bKash search transaction
  searchBkash: async (trxID: string) => {
    const res = await api.post('/api/v1/bkash/search', { trxID })
    return res.data
  },
}
