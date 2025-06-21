import { useEffect } from 'react';
import { useSessionQuery } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Tanstack Query のセッション状態を Zustand ストアに同期させるためのコンポーネント
 * 無限ループを防ぐため、ユーザーIDを比較して本当に必要な時だけ状態を更新する
 */
export function AuthSyncer() {
  // サーバーからの認証状態を取得
  const { data: sessionData, isLoading } = useSessionQuery();

  // 状態を個別に取得することで、不要な再レンダリングと型エラーを回避する
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // ローディングが完了していることを確認
    if (!isLoading) {
      const serverUser = sessionData?.success && sessionData.authenticated ? sessionData.user : null;

      // 現在ストアにいるユーザーのIDと、サーバーから取得したユーザーのIDを比較する
      if (currentUser?.id !== serverUser?.id) {
        // IDが異なる場合のみ、Zustandストアの状態を更新する
        setUser(serverUser ?? null);
      }
    }
  }, [sessionData, isLoading, currentUser, setUser]);

  // このコンポーネントはUIを描画しない
  return null;
}