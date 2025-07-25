// src/hooks/useEvents.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createEvent, updateEvent, deleteEvent, queryKeys } from '@/lib/api';
import type { CreateEventRequest, UpdateEventRequest } from '@shared/types';

/**
 * イベント作成・編集・削除のMutationをまとめたフック
 * 
 * UX配慮:
 * - 成功時: toast通知 + 自動リダイレクト
 * - 失敗時: エラーをthrowしてフォーム側でハンドリング（認証フォームパターン）
 */
export function useEventMutations() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // イベント作成
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventRequest) => createEvent(eventData),
    onSuccess: (data) => {
      if (!data.success) {
        // サーバーエラーはthrowしてフォーム側でキャッチ
        throw new Error(data.message || 'イベントの作成に失敗しました');
      }
      
      // ✅ 成功時のみtoast通知
      toast.success('イベントを作成しました');
      
      // イベント一覧・作成履歴のキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCreatedEvents });
      
      // 作成したイベントの詳細ページにリダイレクト
      if (data.eventId) {
        navigate(`/events/${data.eventId}`, { replace: true });
      } else {
        navigate('/events', { replace: true });
      }
    },
    onError: (error) => {
      console.error('Event creation error:', error);
      // エラーはフォーム側でform.setError()でハンドリング
    }
  });

  // イベント更新
  const updateEventMutation = useMutation({
    mutationFn: ({ id, eventData }: { id: string; eventData: UpdateEventRequest }) => 
      updateEvent(id, eventData),
    onSuccess: (data, variables) => {
      if (!data.success) {
        throw new Error(data.message || 'イベントの更新に失敗しました');
      }
      
      // ✅ 成功時のみtoast通知
      toast.success('イベントを更新しました');
      
      // イベント一覧と個別イベント、作成履歴のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCreatedEvents });
      
      // 更新したイベントの詳細ページにリダイレクト
      navigate(`/events/${variables.id}`, { replace: true });
    },
    onError: (error) => {
      console.error('Event update error:', error);
    }
  });

  // イベント削除
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: (data, eventId) => {
      if (!data.success) {
        throw new Error(data.message || 'イベントの削除に失敗しました');
      }
      
      // ✅ 成功時のみtoast通知
      toast.success('イベントを削除しました');
      
      // イベント一覧と個別イベント、作成履歴のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.userCreatedEvents });
      queryClient.removeQueries({ queryKey: queryKeys.event(eventId) });
      
      // イベント一覧ページにリダイレクト
      navigate('/events', { replace: true });
    },
    onError: (error) => {
      console.error('Event delete error:', error);
    }
  });

  return {
    // 作成
    createEvent: createEventMutation.mutateAsync,
    isCreating: createEventMutation.isPending,
    
    // 更新  
    updateEvent: updateEventMutation.mutateAsync,
    isUpdating: updateEventMutation.isPending,
    
    // 削除
    deleteEvent: deleteEventMutation.mutateAsync,
    isDeleting: deleteEventMutation.isPending,
    
    // 全体のローディング状態
    isLoading: createEventMutation.isPending || updateEventMutation.isPending || deleteEventMutation.isPending,
  };
}

/**
 * イベント削除確認用のヘルパー関数
 * 削除は確認ダイアログからの実行なので、エラー時もtoast表示で良い
 */
export function useEventDelete() {
  const { deleteEvent, isDeleting } = useEventMutations();

  const confirmAndDelete = async (eventId: string, eventTitle: string) => {
    const confirmed = window.confirm(
      `「${eventTitle}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`
    );
    
    if (confirmed) {
      try {
        await deleteEvent(eventId);
      } catch (error) {
        // 削除確認ダイアログからの実行時はtoast表示が適切
        const message = error instanceof Error ? error.message : 'イベントの削除に失敗しました';
        toast.error(message);
      }
    }
  };

  return {
    confirmAndDelete,
    isDeleting,
  };
}