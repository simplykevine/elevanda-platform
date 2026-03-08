import { useState, useEffect, useCallback } from 'react';
import { feesService } from '../services/fees.service';
import { FeeAccount } from '../utils/types';
import toast from 'react-hot-toast';

export function useFees() {
  const [account, setAccount] = useState<FeeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feesService.getMyAccount();
      setAccount(data);
    } catch {
      toast.error('Could not load fee account.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const deposit = useCallback(
    async (amount: number, description?: string) => {
      if (!account) return;
      try {
        setSubmitting(true);
        const result = await feesService.deposit(account.id, amount, description);
        toast.success('Payment recorded successfully.');
        await fetchAccount();
        return result;
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Payment failed.';
        toast.error(msg);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [account, fetchAccount]
  );

  const withdraw = useCallback(
    async (amount: number, description?: string) => {
      if (!account) return;
      try {
        setSubmitting(true);
        const result = await feesService.withdraw(account.id, amount, description);
        toast.success('Refund request submitted.');
        await fetchAccount();
        return result;
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Refund failed.';
        toast.error(msg);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [account, fetchAccount]
  );

  return { account, loading, submitting, deposit, withdraw, refetch: fetchAccount };
}