// src/hooks/useEventRegistration.ts - イベント申し込み・キャンセル用カスタムフック

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { 
  applyToEvent, 
  cancelEventRegistration, 
  getUserRegistrations,
  queryKeys 
} from '@/lib/api';
import type { 
  EventWithAttendees,
  User 
} from '@shared/types';

// ========== イベント申し込み・キャンセル用Mutation ==========

/**
 * イベント申し込み用Mutation
 * 成功時は /events/{id}/confirm へ自動遷移
 * エラー時はthrowして呼び出し元でハンドリング
 */
export function useEventApply() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (eventId: string) => applyToEvent(eventId),
    onSuccess: (_, eventId: string) => {
      // 関連するクエリのキャッシュを無効化してリフレッシュ
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userRegistrations });
      
      // 楽観的更新のためにイベント申し込み状況もクリア
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.eventRegistrationStatus(eventId) 
      });

      // 🆕 申し込み完了ページへ自動遷移
      navigate(`/events/${eventId}/confirm`, {
        state: { fromApplication: true }, // 正当な申し込み経由であることを示すフラグ
        replace: true,
      });
    },
    onError: (error: Error) => {
      // エラーをそのままthrowして呼び出し元でハンドリング
      throw error;
    },
  });
}

/**
 * イベントキャンセル用Mutation
 * 成功時は /events/{id}/cancel-complete へ自動遷移
 * エラー時はthrowして呼び出し元でハンドリング
 */
export function useEventCancel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (eventId: string) => cancelEventRegistration(eventId),
    onSuccess: (_, eventId: string) => {
      // 関連するクエリのキャッシュを無効化してリフレッシュ
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userRegistrations });
      
      // 楽観的更新のためにイベント申し込み状況もクリア
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.eventRegistrationStatus(eventId) 
      });

      // 🆕 キャンセル完了ページへ自動遷移
      navigate(`/events/${eventId}/cancel-complete`, {
        state: { 
          fromCancellation: true
        },
        replace: true,
      });
    },
    onError: (error: Error) => {
      // エラーをそのままthrowして呼び出し元でハンドリング
      throw error;
    },
  });
}

// ========== ユーザー申し込み履歴用Query ==========

/**
 * ユーザーの申し込み履歴取得用Query
 * ページネーション対応
 */
export function useUserRegistrations(limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.userRegistrationsPaginated(limit, offset),
    queryFn: () => getUserRegistrations(limit, offset),
    staleTime: 1000 * 60 * 5, // 5分間はキャッシュを使用
    gcTime: 1000 * 60 * 30,   // 30分間メモリに保持（旧cacheTime）
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
 * 基本的な申し込み履歴取得（ページネーションなし）
 * シンプルな用途向け
 */
export function useUserRegistrationsSimple() {
  return useUserRegistrations(50, 0); // 最大50件を取得
}

// ========== 複合フック（申し込み状況判定用） ==========

/**
 * イベントの申し込み状況を判定するフック
 * イベント詳細ページで使用して、申し込みボタンの表示制御を行う
 */
export function useEventRegistrationStatus(
  eventId: string, 
  event?: EventWithAttendees, 
  user?: User | null
) {
  const { data: userRegistrations } = useUserRegistrationsSimple();
  
  // 認証状態チェック
  const isAuthenticated = !!user;
  
  // 申し込み済みかチェック
  const userRegistration = userRegistrations?.registrations.find(
    reg => reg.event.id === eventId
  );
  const isRegistered = !!userRegistration;
  
  // 定員チェック
  const isFull = event?.capacity 
    ? event.attendees >= event.capacity 
    : false;
  
  // 開催日時チェック（開始前かどうか）
  const canRegisterByTime = event?.date 
    ? isEventNotStarted(event.date) 
    : true;
  
  // 申し込み可能かどうかの総合判定
  const canRegister = isAuthenticated && 
                     !isRegistered && 
                     !isFull && 
                     canRegisterByTime;
  
  // キャンセル可能かどうか
  const canCancel = isAuthenticated && 
                   isRegistered && 
                   canRegisterByTime &&
                   (userRegistration?.can_cancel ?? true);
  
  // 申し込み不可の理由を特定
  let reason: string | undefined;
  if (!isAuthenticated) {
    reason = '認証が必要です';
  } else if (isRegistered) {
    reason = '申し込み済みです';
  } else if (isFull) {
    reason = '定員に達しています';
  } else if (!canRegisterByTime) {
    reason = 'イベント開始後のため申し込み不可';
  }

  return {
    // 基本状態
    isAuthenticated,
    isRegistered,
    isFull,
    canRegister,
    canCancel,
    canRegisterByTime,
    reason,
    
    // 申し込み情報
    registrationId: userRegistration?.id,
    registeredAt: userRegistration?.registered_at,
    
    // ローディング状態
    isLoading: !userRegistrations && isAuthenticated,
  };
}

// ========== ユーティリティ関数 ==========

/**
 * 日本語形式の日時文字列をチェックしてイベント開始前かどうかを判定
 * @param dateTimeStr "2025年9月6日20:00" 形式の文字列
 * @returns boolean イベント開始前なら true
 */
function isEventNotStarted(dateTimeStr: string): boolean {
  try {
    // "2025年9月6日20:00" 形式をパース
    const match = dateTimeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/);
    
    if (!match) {
      // パースできない場合は安全側に倒して申し込み可能とする
      console.warn('Date format not recognized:', dateTimeStr);
      return true;
    }
    
    const [, year, month, day, hours, minutes] = match;
    
    // 日本時間でDateオブジェクト作成
    const eventDate = new Date();
    eventDate.setFullYear(parseInt(year, 10));
    eventDate.setMonth(parseInt(month, 10) - 1); // 月は0ベース
    eventDate.setDate(parseInt(day, 10));
    eventDate.setHours(parseInt(hours, 10));
    eventDate.setMinutes(parseInt(minutes, 10));
    eventDate.setSeconds(0);
    eventDate.setMilliseconds(0);
    
    const now = new Date();
    return eventDate > now;
  } catch (error) {
    // エラーの場合は安全側に倒して申し込み可能とする
    console.warn('Date parsing error:', error);
    return true;
  }
}

// ========== 高度な操作用フック ==========

/**
 * 申し込み・キャンセルの複合操作フック
 * 申し込み済みの場合はキャンセル、未申し込みの場合は申し込みを実行
 * エラーは呼び出し元でハンドリング
 */
export function useEventRegistrationToggle() {
  const applyMutation = useEventApply();
  const cancelMutation = useEventCancel();

  const toggleRegistration = async (eventId: string, isRegistered: boolean) => {
    if (isRegistered) {
      return await cancelMutation.mutateAsync(eventId);
    } else {
      return await applyMutation.mutateAsync(eventId);
    }
  };

  return {
    toggleRegistration,
    isLoading: applyMutation.isPending || cancelMutation.isPending,
    error: applyMutation.error || cancelMutation.error,
  };
}