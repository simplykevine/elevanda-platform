'use client';

import { useState } from 'react';
import Header from '@/app/SharedComponents/layout/components/Header';
import Card from '@/app/SharedComponents/ui/Card';
import Button from '@/app/SharedComponents/ui/Button';
import Badge from '@/app/SharedComponents/ui/Badge';
import Table from '@/app/SharedComponents/ui/Table';
import Modal from '@/app/SharedComponents/ui/Modal';
import Input from '@/app/SharedComponents/ui/Input';
import Spinner from '@/app/SharedComponents/ui/Spinner';
import { useFees } from '@/app/hooks/useFees';
import { FeeTransaction } from '@/app/utils/types';
import { formatCurrency, formatDateTime } from '@/app/utils/format';

function getStatusVariant(status: FeeTransaction['status']): 'success' | 'warning' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

export default function FeesPage() {
  const { account, loading, submitting, deposit, withdraw } = useFees();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [amountError, setAmountError] = useState('');

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

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (tx: FeeTransaction) => (
        <span className="capitalize font-medium">{tx.transaction_type}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: FeeTransaction) => (
        <span className={`font-semibold ${tx.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
          {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (tx: FeeTransaction) => <span className="text-slate-500">{tx.description || '—'}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (tx: FeeTransaction) => (
        <span className="font-mono text-xs text-slate-500">{tx.reference || '—'}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (tx: FeeTransaction) => formatDateTime(tx.created_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx: FeeTransaction) => (
        <Badge variant={getStatusVariant(tx.status)} className="capitalize">
          {tx.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <Header title="Fee Account" subtitle="View your balance and manage payments." />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !account ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-8">No fee account found. Contact your school administrator.</p>
          </Card>
        ) : (
          <>
            {/* Balance */}
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Current Balance</p>
                  <p className={`mt-1 text-4xl font-bold ${parseFloat(account.balance) < 5000 ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                  {parseFloat(account.balance) < 5000 && (
                    <p className="mt-1 text-sm text-red-600">Your balance is low.</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setDepositOpen(true)}>Pay Fees</Button>
                  <Button variant="secondary" onClick={() => setWithdrawOpen(true)}>Request Refund</Button>
                </div>
              </div>
            </Card>

            {/* Transactions */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">Transaction History</h2>
              </div>
              <Table
                columns={columns}
                data={account.recent_transactions}
                emptyMessage="No transactions on record."
              />
            </Card>
          </>
        )}
      </main>

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
            <Button onClick={handleDeposit} loading={submitting} className="flex-1">Confirm Payment</Button>
            <Button variant="secondary" onClick={() => { setDepositOpen(false); resetForm(); }} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

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
            <Button onClick={handleWithdraw} loading={submitting} variant="danger" className="flex-1">Submit Request</Button>
            <Button variant="secondary" onClick={() => { setWithdrawOpen(false); resetForm(); }} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}