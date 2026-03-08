import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/format';

interface FeeBalanceCardProps {
  balance: string;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export default function FeeBalanceCard({ balance, onDeposit, onWithdraw }: FeeBalanceCardProps) {
  const numericBalance = parseFloat(balance);
  const isLow = numericBalance < 5000;

  return (
    <Card className="col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fee Balance</p>
          <p className={`mt-1 text-3xl font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
            {formatCurrency(balance)}
          </p>
          {isLow && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              Balance is low. Please make a payment soon.
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={onDeposit} size="sm">
            Pay Fees
          </Button>
          <Button onClick={onWithdraw} variant="secondary" size="sm">
            Request Refund
          </Button>
        </div>
      </div>
    </Card>
  );
}