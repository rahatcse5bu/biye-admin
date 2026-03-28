import api from './api'

export interface User {
  _id: string
  user_id: number
  email: string
  user_role: string
  user_status: string
  edited_timeline_index: number
  points: number
  last_edited_timeline_index: number
  gender?: string
  fcmToken?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserFilters {
  search?: string
  status?: string
  user_type?: string
  page?: number
  limit?: number
}

export const userService = {
  // Admin: list all users
  getUsers: async (filters: UserFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.user_type && filters.user_type !== 'all') params.append('user_type', filters.user_type)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const res = await api.get(`/api/admin/users?${params.toString()}`)
    return res.data
  },

  // Admin: get single user with full biodata
  getUserById: async (id: string) => {
    const res = await api.get(`/api/admin/users/${id}`)
    return res.data
  },

  // Admin: update user status (active | inactive | banned | pending | in review)
  updateUserStatus: async (id: string, user_status: string) => {
    const res = await api.patch(`/api/admin/users/${id}/status`, { status: user_status })
    return res.data
  },

  // Admin: delete user (soft)
  deleteUser: async (id: string) => {
    const res = await api.delete(`/api/admin/users/${id}`)
    return res.data
  },

  // Existing: admin update user by bioId
  adminUpdateUser: async (bioId: string, data: Record<string, unknown>) => {
    const res = await api.put(`/api/v1/user-info/admin-update/${bioId}`, data)
    return res.data
  },
}
