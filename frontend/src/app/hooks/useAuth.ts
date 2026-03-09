import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { RegisterPayload } from '../utils/types';
import { getDeviceId } from '../utils/deviceId';
import toast from 'react-hot-toast';
import { hashPassword } from '@/app/utils/hashPassword';

export function useAuth() {
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const device_id = getDeviceId();
      const hashed = await hashPassword(password);
      const { tokens, user: userData } = await authService.login({ email, password: hashed, device_id });
      authService.setTokens(tokens);
      setUser(userData);
      router.push('/dashboard');
    },
    [router, setUser]
  );

  const register = useCallback(
    async (payload: Omit<RegisterPayload, 'device_id'>) => {
      const device_id = getDeviceId();
      const hashed = await hashPassword(payload.password);
      await authService.register({ ...payload, password: hashed, device_id });
      toast.success('Account created. Please wait for admin device verification before logging in.');
      router.push('/login');
    },
    [router]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    clearUser();
    router.push('/login');
  }, [router, clearUser]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.fetchMe();
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, [setUser]);

  return { user, login, register, logout, refreshUser, isAuthenticated: !!user };
}