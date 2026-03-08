'use client';

import { useState } from 'react';
import { CreditCard, BookOpen, CheckSquare, Calendar } from 'lucide-react';
import Header from '../SharedComponents/layout/components/Header';
import StatCard from '../SharedComponents/dashboard/StatCard';
import FeeBalanceCard from '../SharedComponents/dashboard/FeeBalanceCard';
import RecentTransactions from '../SharedComponents/dashboard/RecentTransactions';
import AlertBanner from '../SharedComponents/dashboard/AlertBanner';
import Modal from '../SharedComponents/ui/Modal';
import Input from '../SharedComponents/ui/Input';
import Button from '../SharedComponents/ui/Button';
import Spinner from '../SharedComponents/ui/Spinner';
import { useFees } from '../hooks/useFees';
import { useGrades } from '../hooks/useGrades';
import { useAttendance } from '../hooks/useAttendance';
import { useTimetable } from '../hooks/useTimetable';
import { formatCurrency } from '../utils/format';
import { useAuthStore } from '../store/auth.store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { account, loading: feesLoading, submitting, deposit, withdraw } = useFees();
  const { grades, loading: gradesLoading } = useGrades();
  const { attendanceRate, loading: attendanceLoading } = useAttendance();
  const { entries, loading: timetableLoading } = useTimetable();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [amountError, setAmountError] = useState('');

  const balance = parseFloat(account?.balance ?? '0');
  const isLowBalance = balance < 5000;

  const avgGrade = grades.length > 0
    ? Math.round(grades.reduce((a, g) => a + g.percentage, 0) / grades.length)
    : null;

  const resetForm = () => { setAmount(''); setDescription(''); setAmountError(''); };

  const handleDeposit = async () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setAmountError('Enter a valid amount.'); return; }
    await deposit(num, description);
    setDepositOpen(false);
    resetForm();
  };

  const handleWithdraw = async () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setAmountError('Enter a valid amount.'); return; }
    await withdraw(num, description);
    setWithdrawOpen(false);
    resetForm();
  };

  return (
    <>
      <Header
        title={`Good morning, ${user?.first_name}`}
        subtitle="Here's what's happening today."
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Alerts */}
        {!user?.is_verified && (
          <AlertBanner
            message="Your device is pending verification by an administrator. Some features may be restricted until approved."
            type="warning"
          />
        )}
        {isLowBalance && account && (
          <AlertBanner
            message={`Your fee balance is low (${formatCurrency(account.balance)}). Please make a payment to avoid disruptions.`}
            type="warning"
          />
        )}

        {/* Fee balance + stats */}
        {feesLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {account && (
              <FeeBalanceCard
                balance={account.balance}
                onDeposit={() => setDepositOpen(true)}
                onWithdraw={() => setWithdrawOpen(true)}
              />
            )}
            <StatCard
              title="Attendance Rate"
              value={attendanceLoading ? '...' : `${attendanceRate}%`}
              icon={CheckSquare}
              description="This term"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Average Grade"
              value={gradesLoading ? '...' : avgGrade != null ? `${avgGrade}%` : 'N/A'}
              icon={BookOpen}
              description="All subjects"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Classes Scheduled"
              value={timetableLoading ? '...' : entries.length}
              icon={Calendar}
              description="On timetable"
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* Recent transactions */}
        {account && (
          <div className="max-w-2xl">
            <RecentTransactions transactions={account.recent_transactions} />
          </div>
        )}
      </main>

      {/* Deposit Modal */}
      <Modal
        open={depositOpen}
        onClose={() => { setDepositOpen(false); resetForm(); }}
        title="Pay Fees"
      >
        <div className="space-y-4">
          <Input
            label="Amount (KES)"
            type="number"
            placeholder="e.g. 10000"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
            error={amountError}
          />
          <Input
            label="Description (optional)"
            placeholder="e.g. Term 2 fees"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleDeposit} loading={submitting} className="flex-1">
              Confirm Payment
            </Button>
            <Button variant="secondary" onClick={() => { setDepositOpen(false); resetForm(); }} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={withdrawOpen}
        onClose={() => { setWithdrawOpen(false); resetForm(); }}
        title="Request Refund"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Current balance: <span className="font-semibold text-slate-900">{formatCurrency(account?.balance ?? '0')}</span>
          </p>
          <Input
            label="Amount (KES)"
            type="number"
            placeholder="e.g. 2000"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
            error={amountError}
          />
          <Input
            label="Reason (optional)"
            placeholder="e.g. Overpayment"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleWithdraw} loading={submitting} variant="danger" className="flex-1">
              Submit Request
            </Button>
            <Button variant="secondary" onClick={() => { setWithdrawOpen(false); resetForm(); }} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}