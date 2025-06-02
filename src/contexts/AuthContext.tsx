import type { AuthContextType, LoginCredentials, RegisterCredentials, Session, User } from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { getSession, queryKeys, signIn, signOut, signUp } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // セッション確認クエリ（キャッシュ設定を改善）
  const {
    data: sessionData,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    // 🆕 追加: キャッシュ設定の改善
    staleTime: 30 * 60 * 1000,    // 30分
    gcTime: 60 * 60 * 1000,       // 1時間
  });

  // セッションデータが更新されたら状態を同期
  useEffect(() => {
    if (sessionData?.success && sessionData.authenticated && sessionData.user) {
      setUser(sessionData.user);
      setSession(sessionData.session || null);
    } else {
      setUser(null);
      setSession(null);
    }
  }, [sessionData]);

  // ログインミューテーション（キャッシュ更新方法を改善）
  const loginMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
        setSession(data.session || null);
        // 🆕 改善: invalidateQueries の代わりに setQueryData を使用
        queryClient.setQueryData(queryKeys.session, data);
      } else {
        throw new Error(data.error || 'ログインに失敗しました');
      }
    },
  });

  // 新規登録ミューテーション（同様に改善）
  const registerMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
        setSession(data.session || null);
        // 🆕 改善: invalidateQueries の代わりに setQueryData を使用
        queryClient.setQueryData(queryKeys.session, data);
      } else {
        throw new Error(data.error || 'アカウント作成に失敗しました');
      }
    },
  });

  // ログアウトミューテーション（変更なし）
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      setUser(null);
      setSession(null);
      queryClient.clear();
    },
    onError: () => {
      setUser(null);
      setSession(null);
      queryClient.clear();
    },
  });

  // 🆕 改善: isAuthenticated の計算をuseMemoで最適化
  const isAuthenticated = useMemo(() => {
    return Boolean(user && sessionData?.authenticated);
  }, [user, sessionData?.authenticated]);

  // 🆕 改善: 関数をuseCallbackでメモ化（パフォーマンス向上）
  const login = useCallback(async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    return registerMutation.mutateAsync(credentials);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshUser = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.session });
  }, [queryClient]);

  // 🆕 改善: value オブジェクトもuseMemoで最適化
  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login,
    register,
    logout,
    refreshUser,
  }), [
    user,
    session,
    isAuthenticated,
    isLoading,
    loginMutation.isPending,
    registerMutation.isPending,
    login,
    register,
    logout,
    refreshUser,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}