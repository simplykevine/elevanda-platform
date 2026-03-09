import api from './api';
import { FeeAccount, FeeTransaction, PaginatedResponse } from '../utils/types';

export const feesService = {
  async getMyAccount(): Promise<FeeAccount | null> {
    const { data } = await api.get<PaginatedResponse<FeeAccount> | FeeAccount[]>('/fee-accounts/');
    const results = Array.isArray(data) ? data : (data.results ?? []);
    return results[0] ?? null;
  },

  async getAccountById(id: number): Promise<FeeAccount> {
    const { data } = await api.get<FeeAccount>(`/fee-accounts/${id}/`);
    return data;
  },

  async deposit(accountId: number, amount: number, description?: string): Promise<{ message: string; new_balance: string; transaction: FeeTransaction }> {
    const { data } = await api.post(`/fee-accounts/${accountId}/deposit/`, {
      amount,
      description: description ?? '',
    });
    return data;
  },

  async withdraw(accountId: number, amount: number, description?: string): Promise<{ message: string; new_balance: string; transaction: FeeTransaction }> {
    const { data } = await api.post(`/fee-accounts/${accountId}/withdraw/`, {
      amount,
      description: description ?? '',
    });
    return data;
  },
};