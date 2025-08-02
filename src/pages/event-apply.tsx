// src/pages/event-apply.tsx - 申し込み機能実装版

import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useParams, Link} from "react-router";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import Card from "../components/card";
import {getEventById, queryKeys} from "@/lib/api";
import {useAuthStore} from "@/stores/auth-store";
import {
  useEventApply,
  useEventRegistrationStatus,
} from "@/hooks/useEventRegistration";
import DEFAULT_IMAGE from "/default.png";
import {Button} from "@/components/ui/button";
import {getEventImageSrc} from "@/lib/image";

export default function EventApply() {
  const {id} = useParams();
  const user = useAuthStore((state) => state.user);

  // 申し込み・エラー状態管理
  const [applyError, setApplyError] = useState<string | null>(null);

  // 申し込み用のmutation
  const applyMutation = useEventApply();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.event(id as string),
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

  // 申し込み状況の判定
  const registrationStatus = useEventRegistrationStatus(
    id as string,
    event,
    user
  );
  const {isRegistered, isFull, canRegister, canRegisterByTime, reason} =
    registrationStatus;

  // ローディング状態
  if (isLoading) {
    return <div className="text-center py-10">イベント情報を読み込み中...</div>;
  }

  if (error || !event) {
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

  // 🔧 申し込み不可の場合の表示（UXを考慮した遷移先）
  if (!canRegister) {
    const getRedirectInfo = () => {
      if (isRegistered) {
        return {
          message: "既に申し込み済みです。",
          path: "/user/registrations",
          buttonText: "申し込み履歴へ",
        };
      } else if (isFull) {
        return {
          message: "このイベントは満員です。",
          path: "/events", // 🔧 他のイベント探索を促進
          buttonText: "他のイベントを探す",
        };
      } else if (!canRegisterByTime) {
        return {
          message: "申し込み期限が終了しています。",
          path: "/events", // 🔧 他のイベント探索を促進
          buttonText: "他のイベントを探す",
        };
      } else {
        return {
          message: reason || "申し込みできません。",
          path: "/events", // 🔧 他のイベント探索を促進
          buttonText: "他のイベントを探す",
        };
      }
    };

    const {message, path, buttonText} = getRedirectInfo();

    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">申し込みできません</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link
                  to={path}
                  className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {buttonText}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={`/events/${id}`}
                  className="px-6 py-2 border border-sky-600 text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  イベント詳細へ戻る
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 申し込み処理
  const handleApply = async () => {
    if (!id) return;

    try {
      setApplyError(null);
      await applyMutation.mutateAsync(id);
      // 成功時は自動的に申し込み完了ページへ遷移（useEventApplyで処理）
    } catch (error) {
      setApplyError(
        error instanceof Error
          ? error.message
          : "申し込み処理中にエラーが発生しました"
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <Link to={`/events/${id}`}>
          <p className="text-sky-700 underline">← イベント詳細に戻る</p>
        </Link>

        <h2 className="text-4xl font-bold my-6 text-gray-800">
          イベントに申し込む
        </h2>

        {/* イベント情報の確認 */}
        <div className="border-t border-blue-200 py-8 mb-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-sky-500" />
            申し込み内容の確認
          </h3>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* イベント画像 */}
            <div className="h-48 sm:aspect-[4/3] sm:w-64 sm:h-auto flex-shrink-0">
              <img
                src={getEventImageSrc(event.image_url) || DEFAULT_IMAGE}
                alt={event.title}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }}
              />
            </div>

            {/* イベント詳細 */}
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800 mb-6">
                {event.title}
              </h4>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>
                    現在の参加者: {event.attendees}
                    {event.capacity && `/${event.capacity}人`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>申し込み受付中</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 申し込み者情報 */}
        <div className="border-t border-blue-200 py-8 mb-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="size-5 text-sky-500" />
            申し込み者情報
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">お名前:</span>
              <span className="ml-2">{user?.name}</span>
            </div>
            {!user?.isAnonymous && (
              <div>
                <span className="font-medium text-gray-700">
                  メールアドレス:
                </span>
                <span className="ml-2">{user?.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-white/70 border border-blue-200 rounded-lg p-4 sm:p-5 mb-8">
          <h3 className="font-medium mb-2">注意事項 :</h3>
          <ul className="text-sm space-y-1 list-disc list-inside pl-2">
            <li>申し込み後のキャンセルは、申し込み履歴ページから行えます</li>
            <li>イベント開始後のキャンセルはできません</li>
            <li>定員に達した場合、申し込みが制限される場合があります</li>
            <li>イベントの詳細変更がある場合は、事前にお知らせいたします</li>
          </ul>
        </div>

        {/* エラー表示 */}
        {applyError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800">{applyError}</p>
            </div>
          </div>
        )}

        {/* 申し込みボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/events/${id}`}
            className="flex-1 py-3 text-center border border-sky-600 text-sky-600 rounded-xl hover:bg-sky-50 transition-colors"
          >
            戻る
          </Link>
          <button
            onClick={handleApply}
            disabled={applyMutation.isPending}
            className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {applyMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {applyMutation.isPending ? "申し込み中..." : "申し込みを確定する"}
          </button>
        </div>
      </Card>
    </div>
  );
}
