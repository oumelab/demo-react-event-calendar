// src/pages/UserRegistrationsPage.tsx - ユーザー申し込み履歴ページ

import {useState} from "react";
import {Link} from "react-router";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Card from "../components/card";
import {useAuthStore} from "@/stores/auth-store";
import {useSessionQuery} from "@/hooks/useAuth"; // 🔧 追加
import {
  useUserRegistrationsSimple,
  useEventCancel,
} from "@/hooks/useEventRegistration";
import type {UserRegistration, EventWithAttendees} from "@shared/types";

import DEFAULT_IMAGE from "/default.png";
import {Button} from "@/components/ui/button";

export default function UserRegistrationsPage() {
  const user = useAuthStore((state) => state.user);
  const { isLoading: authLoading } = useSessionQuery();
  const [showCancelDialog, setShowCancelDialog] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // 申し込み履歴を取得
  const {
    data: userRegistrations,
    isLoading,
    error,
  } = useUserRegistrationsSimple();
  const cancelMutation = useEventCancel();

  /**
   * 申し込み日時を日本語形式でフォーマット
   * @param timestamp Unix timestamp (milliseconds)
   * @returns "2025年7月1日" 形式の文字列
   */
  const formatRegistrationDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0ベースなので+1
    const day = date.getDate();

    return `${year}年${month}月${day}日`;
  };

  // ローディング状態
  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          申し込み履歴を読み込み中...
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
              申し込み履歴の取得に失敗しました
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : "不明なエラーが発生しました"}
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

  const registrations = userRegistrations?.registrations ?? [];

  // キャンセル処理
  const handleCancel = async (eventId: string) => {
    try {
      setCancelError(null);
      await cancelMutation.mutateAsync(eventId);
      // 成功時は自動的にキャンセル完了ページへ遷移
    } catch (error) {
      setCancelError(
        error instanceof Error
          ? error.message
          : "キャンセル処理中にエラーが発生しました"
      );
      setShowCancelDialog(null);
    }
  };

  // 開催日時チェック関数
  const isEventNotStarted = (dateTimeStr: string): boolean => {
    try {
      const match = dateTimeStr.match(
        /(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/
      );
      if (!match) return true;

      const [, year, month, day, hours, minutes] = match;
      const eventDate = new Date();
      eventDate.setFullYear(parseInt(year, 10));
      eventDate.setMonth(parseInt(month, 10) - 1);
      eventDate.setDate(parseInt(day, 10));
      eventDate.setHours(parseInt(hours, 10));
      eventDate.setMinutes(parseInt(minutes, 10));
      eventDate.setSeconds(0);
      eventDate.setMilliseconds(0);

      return eventDate > new Date();
    } catch {
      return true;
    }
  };

  // 登録アイテムコンポーネント
  const RegistrationItem = ({
    registration,
  }: {
    registration: UserRegistration;
  }) => {
    // バックエンドで参加者数を含むデータが返されるため、EventWithAttendeesとして扱う
    const event = registration.event as EventWithAttendees;
    const canCancel = registration.can_cancel && isEventNotStarted(event.date);
    const isPastEvent = !isEventNotStarted(event.date);

    return (
      <Card key={registration.id}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* イベント画像 */}
          <div className="w-full md:w-48 h-auto flex-shrink-0">
            <img
              src={event.image_url || DEFAULT_IMAGE}
              alt={event.title}
              className="aspect-video md:aspect-auto w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* イベント情報 */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                <Link
                  to={`/events/${event.id}`}
                  className="hover:text-sky-600 transition-colors"
                >
                  {event.title}
                </Link>
              </h3>
              {isPastEvent && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  終了
                </span>
              )}
            </div>

            {/* イベント詳細 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-blue-500" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                <span>
                  参加者: {event.attendees}
                  {event.capacity && `/${event.capacity}`}人
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                <span>
                  申し込み: {formatRegistrationDate(registration.registered_at)}
                </span>
              </div>
            </div>

            {/* イベント説明（短縮版） */}
            {event.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {event.description.length > 100
                  ? `${event.description.substring(0, 100)}...`
                  : event.description}
              </p>
            )}

            {/* アクションボタン */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" className="flex-1 lg:flex-none lg:w-56">
                <Link
                  to={`/events/${event.id}`}
                  className="px-4 py-2 text-sm border border-sky-600 text-sky-600 hover:bg-sky-50 transition-colors"
                >
                  詳細を見る
                </Link>
              </Button>

              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(event.id)}
                  disabled={cancelMutation.isPending}
                  className="flex-1 lg:flex-none lg:w-56 px-4 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "キャンセル"
                  )}
                </Button>
              )}

              {!canCancel && !isPastEvent && (
                <span className="px-4 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg">
                  キャンセル不可
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // キャンセル確認ダイアログ
  const renderCancelDialog = () => {
    if (!showCancelDialog) return null;

    const event = registrations.find(
      (r) => r.event.id === showCancelDialog
    )?.event;
    if (!event) return null;

    return (
      <div className="fixed inset-0 bg-white/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl border border-zinc-300">
          <h3 className="text-2xl font-bold mb-4">申し込みキャンセルの確認</h3>
          <p className="text-gray-600 mb-2">
            以下のイベントの申し込みをキャンセルしますか？
          </p>
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-lg font-bold mb-2">{event.title}</p>
            <p className="text-sm text-gray-600">{event.date}</p>
            <p className="text-sm text-gray-600">{event.location}</p>
          </div>
          <p className="text-sm text-destructive mb-6">
            ※ この操作は取り消すことができません
          </p>

          {cancelError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{cancelError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(null);
                setCancelError(null);
              }}
              disabled={cancelMutation.isPending}
              className="flex-1 border-gray-300 text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              戻る
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancel(showCancelDialog)}
              disabled={cancelMutation.isPending}
              className="flex-1 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              キャンセル実行
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-4xl mx-auto py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-sky-600" />
              <h1 className="text-3xl font-bold text-gray-800">申し込み履歴</h1>
            </div>
            <Link
              to="/events"
              className="px-4 py-2 text-sky-600 hover:text-sky-700 transition-colors"
            >
              イベント一覧へ
            </Link>
          </div>

          {user && (
            <p className="text-gray-600">
              {user.name}さんの申し込み履歴 ({registrations.length}件)
            </p>
          )}
        </div>

        {/* エラー表示 */}
        {cancelError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800">{cancelError}</p>
            </div>
          </div>
        )}

        {/* 申し込み履歴一覧 */}
        {registrations.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                申し込み履歴がありません
              </h3>
              <p className="text-gray-500 mb-6">
                イベントに申し込むと、こちらに履歴が表示されます。
              </p>
              <Link
                to="/events"
                className="inline-block px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                イベントを探す
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <RegistrationItem
                key={registration.id}
                registration={registration}
              />
            ))}
          </div>
        )}
      </div>

      {/* キャンセル確認ダイアログ */}
      {renderCancelDialog()}
    </>
  );
}
