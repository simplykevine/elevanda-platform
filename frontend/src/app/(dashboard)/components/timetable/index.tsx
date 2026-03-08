'use client';

import Header from '@/app/SharedComponents/layout/components/Header';
import Card from '@/app/SharedComponents/ui/Card';
import Spinner from '@/app/SharedComponents/ui/Spinner';
import { useTimetable } from '@/app/hooks/useTimetable';
import { TimetableEntry } from '@/app/utils/types';
import { formatTime } from '@/app/utils/format';

export default function TimetablePage() {
  const { entries, days, loading } = useTimetable();

  return (
    <>
      <Header title="Timetable" subtitle="Your weekly class schedule." />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : days.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-slate-500">No timetable entries found.</p>
          </Card>
        ) : (
          days.map((day) => {
            const dayEntries = entries.filter((e) => e.day === day);
            return (
              <Card key={day} padding="none">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-900">{day}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {dayEntries.map((entry: TimetableEntry) => (
                    <div key={entry.id} className="flex items-center gap-6 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-28 flex-shrink-0 text-sm text-slate-500 font-medium">
                        {formatTime(entry.start_time)} — {formatTime(entry.end_time)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{entry.subject_name}</p>
                        <p className="text-xs text-slate-500">{entry.teacher_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-slate-700">{entry.class_name}</p>
                        {entry.room && (
                          <p className="text-xs text-slate-400">Room {entry.room}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </main>
    </>
  );
}