import api from './api'

export type FieldType = 'section' | 'text' | 'multi-line' | 'numeric' | 'email' | 'phone' | 'select' | 'boolean'

export interface ExtraField {
  label: string
  value: string | number | boolean
  fieldType: FieldType
  options?: string[]
}

export interface UnverifiedBiodata {
  _id: string
  bio_id: number
  bio_type: string
  gender: string
  date_of_birth: string
  height: number
  weight: number
  blood_group: string
  screen_color: string
  nationality: string
  marital_status: string
  religion: string
  religious_type?: string
  photos: string[]
  zilla: string
  upzilla: string
  division: string
  extra_fields: ExtraField[]
  contact_name: string
  contact_phone: string
  contact_email: string
  views_count: number
  purchases_count: number
  is_active: boolean
  createdAt?: string
}

export interface CreateUnverifiedBiodataPayload {
  bio_type: string
  gender: string
  date_of_birth: string
  height: number
  weight: number
  blood_group: string
  screen_color: string
  nationality: string
  marital_status: string
  religion: string
  religious_type?: string
  zilla: string
  upzilla?: string
  division?: string
  extra_fields?: ExtraField[]
  contact_name: string
  contact_phone: string
  contact_email: string
}

export const unverifiedBiodataService = {
  getAll: async (page = 1, limit = 20, search?: string) => {
    const params: any = { page, limit }
    if (search) params.search = search
    const res = await api.get('/api/v1/unverified-biodatas/admin/all', { params })
    return res.data
  },

  create: async (payload: CreateUnverifiedBiodataPayload) => {
    const res = await api.post('/api/v1/unverified-biodatas', payload)
    return res.data
  },

  update: async (id: string, payload: Partial<CreateUnverifiedBiodataPayload> & { is_active?: boolean }) => {
    const res = await api.put(`/api/v1/unverified-biodatas/${id}`, payload)
    return res.data
  },

  delete: async (id: string) => {
    const res = await api.delete(`/api/v1/unverified-biodatas/${id}`)
    return res.data
  },
}
