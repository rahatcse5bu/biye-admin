import api from './api'

export type Religion = 'islam' | 'hinduism' | 'christianity'

export interface DefaultQuestionSet {
  religion: Religion
  questions: string[]
}

export const defaultQuestionsService = {
  list: async (): Promise<DefaultQuestionSet[]> => {
    const res = await api.get('/api/v1/bio-questions/defaults')
    return res.data.data || []
  },

  update: async (religion: Religion, questions: string[]): Promise<DefaultQuestionSet> => {
    const res = await api.put(`/api/v1/bio-questions/defaults/${religion}`, { questions })
    return res.data.data
  },
}
