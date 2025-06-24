// src/pages/EventEditPage.tsx
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router';
import { EventForm } from '@/components/events/EventForm';
import { useEventMutations, useEventDelete } from '@/hooks/useEvents';
import { getEventById, queryKeys } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import type { UpdateEventRequest } from '@shared/types';
import Card from '@/components/card';

export default function EventEditPage() {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const { updateEvent, isUpdating } = useEventMutations();
  const { confirmAndDelete, isDeleting } = useEventDelete();

  // イベントデータを取得
  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.event(id as string),
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

  // ローディング状態
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center py-10">イベント情報を読み込み中...</div>
      </div>
    );
  }

  // エラー状態
  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="w-fit mx-auto py-24 space-y-8 text-center">
          <h3 className="text-lg font-bold text-red-600">
            {error instanceof Error && error.message === "Event not found"
              ? "URLのイベントが見つかりません"
              : `エラーが発生しました: ${
                  error instanceof Error ? error.message : String(error)
                }`}
          </h3>
          <Link to="/events" className="text-sky-600 hover:text-sky-700 underline">
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  // 権限チェック：作成者でない場合はアクセス拒否
  if (user?.id !== event.creator_id) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="w-fit mx-auto py-24 space-y-8 text-center">
          <h3 className="text-lg font-bold text-red-600">
            このイベントを編集する権限がありません
          </h3>
          <Link 
            to={`/events/${id}`} 
            className="text-sky-600 hover:text-sky-700 underline"
          >
            イベント詳細に戻る
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: UpdateEventRequest) => {
    await updateEvent({ id: id as string, eventData: data });
  };

  const handleDelete = () => {
    confirmAndDelete(event.id, event.title);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              イベントを編集
            </h1>
            <p className="text-gray-600">
              「{event.title}」の詳細情報を編集してください。
            </p>
          </div>
          
          {/* 削除ボタン */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="ml-4"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                削除中...
              </>
            ) : (
              'イベントを削除'
            )}
          </Button>
        </div>

        {/* ナビゲーション */}
        <nav className="text-sm text-gray-500">
          <Link to="/events" className="hover:text-sky-600">イベント一覧</Link>
          <span className="mx-2">→</span>
          <Link to={`/events/${id}`} className="hover:text-sky-600">イベント詳細</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-900">編集</span>
        </nav>
      </div>

      {/* イベント編集フォーム */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> */}
        <Card>
        <EventForm
          mode="edit"
          initialData={event}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
        />
        </Card>
      {/* </div> */}

      {/* キャンセルリンク */}
      <div className="mt-6 text-center">
        <Link
          to={`/events/${id}`}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          編集をキャンセルして詳細ページに戻る
        </Link>
      </div>

      {/* 参加者がいる場合の注意メッセージ */}
      {event.attendees > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                参加者がいるイベントです
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                現在{event.attendees}人が参加予定です。参加者がいる場合はイベントを削除できません。
                重要な変更を行う場合は、参加者への事前連絡をお勧めします。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}