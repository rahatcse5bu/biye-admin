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
