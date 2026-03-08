import api from './api';
import Cookies from 'js-cookie';
import { LoginPayload, RegisterPayload, AuthTokens, User } from '../utils/types';

export const authService = {
  /**
   * Register a new user.
   * The caller (useAuth) is responsible for SHA-512 hashing the password
   * before passing it in the payload.
   */
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const { data } = await api.post('/auth/register/', payload);
    return data;
  },

  /**
   * Log in a user.
   *
   * The backend returns:
   *   { access: string, refresh: string, user: User }
   *
   * We remap that to the shape the rest of the app expects:
   *   { tokens: { access, refresh }, user }
   *
   * This keeps the mismatch isolated here rather than scattered
   * across every call-site.
   */
  async login(payload: LoginPayload): Promise<{ tokens: AuthTokens; user: User }> {
    const { data } = await api.post<{
      access: string;
      refresh: string;
      user: User;
    }>('/auth/login/', payload);

    return {
      tokens: {
        access:  data.access,
        refresh: data.refresh,
      },
      user: data.user,
    };
  },

  /** Blacklist the refresh token on the server, then clear local cookies. */
  async logout(): Promise<void> {
    const refresh = Cookies.get('refresh_token');
    if (refresh) {
      // Fire-and-forget — don't let a network error block the local logout
      await api.post('/auth/logout/', { refresh }).catch(() => {});
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  /** Persist both JWT tokens in cookies. */
  setTokens(tokens: AuthTokens): void {
    Cookies.set('access_token',  tokens.access,  { expires: 1 }); // 1 day
    Cookies.set('refresh_token', tokens.refresh, { expires: 7 }); // 7 days
  },

  clearTokens(): void {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  isLoggedIn(): boolean {
    return !!Cookies.get('access_token');
  },
};