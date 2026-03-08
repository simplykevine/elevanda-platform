import api from './api';
import { AttendanceRecord, PaginatedResponse } from '../utils/types';

export const attendanceService = {
  async getMyAttendance(): Promise<AttendanceRecord[]> {
    const { data } = await api.get<PaginatedResponse<AttendanceRecord>>('/attendance/');
    return data.results;
  },
};