import api from './api'

export type ContactMessageStatus = 'new' | 'read' | 'resolved'

export interface ContactMessage {
  _id: string
  name: string
  email: string
  phone?: string
  bio?: string
  message: string
  status: ContactMessageStatus
  createdAt: string
  updatedAt: string
}

export interface ContactMessageList {
  data: ContactMessage[]
  page: number
  total: number
  totalPages: number
}

export const contactMessageService = {
  list: async (params: { page: number; limit: number; status?: string; search?: string }): Promise<ContactMessageList> => {
    const res = await api.get('/api/v1/contact-messages', { params })
    return res.data
  },

  unreadCount: async (): Promise<number> => {
    const res = await api.get('/api/v1/contact-messages/unread-count')
    return res.data?.data?.count || 0
  },

  setStatus: async (id: string, status: ContactMessageStatus) => {
    const res = await api.patch(`/api/v1/contact-messages/${id}`, { status })
    return res.data
  },

  remove: async (id: string) => {
    const res = await api.delete(`/api/v1/contact-messages/${id}`)
    return res.data
  },
}
