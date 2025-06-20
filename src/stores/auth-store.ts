import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LoginCredentials, RegisterCredentials, User } from '@shared/types';
import { toast } from 'sonner';

// 既存のAPI関数をインポート（プロジェクトの実装に合わせて調整）
// import { signIn, signUp, signOut, getSession } from '@/lib/api';

interface AuthState {
  // 状態
  user: User | null;
  isLoading: boolean;
  
  // アクション
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({ 
      // 初期状態
      user: null,
      isLoading: true,
      
      // ログイン
      login: async (data: LoginCredentials) => {
        // 二重ログイン防止
        const currentState = get();
        if (currentState.isLoading) {
          console.log('Already logging in, skipping...');
          return;
        }

        try {
          set({ isLoading: true });
          
          // 既存のサインイン API を呼び出し
          const response = await fetch('/api/auth/sign-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'ログインに失敗しました');
          }

          const result = await response.json();
          set({ user: result.user, isLoading: false });
          // 成功通知
          toast.success('ログインしました');
        } catch (error) {
          set({ isLoading: false });
          throw error; // フォーム側でエラーハンドリング
        }
      },
      
      // 新規登録
      register: async (data: RegisterCredentials) => {
        try {
          set({ isLoading: true });
          
          const response = await fetch('/api/auth/sign-up', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '新規登録に失敗しました');
          }

          const result = await response.json();
          set({ user: result.user, isLoading: false });

          // 成功通知
          toast.success('アカウントを作成しました');
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      // ログアウト
      logout: async () => {
        try {
          set({ isLoading: true });
          
          await fetch('/api/auth/sign-out', {
            method: 'POST',
          });
          
          set({ user: null, isLoading: false });

          // 成功通知
          toast.success('ログアウトしました');
        } catch (error) {
          // ログアウトエラーでも状態はクリア
          set({ user: null, isLoading: false });
          console.error('ログアウトエラー:', error);
        }
      },
      
      // セッション確認
      checkSession: async () => {
        try {
          set({ isLoading: true });
          
          const response = await fetch('/api/auth/session', {
            method: 'GET',
          });

          if (response.ok) {
            const session = await response.json();
            set({ user: session?.user || null });
          } else {
            set({ user: null });
          }
        } catch (error) {
          console.error('セッション確認エラー:', error);
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // ユーザー情報クリア
      clearUser: () => set({ user: null }),
      
      // ローディング状態設定
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    { 
      name: 'auth-store',
      // Redux DevTools での表示名
    }
  )
);