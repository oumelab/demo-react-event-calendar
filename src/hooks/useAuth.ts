// src/hooks/useAuth.ts (Better Auth版)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import type { LoginCredentials, RegisterCredentials } from '@shared/types';
import type { UserWithAnonymous } from 'better-auth/plugins';

// TanStack Query用のキー定義
export const authQueryKeys = {
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,
} as const;

// セッション取得Query
export function useSessionQuery() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5分間
    gcTime: 10 * 60 * 1000, // 10分間
    retry: false,
  });
}

// 認証Mutations
export function useAuthMutations() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  // ログインMutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data, error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        // 🔧 isAnonymous は Better Auth の user には含まれていない
        setUser({
          ...data.user,
          image: data.user.image ?? undefined, // null → undefined 変換
        } as UserWithAnonymous);
        queryClient.setQueryData(authQueryKeys.session, data);
      }
      toast.success('ログインしました');
    },
    // onError削除 - エラー時はtoast表示しない
  });

  // 新規登録Mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const { data, error } = await authClient.signUp.email({
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        // 🔧 isAnonymous は Better Auth の user には含まれていない
        setUser({
          ...data.user,
          image: data.user.image ?? undefined, // null → undefined 変換
        } as UserWithAnonymous);
        queryClient.setQueryData(authQueryKeys.session, data);
      }
      toast.success('アカウントを作成しました');
    },
    // onError削除 - エラー時はtoast表示しない
  });

  // ログアウトMutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(authQueryKeys.session, null);
      queryClient.removeQueries({ queryKey: authQueryKeys.session });
      queryClient.clear();
      toast.success('ログアウトしました');
    },
    // onError削除 - エラー時はtoast表示しない
  });

  // 🆕 匿名ログインMutation
  const anonymousLoginMutation = useMutation({
    mutationFn: async () => {
      queryClient.clear();

      const { data, error } = await authClient.signIn.anonymous();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        // 🎯 匿名ログイン時のみ isAnonymous を true に、image フィールドが存在しない
        setUser({
          ...data.user,
          image: undefined,
          isAnonymous: true // 匿名ログインなので true
        } as UserWithAnonymous);
        queryClient.setQueryData(authQueryKeys.session, data);
      }
      toast.success('ゲストとしてログインしました');
    },
    // onError削除 - エラー時はtoast表示しない、呼び出し元でハンドリング
  });

  return {
    // 関数
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    anonymousLogin: anonymousLoginMutation.mutateAsync, // 🆕 匿名ログイン追加
    
    // ローディング状態
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isAnonymousLogging: anonymousLoginMutation.isPending, // 🆕 匿名ログインローディング状態
  };
}