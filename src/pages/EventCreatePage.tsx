// src/pages/EventCreatePage.tsx
import Card from '@/components/card';
import { EventForm } from '@/components/events/EventForm';
import { useEventMutations } from '@/hooks/useEvents';
import type { CreateEventRequest } from '@shared/types';

export default function EventCreatePage() {
  const { createEvent, isCreating } = useEventMutations();

  const handleSubmit = async (data: CreateEventRequest) => {
    // 🔧 データはそのまま送信（型変換不要）
    await createEvent(data);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          新しいイベントを作成
        </h1>
        <p className="text-gray-600">
          イベントの詳細情報を入力してください。入力した内容は参加者に表示されます。
        </p>
      </div>

      {/* イベント作成フォーム */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> */}
      <Card>
        <EventForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
        />
      </Card>
      {/* </div> */}

      {/* キャンセルリンク */}
      <div className="mt-6 text-center">
        <a
          href="/events"
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          キャンセルしてイベント一覧に戻る
        </a>
      </div>
    </div>
  );
}