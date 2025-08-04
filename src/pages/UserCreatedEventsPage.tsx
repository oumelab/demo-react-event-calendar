// src/pages/UserCreatedEventsPage.tsx - 簡単修正版（既存パターン完全踏襲）

import { useSessionQuery } from "@/hooks/useAuth";
import { isEventNotStarted } from "@/hooks/useEventUtils";
import { useEventDelete } from "@/hooks/useEvents";
import {
  useEventEditNavigation,
  useUserCreatedEvents,
} from "@/hooks/useUserCreatedEvents";
import { useAuthStore } from "@/stores/auth-store";
import type { UserCreatedEvent } from "@shared/types";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Clock,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users
} from "lucide-react";
import { Link, Navigate } from "react-router";
import Card from "../components/card";

import { Button } from "@/components/ui/button";
import DEFAULT_IMAGE from "/default.png";
import {getEventImageSrc} from "@/lib/image";
import EventEndedBadge from "@/components/ui/EventEndedBadge";

export default function UserCreatedEventsPage() {
  const user = useAuthStore((state) => state.user);
  const { isLoading: authLoading } = useSessionQuery();

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

  // ローディング状態
  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          {authLoading ? "認証状態を確認中..." : "作成履歴を読み込み中..."}
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

 // 匿名ユーザーの場合：イベント作成ページへリダイレクト
  if (user?.isAnonymous) {
    // イベント作成ページへリダイレクト（置き換えモード）
    return <Navigate to="/events/create" replace />;
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
    const isPastEvent = !isEventNotStarted(event.date); // useEventRegistrationフックからインポート

    return (
      <Card key={event.id}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* イベント画像 */}
          <div className="w-full md:w-48 h-auto flex-shrink-0">
            <img
              src={getEventImageSrc(event.image_url) || DEFAULT_IMAGE}
              alt={event.title}
              className="aspect-video md:aspect-auto w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
          </div>

          {/* イベント情報 */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
                  <Link
                    to={`/events/${event.id}`}
                    className="hover:text-sky-600 transition-colors"
                  >
                    {event.title}
                  </Link>
                </h3>
                {isPastEvent && (
                  <EventEndedBadge />
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
                      参加者: {attendee_count}
                      {event.capacity && `/${event.capacity}`}人
                    </span>
                  </div>
                <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                <span>
                  作成日: {formatCreatedDate(created_at)}
                </span>
              </div>
            </div>

              {/* アクションボタン */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button
                asChild
                variant="outline"
                className="flex-1 lg:flex-none lg:w-48"
              >
                <Link
                  to={`/events/${event.id}`}
                  className="px-4 py-2 text-sm border border-sky-600 text-sky-600 hover:bg-sky-50 transition-colors"
                >
                  詳細を見る
                </Link>
              </Button>

                {can_edit && (
                  <Button
                    variant="default"
                    onClick={() => navigateToEdit(event.id)}
                    className="flex-1 lg:flex-none lg:w-48 px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 cursor-pointer transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    編集
                  </Button>
                )}

                {can_delete ? (
                  <Button
                    variant="destructive"
                    onClick={() => confirmAndDelete(event.id, event.title)}
                    disabled={isDeleting}
                    className="flex-1 lg:flex-none lg:w-48 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isDeleting ? '削除中...' : '削除'}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 lg:flex-none lg:w-48 px-4 py-2 text-gray-800 disabled:opacity-100 bg-gray-300 disabled:pointer-events-auto"
                    title={`参加者がいるため削除できません（${event?.attendees}人参加中）`}
                  >
                    <span className="relative">
                      <Trash2 className="w-4 h-4 text-gray-500" />
                      <span className="absolute w-[1px] h-5 -bottom-[3px] rotate-45 bg-gray-800 rounded-md"></span>
                    </span>
                    <span className="sm:text-sm">参加者あり</span>
                  </Button>
                )}
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
            <h1 className="text-3xl font-bold text-gray-800">イベント管理</h1>
          </div>
          <div className="hidden sm:flex sm:gap-3">
            <Button asChild className="bg-sky-600 text-white hover:bg-sky-700 px-4 py-2 w-32">
              <Link to="/events/create">
                <Plus className="w-4 h-4" />
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
            <Button asChild className="bg-sky-600 text-white hover:bg-sky-700">
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