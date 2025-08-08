// src/pages/EventCreatePage.tsx
import { UpgradeAccountDialog } from "@/components/auth/UpgradeAccountDialog";
import Card from "@/components/card";
import { EventForm } from "@/components/events/EventForm";
import { Button } from "@/components/ui/button";
import { useEventMutations } from "@/hooks/useEvents";
import { useAuthStore } from "@/stores/auth-store";
import type { CreateEventRequest } from "@shared/types";
import { AlertCircle, UserPlus } from "lucide-react";
import { useState } from "react";

export default function EventCreatePage() {
  const {createEvent, isCreating} = useEventMutations();
  const user = useAuthStore((state) => state.user);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleSubmit = async (data: CreateEventRequest | FormData) => {
    // データはそのまま送信（型変換不要）
    await createEvent(data);
  };

  // アカウント移行成功後の処理
  const handleUpgradeSuccess = () => {
    setShowUpgradeDialog(false);
    // 移行完了後、そのままイベント作成可能になる
    // ページは自動で更新されて正規ユーザーとして表示される
  };

  

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          新しいイベントを作成
        </h1>
        {!user?.isAnonymous && (
          <p className="text-gray-600">
            イベントの詳細情報を入力してください。入力した内容は参加者に表示されます。
          </p>
        )}
      </div>

      {/* イベント作成フォーム or 匿名ユーザーの場合のメッセージ */}
      <Card>
        {user?.isAnonymous ? (
          <div className="w-full py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-left w-fit mx-auto">
              イベントの作成にはアカウント登録が必要です。
            </h2>
            <div className="bg-sky-50 border border-blue-200 rounded-lg px-4 md:py-4 my-6 grid grid-cols-1 md:grid-cols-2 gap-0 md:min-h-56">
              <div className="py-6 md:py-4">
              <h3 className="font-semibold text-sky-900 mb-2 w-fit mx-auto">
                現在のゲスト活動
              </h3>
              <ul className="text-sm text-sky-600 text-left space-y-1 pt-2 w-fit mx-auto list-disc">
                <li>イベント閲覧・申し込み ✓</li>
                <li>申し込み履歴の一時保存 ✓</li>
              </ul>
              </div>
              <div className="py-6 md:py-4 border-t md:border-t-0 md:border-l border-blue-200">
                <h4 className="font-semibold text-sky-900 mb-2 w-fit mx-auto">
                  アカウント登録で追加される機能
                </h4>
                <ul className="text-sm text-sky-600 text-left space-y-1 pt-2 w-fit mx-auto list-disc">
                  <li>イベントの作成・管理</li>
                  <li>申し込み履歴の永続保存</li>
                  <li>イベント情報の編集・削除</li>
                </ul>
              </div>
            </div>

            {/* データ移行型アカウント登録ボタン */}
              <Button 
                onClick={() => setShowUpgradeDialog(true)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-4 px-6 transition-colors duration-300 ease-in-out text-base cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  データを引き継いでアカウント作成
                </div>
              </Button>
            
            <p className="mt-4 text-sm text-zinc-500 w-fit mx-auto">
              デモ運用のため、メールアドレス等はダミーでも登録できます。
            </p>
          </div>
        ) : (
          <EventForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
          />
        )}
      </Card>

      {/* キャンセルリンク */}
      <div className="mt-6 text-center">
        <a
          href="/events"
          className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          {user?.isAnonymous
            ? "イベント一覧に戻る"
            : "キャンセルしてイベント一覧に戻る"}
        </a>
      </div>

      {/* 🆕 アカウント移行ダイアログ */}
      <UpgradeAccountDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}
