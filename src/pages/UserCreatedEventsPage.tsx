// src/pages/UserCreatedEventsPage.tsx - 簡単修正版（既存パターン完全踏襲）

import {useState} from "react";
import {Link} from "react-router";
import {
  CalendarDays,
  MapPin,
  Users,
  Loader2,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  UserPlus,
} from "lucide-react";
import Card from "../components/card";
import {useAuthStore} from "@/stores/auth-store";
import {useSessionQuery} from "@/hooks/useAuth";
import {
  useEventEditNavigation,
  useUserCreatedEvents,
} from "@/hooks/useUserCreatedEvents";
import {useEventDelete} from "@/hooks/useEvents";
import type {UserCreatedEvent} from "@shared/types";

import DEFAULT_IMAGE from "/default.png";
import {Button} from "@/components/ui/button";
import {UpgradeAccountDialog} from "@/components/auth/UpgradeAccountDialog";

export default function UserCreatedEventsPage() {
  const user = useAuthStore((state) => state.user);
  const { isLoading: authLoading } = useSessionQuery();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // TanStack Query フックを統合
  const {
    data: userCreatedEventsData,
    isLoading,
    error,
  } = useUserCreatedEvents();

  // イベント操作フック（既存のまま使用）
  const { confirmAndDelete, isDeleting } = useEventDelete();
  const {navigateToEdit} = useEventEditNavigation();

  /**
   * 作成日時を日本語形式でフォーマット
   * @param timestamp Unix timestamp (seconds) - DBからは秒単位で返される
   * @returns "2025年7月1日" 形式の文字列
   */
  const formatCreatedDate = (timestamp: number): string => {
    // 🔧 秒単位を ミリ秒単位に変換
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0ベースなので+1
    const day = date.getDate();

    return `${year}年${month}月${day}日`;
  };

  // アカウント移行成功後の処理
  const handleUpgradeSuccess = () => {
    setShowUpgradeDialog(false);
    // 移行完了後、ページ内容が自動で正規ユーザー向けに切り替わる
    // user.isAnonymous が false になるため、条件分岐で表示が変わる
  };

  // ローディング状態
  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          {authLoading ? "認証状態を確認中..." : "作成イベント履歴を読み込み中..."}
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-600 mb-2">
              作成イベント履歴の取得に失敗しました
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : "不明なエラーが発生しました"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // 匿名ユーザーの場合：アップグレード促進画面
  if (user?.isAnonymous) {
    return (
      <>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-sky-600" />
              <h1 className="text-3xl font-bold text-gray-800">作成イベント</h1>
            </div>
            <p className="text-gray-600">
              イベント作成履歴の確認には正規アカウントが必要です。
            </p>
          </div>

          <Card>
            <div className="w-full py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-center mb-4">
                イベント作成履歴の確認にはアカウント登録が必要です
              </h2>

              <div className="bg-sky-50 border border-blue-200 rounded-lg px-4 py-6 my-6">
                <h3 className="font-semibold text-sky-900 mb-3 text-center">
                  アカウント登録で利用できる機能
                </h3>
                <ul className="text-sm text-sky-600 space-y-1 w-fit mx-auto list-disc">
                  <li>イベントの作成・管理</li>
                  <li>作成したイベントの履歴確認</li>
                  <li>イベント情報の編集・削除</li>
                  <li>申し込み履歴の永続保存</li>
                </ul>
              </div>

              <Button
                onClick={() => setShowUpgradeDialog(true)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-4 px-6 transition-colors duration-300 ease-in-out text-base cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  データを引き継いでアカウント作成
                </div>
              </Button>

              <p className="mt-4 text-sm text-zinc-500 text-center">
                現在のゲスト活動データを引き継いで正規アカウントを作成できます
              </p>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Link
              to="/events"
              className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              イベント一覧に戻る
            </Link>
          </div>
        </div>

        {/* アカウント移行ダイアログ */}
        <UpgradeAccountDialog
          open={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          onSuccess={handleUpgradeSuccess}
        />
      </>
    );
  }

  // 正規ユーザーの場合：通常の作成履歴ページ
  const createdEvents = userCreatedEventsData?.createdEvents ?? [];

  // 作成イベント項目コンポーネント
  const CreatedEventItem = ({
    createdEvent,
  }: {
    createdEvent: UserCreatedEvent;
  }) => {
    const {event, created_at, attendee_count, can_edit, can_delete} =
      createdEvent;

    return (
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* イベント画像 */}
          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={event.image_url || DEFAULT_IMAGE}
              alt={event.title}
              className="object-cover w-full h-full"
            />
          </div>

          {/* イベント情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  <Link
                    to={`/events/${event.id}`}
                    className="hover:text-sky-600 transition-colors"
                  >
                    {event.title}
                  </Link>
                </h3>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-green-500" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1 text-purple-500" />
                    <span>
                      {attendee_count}人参加
                      {event.capacity && ` / ${event.capacity}人`}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  作成日: {formatCreatedDate(created_at)}
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2 flex-shrink-0">
                {can_edit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToEdit(event.id)}
                    className="text-sky-600 border-sky-600 hover:bg-sky-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    編集
                  </Button>
                )}

                {can_delete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmAndDelete(event.id, event.title)}
                    disabled={isDeleting}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isDeleting ? '削除中...' : '削除'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-gray-400 border-gray-300"
                    title={`参加者がいるため削除できません（${attendee_count}人参加中）`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    削除
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-sky-600" />
            <h1 className="text-3xl font-bold text-gray-800">作成イベント</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link to="/events/create">
                <Plus className="w-4 h-4 mr-1" />
                新規作成
              </Link>
            </Button>
            <Link
              to="/events"
              className="px-4 py-2 text-sky-600 hover:text-sky-700 transition-colors"
            >
              イベント一覧へ
            </Link>
          </div>
        </div>

        {user && (
          <p className="text-gray-600">
            {user.name}さんが作成したイベント ({createdEvents.length}件)
          </p>
        )}
      </div>

      {/* 作成イベント一覧 */}
      {createdEvents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              作成したイベントがありません
            </h3>
            <p className="text-gray-500 mb-6">
              新しいイベントを作成して、参加者を募集しましょう。
            </p>
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link to="/events/create">
                <Plus className="w-4 h-4 mr-1" />
                イベントを作成する
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {createdEvents.map((createdEvent) => (
            <CreatedEventItem
              key={createdEvent.id}
              createdEvent={createdEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}