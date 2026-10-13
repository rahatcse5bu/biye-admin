import api from './api'

export type UploadStatus = 'live' | 'pending' | 'unused'

export interface UploadItem {
  public_id: string
  url: string
  thumbnail: string
  bytes: number
  width: number
  height: number
  created_at: string
  owner: { _id: string; user_id?: number; email?: string; user_status?: string } | null
  status: UploadStatus
}

export const uploadsService = {
  list: async (params: { cursor?: string; biodata?: string }) => {
    const res = await api.get('/api/admin/uploads', { params })
    return res.data as { data: UploadItem[]; total: number; next_cursor: string | null }
  },

  remove: async (publicId: string) => {
    const res = await api.delete('/api/admin/uploads', { data: { public_id: publicId } })
    return res.data as { success: boolean; removed_from_profile: boolean }
  },
}
