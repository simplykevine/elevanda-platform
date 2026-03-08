'use client';

import Header from '../../../SharedComponents/layout/components/Header';
import Card from '../../../SharedComponents/ui/Card';
import Badge from '../../../SharedComponents/ui/Badge';
import Table from '../../../SharedComponents/ui/Table';
import Spinner from '../../../SharedComponents/ui/Spinner';
import { useAttendance } from '../../../hooks/useAttendance';
import { AttendanceRecord } from '../../../utils/types';
import { formatDate } from '../../../utils/format';

function getAttendanceBadge(status: AttendanceRecord['status']) {
  const map = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    excused: 'info',
  } as const;
  return map[status] ?? 'default';
}

export default function AttendancePage() {
  const { records, loading, presentCount, absentCount, lateCount, attendanceRate } = useAttendance();

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (r: AttendanceRecord) => <span className="font-medium">{formatDate(r.date)}</span>,
    },
    {
      key: 'class',
      header: 'Class',
      render: (r: AttendanceRecord) => r.class_name,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: AttendanceRecord) => (
        <Badge variant={getAttendanceBadge(r.status)} className="capitalize">
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (r: AttendanceRecord) => <span className="text-slate-500">{r.notes || '—'}</span>,
    },
  ];

  return (
    <>
      <Header title="Attendance" subtitle="Track your attendance record this term." />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Attendance Rate</p>
                <p className={`mt-1 text-3xl font-bold ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {attendanceRate}%
                </p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Present</p>
                <p className="mt-1 text-3xl font-bold text-emerald-600">{presentCount}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Absent</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{absentCount}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Late</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">{lateCount}</p>
              </Card>
            </div>

            {/* Progress bar */}
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Overall Attendance</p>
                <span className={`text-sm font-semibold ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${attendanceRate >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              {attendanceRate < 75 && (
                <p className="mt-2 text-xs text-red-600">
                  Attendance is below the required 75% threshold.
                </p>
              )}
            </Card>

            {/* Records table */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">Attendance Records</h2>
              </div>
              <Table columns={columns} data={records} emptyMessage="No attendance records found." />
            </Card>
          </>
        )}
      </main>
    </>
  );
}