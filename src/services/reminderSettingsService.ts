import api from './api'

export interface ReminderSettings {
  max_emails: number
  cooldown_hours: number
}

export const reminderSettingsService = {
  get: async (): Promise<ReminderSettings> => {
    const res = await api.get('/api/v1/bio-choice-data/reminder-settings')
    return res.data.data
  },

  update: async (data: ReminderSettings): Promise<ReminderSettings> => {
    const res = await api.patch('/api/v1/bio-choice-data/reminder-settings', data)
    return res.data.data
  },
}
