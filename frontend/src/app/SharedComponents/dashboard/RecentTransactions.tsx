import { FeeTransaction } from '../../utils/types/';
import { formatCurrency, formatDate } from '../../utils/format';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

interface RecentTransactionsProps {
  transactions: FeeTransaction[];
}

function getStatusVariant(status: FeeTransaction['status']) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  return 'warning' as const;
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Recent Transactions</h3>
      </div>
      {transactions.length === 0 ? (
        <p className="px-6 py-8 text-sm text-center text-slate-400">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {tx.transaction_type}
                </p>
                <p className="text-xs text-slate-500">{tx.description || 'No description'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(tx.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <p className={`text-sm font-semibold ${tx.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <Badge variant={getStatusVariant(tx.status)} className="capitalize">
                  {tx.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}