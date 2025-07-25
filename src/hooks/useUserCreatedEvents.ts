// src/hooks/useUserCreatedEvents.ts
import { getUserCreatedEvents, queryKeys } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

/**
 * ユーザーのイベント作成履歴取得用フック
 * TanStack Query でイベント作成履歴データを管理
 */
export function useUserCreatedEvents(
  limit: number = 20,
  offset: number = 0
) {
  const user = useAuthStore((state) => state.user);
  
  return useQuery({
    queryKey: queryKeys.userCreatedEventsPaginated(limit, offset),
    queryFn: () => getUserCreatedEvents(limit, offset),
    enabled: !!user && !user.isAnonymous, // 正規ユーザーのみ取得
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    gcTime: 10 * 60 * 1000, // 10分間ガベージコレクション
    retry: (failureCount, error) => {
      // 認証エラーの場合はリトライしない
      if (error instanceof Error && error.message.includes('認証')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}


/**
 * イベント編集ページへのナビゲーション用フック
 * 作成履歴ページから編集ページへの遷移をスムーズに
 */
export function useEventEditNavigation() {
  const navigate = useNavigate();

  const navigateToEdit = (eventId: string) => {
    navigate(`/events/${eventId}/edit`);
  };

  return { navigateToEdit };
}