import api from './api'

/* ── Types ─────────────────────────────────────────── */
export interface Biodata {
  _id: string
  user: string
  generalInfo_id?: string  // GeneralInfo document _id (used for delete when from admin endpoint)
  user_id?: number
  bio_type: string
  date_of_birth: string
  height: number
  gender: string
  weight: number
  blood_group: string
  screen_color: string
  nationality: string
  marital_status: string
  religion?: string
  religious_type?: string
  upzilla?: string
  zilla?: string
  views_count?: number
  likes_count?: number
  dislikes_count?: number
  purchases_count?: number
  isFeatured?: boolean
  isMarriageDone?: boolean
  request_practicing_status?: boolean
  createdAt?: string
  updatedAt?: string
  user_status?: string
  // Versioning fields
  biodata_status?: string
  version?: number
  approved_data?: any
  pending_changes?: any
  admin_note?: string
  last_approved_at?: string
  last_approved_by?: string
}

export interface BiodataDetail {
  generalInfo: Biodata | null
  address: any
  educationQualification: any
  personalInfo: any
  familyStatus: any
  occupation: any
  maritalInfo: any
  expectedLifePartner: any
  ongikarNama: any
  contact?: {
    full_name: string
    family_number: string
    relation: string
    bio_receiving_email: string
  }
}

export interface BiodataFilters {
  search?: string
  bio_type?: string
  gender?: string
  marital_status?: string
  page?: number
  limit?: number
}

/* ── Service ──────────────────────────────────────── */
export const biodataService = {
  // Admin: list biodatas (paginated)
  getBiodatas: async (filters: BiodataFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.bio_type && filters.bio_type !== 'all') params.append('bio_type', filters.bio_type)
    if (filters.gender && filters.gender !== 'all') params.append('gender', filters.gender)
    if (filters.marital_status && filters.marital_status !== 'all') params.append('marital_status', filters.marital_status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    try {
      // Try admin endpoint first
      const res = await api.get(`/api/admin/biodatas?${params.toString()}`)
      return res.data
    } catch {
      // Fallback to public general-info
      const res = await api.get(`/api/v1/general-info?${params.toString()}`)
      const items = res.data?.data || []
      return {
        success: true,
        data: {
          biodatas: items,
          pagination: { currentPage: 1, totalPages: 1, totalItems: items.length, itemsPerPage: items.length, hasNext: false, hasPrev: false },
        },
      }
    }
  },

  // Admin: get full biodata + contact by user_id number
  getBiodataByUserId: async (userId: number): Promise<BiodataDetail> => {
    const res = await api.get(`/api/v1/bio-data/admin/${userId}`)
    return res.data.data
  },

  // Public: get full biodata (no contact)
  getBiodataPublic: async (userId: number) => {
    const res = await api.get(`/api/v1/bio-data/${userId}`)
    return res.data.data
  },

  // Admin: update biodata status  (approved | rejected | banned | blocked)
  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/api/admin/biodatas/${id}/status`, { status })
    return res.data
  },

  // Delete general-info by id
  deleteBiodata: async (id: string) => {
    const res = await api.delete(`/api/v1/general-info/${id}`)
    return res.data
  },

  // Admin: approve pending biodata changes
  approveBiodataChanges: async (id: string) => {
    const res = await api.post(`/api/v1/general-info/${id}/admin/approve`)
    return res.data
  },

  // Admin: reject pending biodata changes
  rejectBiodataChanges: async (id: string, reason: string) => {
    const res = await api.post(`/api/v1/general-info/${id}/admin/reject`, { reason })
    return res.data
  },
}
