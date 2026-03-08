import api from './api';
import { Grade, PaginatedResponse } from '../utils/types';

export const gradesService = {
  async getMyGrades(): Promise<Grade[]> {
    const { data } = await api.get<PaginatedResponse<Grade> | Grade[]>('/grades/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Grade>).results ?? [];
  },
};