import { useState, useEffect } from 'react';
import { gradesService } from '../services/grades.service';
import { Grade } from '../utils/types';
import toast from 'react-hot-toast';

export function useGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradesService
      .getMyGrades()
      .then((data) => setGrades(Array.isArray(data) ? data : []))
      .catch(() => {
        toast.error('Could not load grades.');
        setGrades([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { grades, loading };
}