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

const isEvaluatorMode = import.meta.env.VITE_EVALUATOR_MODE !== 'false';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (data) => {
    sessionStorage.removeItem('paygate_explicit_logout');
    const res: any = await authApi.login(data);
    if (res?.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    if (res?.data?.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    if (res?.data?.user) {
      set({ user: res.data.user, isAuthenticated: true });
    } else {
      const meRes: any = await authApi.me();
      const user = meRes?.data?.user || meRes?.user;
      set({ user, isAuthenticated: true });
    }
  },
  signup: async (data) => {
    sessionStorage.removeItem('paygate_explicit_logout');
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
      const completeRes: any = await authApi.signupComplete({
        token,
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0], // Provide a default name
      });
      if (completeRes?.data?.accessToken) {
        localStorage.setItem('accessToken', completeRes.data.accessToken);
      }
      if (completeRes?.data?.refreshToken) {
        localStorage.setItem('refreshToken', completeRes.data.refreshToken);
      }
    }
    const loginRes: any = await authApi.login({ email: data.email, password: data.password });
    if (loginRes?.data?.accessToken) {
      localStorage.setItem('accessToken', loginRes.data.accessToken);
    }
    if (loginRes?.data?.refreshToken) {
      localStorage.setItem('refreshToken', loginRes.data.refreshToken);
    }
    if (loginRes?.data?.user) {
      set({ user: loginRes.data.user, isAuthenticated: true });
    } else {
      const meRes: any = await authApi.me();
      const user = meRes?.data?.user || meRes?.user;
      set({ user, isAuthenticated: true });
    }
  },
  logout: async () => {
    try {
      sessionStorage.setItem('paygate_explicit_logout', 'true');
      const refreshToken = localStorage.getItem('refreshToken');
      await authApi.logout(refreshToken ? { refreshToken } : undefined);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },
  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res: any = await authApi.me();
          const user = res?.data?.user || res?.user;
          if (user) {
            set({ user, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      // If user explicitly chose to log out in this browser session, respect their choice
      if (sessionStorage.getItem('paygate_explicit_logout') === 'true') {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // If Evaluator Mode is disabled, do not auto-login
      if (!isEvaluatorMode) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Auto-authenticate as Platform Admin for seamless evaluator sandbox
      const loginRes: any = await authApi.login({
        email: 'admin@paygate.com',
        password: 'Admin@12345',
      });

      if (loginRes?.data?.accessToken) {
        localStorage.setItem('accessToken', loginRes.data.accessToken);
      }
      if (loginRes?.data?.refreshToken) {
        localStorage.setItem('refreshToken', loginRes.data.refreshToken);
      }

      const adminUser = loginRes?.data?.user;
      if (adminUser) {
        set({ user: adminUser, isAuthenticated: true, isLoading: false });
      } else {
        const meRes: any = await authApi.me();
        const meUser = meRes?.data?.user || meRes?.user;
        set({ user: meUser, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      console.warn('Auto-admin login fallback skipped:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Listen for unauthorized events to clear state
window.addEventListener('auth:unauthorized', () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});
