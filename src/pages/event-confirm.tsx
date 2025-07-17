// src/pages/event-confirm.tsx - 統一性改善のための軽微な更新

import {getEventById, queryKeys} from "@/lib/api"; // 統一されたqueryKeys使用
import {useQuery} from "@tanstack/react-query";
import {Calendar, Home, List, MapPin, Users} from "lucide-react"; // アイコン追加
import {useEffect} from "react";
import {Link, useLocation, useNavigate, useParams} from "react-router";
import Card from "../components/card";

export default function EventConfirm() {
  const {id} = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 申し込み完了状態のチェック(不正アクセス防止)
  useEffect(() => {
    // location.state に申し込み完了フラグがない場合は不正アクセス
    const isValidAccess = location.state?.fromApplication === true;

    if (!isValidAccess) {
      // 不正アクセスの場合はイベント詳細ページにリダイレクト
      navigate(`/events/${id}`, {replace: true});
    }
  }, [id, location.state, navigate]);

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.event(id as string), // 統一されたqueryKeyを使用
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

  // ローディング状態
  if (isLoading) {
    return <div className="text-center py-10">イベント情報を読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="w-fit mx-auto py-24 space-y-8 text-center">
        <h3 className="text-lg font-bold text-red-600">
          {error instanceof Error && error.message === "Event not found"
            ? "URLのイベントが見つかりません"
            : `エラーが発生しました: ${
                error instanceof Error ? error.message : String(error)
              }`}
        </h3>
        <Link to="/events" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  if (event?.capacity && event.attendees >= event.capacity) {
    return (
      <div className="w-fit mx-auto py-24 space-y-8 text-center">
        <h3 className="text-lg font-bold text-red-600">
          このイベントはすでに定員に達しています。
        </h3>
        <Link to="/events" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        {/* 成功メッセージ */}
        <div className="text-left sm:text-center py-4 mb-4">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            🎉 イベント申し込み完了
          </h2>
          <p className="text-gray-600">
            申し込みが正常に完了いたしました！
            <br />
            当日は、下記の時間に余裕を持ってご参加ください！
          </p>
        </div>

        {/* イベント情報の表示 */}
        {event && (
          <div className="border-t border-blue-200 px-2 py-8 mb-0">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {event.title}
            </h3>

            <div className="space-y-2 text-base">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  <strong>開催日時:</strong> {event.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>
                  <strong>開催場所:</strong> {event.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>
                  <strong>参加状況:</strong> {event.attendees}
                  {event.capacity && `/${event.capacity}`}人
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 次のアクション案内 */}
        <div className="bg-white/60 border border-blue-200 rounded-lg p-4 mb-8 space-y-2">
          <h3 className="font-medium text-blue-900">キャンセルについて:</h3>
          <ul className="text-sm text-blue-900 space-y-1 list-disc pl-5">
            <li>キャンセルが必要な場合は、<Link to="/user/registrations" className="underline underline-offset-2">申し込み履歴ページ</Link> から行えます</li>
            <li>イベント開始後のキャンセルはできませんのでご注意ください</li>
          </ul>
        </div>

        {/* 🚀 アクションボタン */}
        <div className="space-y-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={`/events/${event?.id}`}
              className="flex-1 py-3 text-center border border-sky-600 text-sky-600 rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              イベント詳細を見る
            </Link>

            <Link
              to="/user/registrations"
              className="flex-1 py-3 text-center bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <List className="w-4 h-4" />
              申し込み履歴
            </Link>
          </div>

          <Link
            to="/events"
            className="flex-1 py-3 text-center bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            イベント一覧
          </Link>
        </div>
      </Card>
    </div>
  );
}
