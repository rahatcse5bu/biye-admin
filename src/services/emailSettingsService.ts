import api from './api'

export interface SocialLink {
  label: string
  url: string
}

export interface EmailSettings {
  logo_url: string
  support_email: string
  social_links: SocialLink[]
}

export const emailSettingsService = {
  get: async (): Promise<EmailSettings> => {
    const res = await api.get('/api/v1/email-settings')
    return res.data.data
  },

  update: async (data: EmailSettings): Promise<EmailSettings> => {
    const res = await api.patch('/api/v1/email-settings', data)
    return res.data.data
  },

  preview: async (data: EmailSettings): Promise<string> => {
    const res = await api.post('/api/v1/email-settings/preview', data)
    return res.data.data.html
  },
}

export interface EmailUsage {
  status: 'ok' | 'warning' | 'exhausted'
  daily_limit: number
  sent_last_24h: number
  remaining: number
  next_slot_at: string | null
  blocked_until: string | null
  total_sent: number
  total_failed: number
  counting_since: string | null
  daily: { date: string; sent: number; failed: number }[]
  recent_failures: { _id: string; to: string; subject: string; error?: string; limit_hit?: boolean; createdAt: string }[]
}

export const emailUsageService = {
  get: async (): Promise<EmailUsage> => {
    const res = await api.get('/api/v1/email-settings/usage')
    return res.data.data
  },

  setDailyLimit: async (daily_limit: number): Promise<number> => {
    const res = await api.patch('/api/v1/email-settings/daily-limit', { daily_limit })
    return res.data.data.daily_limit
  },
}
