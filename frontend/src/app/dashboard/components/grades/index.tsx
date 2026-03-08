'use client';

import Header from '@/app/SharedComponents/layout/components/Header';
import Card from '@/app/SharedComponents/ui/Card';
import Badge from '@/app/SharedComponents/ui/Badge';
import Table from '@/app/SharedComponents/ui/Table';
import Spinner from '@/app/SharedComponents/ui/Spinner';
import { useGrades } from '@/app/hooks/useGrades';
import { Grade } from '@/app/utils/types';
import { formatDate, getGradeLetter, getGradeColor } from '@/app/utils/format';

export default function GradesPage() {
  const { grades, loading } = useGrades();

  const avg = grades.length > 0
    ? (grades.reduce((a, g) => a + g.percentage, 0) / grades.length).toFixed(1)
    : null;

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (g: Grade) => <span className="font-medium text-slate-900">{g.subject_name}</span>,
    },
    {
      key: 'score',
      header: 'Score',
      render: (g: Grade) => `${g.score} / ${g.max_score}`,
    },
    {
      key: 'percentage',
      header: 'Percentage',
      render: (g: Grade) => (
        <span className={`font-semibold ${getGradeColor(g.percentage)}`}>
          {g.percentage.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (g: Grade) => (
        <span className={`font-bold text-base ${getGradeColor(g.percentage)}`}>
          {getGradeLetter(g.percentage)}
        </span>
      ),
    },
    {
      key: 'term',
      header: 'Term',
      render: (g: Grade) => <Badge>{g.term}</Badge>,
    },
    {
      key: 'exam_type',
      header: 'Exam Type',
      render: (g: Grade) => <span className="capitalize text-slate-500">{g.exam_type}</span>,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (g: Grade) => g.teacher_name,
    },
    {
      key: 'date',
      header: 'Date',
      render: (g: Grade) => formatDate(g.recorded_at),
    },
  ];

  return (
    <>
      <Header title="Academic Grades" subtitle="View your grades and performance by subject." />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            {avg != null && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Overall Average</p>
                  <p className={`mt-1 text-3xl font-bold ${getGradeColor(parseFloat(avg))}`}>{avg}%</p>
                  <p className="mt-1 text-sm text-slate-500">Grade: {getGradeLetter(parseFloat(avg))}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Total Subjects</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{new Set(grades.map((g) => g.subject_name)).size}</p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Highest Score</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-600">
                    {Math.max(...grades.map((g) => g.percentage)).toFixed(1)}%
                  </p>
                </Card>
                <Card>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Lowest Score</p>
                  <p className="mt-1 text-3xl font-bold text-red-600">
                    {Math.min(...grades.map((g) => g.percentage)).toFixed(1)}%
                  </p>
                </Card>
              </div>
            )}

            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">All Grades</h2>
              </div>
              <Table columns={columns} data={grades} emptyMessage="No grades have been recorded yet." />
            </Card>
          </>
        )}
      </main>
    </>
  );
}