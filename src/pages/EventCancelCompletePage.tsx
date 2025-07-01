// src/pages/EventCancelCompletePage.tsx - イベント申し込みキャンセル完了ページ

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { CheckCircle, Calendar, MapPin, Users, AlertCircle, Home, List } from "lucide-react";
import Card from "../components/card";
import { getEventById, queryKeys } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import DEFAULT_IMAGE from "/default.png";

export default function EventCancelCompletePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 🆕 キャンセル完了状態のチェック（不正アクセス防止）
  useEffect(() => {
    // location.state にキャンセル完了フラグがない場合は不正アクセス
    const isValidAccess = location.state?.fromCancellation === true;
    
    if (!isValidAccess) {
      // 不正アクセスの場合はイベント詳細ページにリダイレクト
      navigate(`/events/${id}`, { replace: true });
    }
  }, [id, location.state, navigate]);

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
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-600 mb-2">
              {error instanceof Error && error.message === "Event not found"
                ? "イベントが見つかりません"
                : `エラーが発生しました: ${
                    error instanceof Error ? error.message : String(error)
                  }`}
            </h3>
            <p className="text-gray-600 mb-6">
              申し込み履歴ページから再度アクセスしてください。
            </p>
            <Link
              to="/user/registrations"
              className="inline-block px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              申し込み履歴へ
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        {/* 🎉 成功メッセージ */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            キャンセルが完了しました
          </h1>
          <p className="text-gray-600">
            イベントの申し込みを正常にキャンセルいたしました。
          </p>
        </div>

        {/* イベント情報の表示 */}
        <div className="border rounded-lg p-6 mb-6 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            キャンセルしたイベント
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* イベント画像 */}
            <div className="sm:w-32 h-24 flex-shrink-0">
              <img
                src={event.image_url || DEFAULT_IMAGE}
                alt={event.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* イベント詳細 */}
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2">{event.title}</h3>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>
                    参加者: {event.attendees}
                    {event.capacity && `/${event.capacity}人`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 キャンセル完了後の案内 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">
            📌 キャンセル完了のお知らせ
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• 申し込みキャンセル処理が正常に完了いたしました</p>
            <p>• 定員に空きができたため、他の方が申し込み可能になりました</p>
            <p>• 再度参加をご希望の場合は、イベント詳細ページから再申し込みが可能です</p>
            {user?.name && (
              <p>• {user.name}さんの申し込み履歴からも確認いただけます</p>
            )}
          </div>
        </div>

        {/* 🚀 アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 py-3 text-center border border-sky-600 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            イベント詳細を見る
          </Link>
          
          <Link
            to="/user/registrations"
            className="flex-1 py-3 text-center bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <List className="w-4 h-4" />
            申し込み履歴
          </Link>
          
          <Link
            to="/events"
            className="flex-1 py-3 text-center bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            イベント一覧
          </Link>
        </div>

        {/* 💡 次のアクションの提案 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3">他にもお探しですか？</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Link
              to="/events"
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-800">🔍 他のイベントを探す</div>
              <div className="text-gray-600">新しいイベントを見つけてみませんか？</div>
            </Link>
            <Link
              to="/user/registrations"
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-800">📋 申し込み状況を確認</div>
              <div className="text-gray-600">他の申し込み済みイベントを確認</div>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}