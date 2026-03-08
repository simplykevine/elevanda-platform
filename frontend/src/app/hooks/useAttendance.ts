import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendance.service';
import { AttendanceRecord } from '../utils/types';
import toast from 'react-hot-toast';

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService
      .getMyAttendance()
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error('Could not load attendance.');
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount  = records.filter((r) => r.status === 'absent').length;
  const lateCount    = records.filter((r) => r.status === 'late').length;
  const rate = records.length > 0
    ? Math.round((presentCount / records.length) * 100)
    : 0;

  return { records, loading, presentCount, absentCount, lateCount, attendanceRate: rate };
}