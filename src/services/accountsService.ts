import api from './api';

export type EntryType = 'expense' | 'income' | 'investment';

export interface AccountEntryInput {
  type: EntryType;
  amount: string;
  date: string;
  category: string;
  person: string;
  notes: string;
}

export interface AccountEntry extends Omit<AccountEntryInput, 'amount'> {
  _id: string;
  amount: number;
}

export interface AccountsData {
  entries: AccountEntry[];
  summary: { income: number; investment: number; expense: number; balance: number };
  pagination: { currentPage: number; totalPages: number; totalItems: number };
}

export const accountsService = {
  list: async (filters: { page: number; type: string; search: string }): Promise<AccountsData> => {
    const { type, ...rest } = filters;
    const response = await api.get('/api/admin/accounts', { params: { ...rest, ...(type ? { type } : {}) } });
    return response.data.data;
  },
  create: async (entry: AccountEntryInput) => api.post('/api/admin/accounts', entry),
  update: async (id: string, entry: AccountEntryInput) => api.patch(`/api/admin/accounts/${id}`, entry),
};
