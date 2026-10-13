import api from './api'

export type EngagementType = 'favorites' | 'shortlists' | 'reactions' | 'dislikes'

export interface EngagementUser {
  _id: string
  user_id?: number
  email?: string
  username?: string
  user_status?: string
}

export interface EngagementItem {
  _id: string
  member?: EngagementUser
  biodata?: EngagementUser
  reaction_type?: string
  createdAt: string
}

export interface EngagementResponse {
  data: EngagementItem[]
  page: number
  total: number
  totalPages: number
  stats: {
    total: number
    last7: number
    byType: { type: string; count: number }[]
    top: { count: number; biodata?: EngagementUser }[]
  }
}

export const engagementService = {
  list: async (
    type: EngagementType,
    params: { page: number; limit: number; search?: string; reaction_type?: string },
  ): Promise<EngagementResponse> => {
    const res = await api.get(`/api/admin/engagement/${type}`, { params })
    return res.data
  },
}
