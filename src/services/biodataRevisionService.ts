import api from './api'

export type RevisionStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface RevisionUser {
  _id: string
  user_id?: number
  email?: string
  username?: string
  user_status?: string
}

export interface RevisionSummary {
  _id: string
  status: RevisionStatus
  user: RevisionUser | null
  submitted_at?: string
  reviewed_at?: string
  admin_note?: string
  updatedAt: string
  field_count: number
  sections: string[]
}

export type FieldChangeKind = 'added' | 'changed' | 'removed'

export interface RevisionField {
  field: string
  label: string
  kind: FieldChangeKind
  before: unknown
  after: unknown
  warnings: string[]
}

export interface RevisionSection {
  key: string
  label: string
  fields: RevisionField[]
}

export interface RevisionDetail extends Omit<RevisionSummary, 'sections' | 'field_count'> {
  reviewed_by?: { email?: string; username?: string } | null
  member: { bio_type: string | null; gender: string | null; religion: string | null; photo: string | null; joined_at: string | null }
  history: { _id: string; status: RevisionStatus; decided_at: string; admin_note?: string; field_count: number }[]
  sections: RevisionSection[]
}

export const biodataRevisionService = {
  list: async (params: { status: string; page: number; limit: number }) => {
    const res = await api.get('/api/v1/biodata-revisions', { params })
    return res.data as { data: RevisionSummary[]; total: number; totalPages: number; page: number }
  },

  pendingCount: async (): Promise<number> => {
    const res = await api.get('/api/v1/biodata-revisions/pending-count')
    return res.data?.data?.count || 0
  },

  detail: async (id: string): Promise<RevisionDetail> => {
    const res = await api.get(`/api/v1/biodata-revisions/${id}`)
    return res.data.data
  },

  approve: async (id: string, updatedAt: string) => {
    const res = await api.post(`/api/v1/biodata-revisions/${id}/approve`, { updatedAt }, { timeout: 60000 })
    return res.data
  },

  reject: async (id: string, reason: string, updatedAt: string) => {
    const res = await api.post(`/api/v1/biodata-revisions/${id}/reject`, { reason, updatedAt })
    return res.data
  },
}
