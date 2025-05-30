import type { AuthContextType, LoginCredentials, RegisterCredentials, Session, User } from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useEffect, useState } from 'react';
import { getSession, queryKeys, signIn, signOut, signUp } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context をエクスポート
export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // セッション確認クエリ
  const {
    data: sessionData,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    retry: false, // 認証エラーの場合はリトライしない
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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

  // ログインミューテーション
  const loginMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
        setSession(data.session || null);
        // セッションクエリを無効化して再フェッチ
        queryClient.invalidateQueries({ queryKey: queryKeys.session });
      } else {
        throw new Error(data.error || 'ログインに失敗しました');
      }
    },
  });

  // 新規登録ミューテーション
  const registerMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      if (data.success && data.authenticated && data.user) {
        setUser(data.user);
        setSession(data.session || null);
        // セッションクエリを無効化して再フェッチ
        queryClient.invalidateQueries({ queryKey: queryKeys.session });
      } else {
        throw new Error(data.error || 'アカウント作成に失敗しました');
      }
    },
  });

  // ログアウトミューテーション
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      setUser(null);
      setSession(null);
      // 全てのクエリキャッシュをクリア
      queryClient.clear();
    },
    onError: () => {
      // エラーが発生してもログアウト状態にする
      setUser(null);
      setSession(null);
      queryClient.clear();
    },
  });

  const isAuthenticated = Boolean(user && sessionData?.authenticated);

  // ラップされた関数
  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  const register = async (credentials: RegisterCredentials) => {
    return registerMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const refreshUser = async () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.session });
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth フックを別ファイルに分離するため、ここでは削除