import { create } from 'zustand';
import { authApi, type User } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (data) => {
    await authApi.login(data);
    const res: any = await authApi.me();
    set({ user: res.data.user, isAuthenticated: true });
  },
  signup: async (data) => {
    // Handling simple signup -> login flow assuming direct completion or login needed
    const res: any = await authApi.signup(data);

    // The backend returns { success: true, result: "<API_BASE_URL>/auth?mode=signup-complete&token=..." }
    let token = res.signupToken;
    if (res.result && typeof res.result === 'string') {
      const url = new URL(res.result);
      token = url.searchParams.get('token');
    }

    if (token) {
      // Backend schema requires token, email, password, and name
      await authApi.signupComplete({
        token,
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0] // Provide a default name
      });
    }
    await authApi.login({ email: data.email, password: data.password });
    const meRes: any = await authApi.me();
    set({ user: meRes.data.user, isAuthenticated: true });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res: any = await authApi.me();
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Listen for unauthorized events to clear state
window.addEventListener('auth:unauthorized', () => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});
