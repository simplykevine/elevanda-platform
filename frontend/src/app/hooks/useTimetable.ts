import { useState, useEffect } from 'react';
import { timetableService } from '../services/timetable.service';
import { TimetableEntry } from '../utils/types';
import { getDayOrder } from '../utils/format';
import toast from 'react-hot-toast';

export function useTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableService
      .getMyTimetable()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          const dayDiff = getDayOrder(a.day) - getDayOrder(b.day);
          if (dayDiff !== 0) return dayDiff;
          return a.start_time.localeCompare(b.start_time);
        });
        setEntries(sorted);
      })
      .catch(() => toast.error('Could not load timetable.'))
      .finally(() => setLoading(false));
  }, []);

  const days = [...new Set(entries.map((e) => e.day))];

  return { entries, days, loading };
}