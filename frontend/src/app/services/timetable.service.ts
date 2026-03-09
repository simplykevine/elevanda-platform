import api from './api';
import { TimetableEntry, PaginatedResponse } from '../utils/types';

export const timetableService = {
  async getMyTimetable(): Promise<TimetableEntry[]> {
    const { data } = await api.get<PaginatedResponse<TimetableEntry> | TimetableEntry[]>('/timetable/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<TimetableEntry>).results ?? [];
  },
};