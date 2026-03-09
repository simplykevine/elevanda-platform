import api from './api';
import Cookies from 'js-cookie';
import { LoginPayload, RegisterPayload, AuthTokens, User } from '../utils/types';

export const authService = {
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const { data } = await api.post('/auth/register/', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<{ tokens: AuthTokens; user: User }> {
    const { data } = await api.post<{
      access: string;
      refresh: string;
      user: User;
    }>('/auth/login/', payload);

    return {
      tokens: {
        access: data.access,
        refresh: data.refresh,
      },
      user: data.user,
    };
  },

  async fetchMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me/');
    return data;
  },

  async logout(): Promise<void> {
    const refresh = Cookies.get('refresh_token');
    if (refresh) {
      await api.post('/auth/logout/', { refresh }).catch(() => {});
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  setTokens(tokens: AuthTokens): void {
    Cookies.set('access_token', tokens.access, { expires: 1 });
    Cookies.set('refresh_token', tokens.refresh, { expires: 7 });
  },

  clearTokens(): void {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  isLoggedIn(): boolean {
    return !!Cookies.get('access_token');
  },
};