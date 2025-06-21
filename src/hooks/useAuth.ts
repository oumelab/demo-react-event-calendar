import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { signIn, signUp, signOut, getSession, queryKeys } from '@/lib/api';
import type { LoginCredentials, RegisterCredentials } from '@shared/types';

/**
 * セッション情報を取得するためのQueryフック
 */
export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    retry: false, // 認証失敗時にリトライはしない
    refetchOnWindowFocus: true, // ウィンドウにフォーカスが戻った時にセッションを再確認
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを新鮮なものとして扱う
  });
}

/**
 * ログイン、新規登録、ログアウトのMutationをまとめたフック
 */
export function useAuthMutations() {
  const queryClient = useQueryClient();

  // 認証状態が変化した時にセッション情報を再取得する共通処理
  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.session });
  };

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => signIn(credentials),
    onSuccess: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'ログインに失敗しました');
      }
      toast.success('ログインしました');
      invalidateSession();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => signUp(credentials),
    onSuccess: (data) => {
      if (!data.success) {
        throw new Error(data.error || '新規登録に失敗しました');
      }
      toast.success('アカウントを作成しました');
      invalidateSession();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      toast.success('ログアウトしました');
      // ログアウト時はキャッシュを即座にクリアして未認証状態にする
      queryClient.setQueryData(queryKeys.session, { success: true, authenticated: false });
      invalidateSession();
    },
  });

  return {
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}