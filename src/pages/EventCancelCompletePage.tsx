// src/pages/EventCancelCompletePage.tsx - イベント申し込みキャンセル完了ページ

import { getEventById, queryKeys } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle, Home, List, MapPin, Users } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Card from "../components/card";
import DEFAULT_IMAGE from "/default.png";

export default function EventCancelCompletePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

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
        {/* 成功メッセージ */}
        <div className="text-center mb-12">
          <CheckCircle className="size-12 sm:size-16 text-green-500 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            キャンセルが完了しました
          </h2>
          <p className="text-left sm:text-center text-gray-600">
            イベントの申し込みを正常にキャンセルしました。
          </p>
        </div>

        {/* イベント情報の表示 */}
        <div className="border-t border-blue-200 py-8 px-2 mb-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 flex items-center gap-2">
            <Calendar className="size-5 sm:size-6 text-sky-600" />
            キャンセルしたイベント
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-5">
            {/* イベント画像 */}
            <div className="h-48 sm:aspect-[4/3] sm:w-64 sm:h-auto flex-shrink-0">
              <img
                src={event.image_url || DEFAULT_IMAGE}
                alt={event.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* イベント詳細 */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-6">{event.title}</h3>
              
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
        <div className="bg-white/60 border border-blue-200 rounded-lg p-4 mb-10">
          <p className="text-blue-800">
            再度参加をご希望の場合は、イベント詳細ページから再申し込みが可能です
          </p>
        </div>

        {/* 🚀 アクションボタン */}
        <div className="space-y-4 border-t border-blue-200 pt-8 pb-2">
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
          </div>
          
          <Link
            to="/events"
            className="py-3 text-center bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            イベント一覧<span className="text-xs sm:text-sm">(他のイベントを探す)</span>
          </Link>
        </div>
        
      </Card>
    </div>
  );
}