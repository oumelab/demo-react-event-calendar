import {useQuery} from "@tanstack/react-query";
import {Link, useLocation, useNavigate, useParams} from "react-router";
import {getEventById, queryKeys} from "@/lib/api";
import {useAuthStore} from "@/stores/auth-store";
import {useEventDelete} from "@/hooks/useEvents";
import {CalendarDays, MapPin, Users} from "lucide-react";
import Card from "../components/card";
import DEFAULT_IMAGE from "/default.png";
import {useSessionQuery} from "@/hooks/useAuth";
import {Button} from "@/components/ui/button";

export default function EventDetail() {
  const {id} = useParams();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const {isLoading: authLoading} = useSessionQuery();
  const {confirmAndDelete, isDeleting} = useEventDelete();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    // queryKey: ["event", id],
    queryKey: queryKeys.event(id as string), // 🔧 統一されたqueryKeyを使用
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

  const isEventCreator = event && user ? user.id === event.creator_id : false;

  // ローディング
  if (isLoading || authLoading) {
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
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  // 安全にdescriptionにアクセス
  const description = event?.description || "";

  // 満員状態の確認
  const isFull = Boolean(event?.capacity && event.attendees >= event.capacity);

  // 🔧 削除処理の実装
  const handleDelete = () => {
    if (!event) return;
    confirmAndDelete(event.id, event.title);
  };

  // 申し込みボタンの表示制御
  const renderActionButton = () => {
    if (isFull) {
      return (
        <button
          className="text-zinc-900 bg-zinc-300 cursor-not-allowed py-4 w-full rounded-xl"
          disabled
        >
          満員
        </button>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            イベントに参加するにはログインが必要です
          </p>
          <div className="flex gap-2">
            <Link
              to="/login"
              state={{from: {pathname: location.pathname}}}
              className="flex-1 py-3 text-center bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors"
            >
              ログイン
            </Link>
            <Link
              to="/register"
              state={{from: {pathname: location.pathname}}}
              className="flex-1 py-3 text-center border border-sky-600 text-sky-600 rounded-xl hover:bg-sky-50 transition-colors"
            >
              新規登録
            </Link>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={() => navigate(`/events/${event?.id}/apply`)}
        className="text-white bg-sky-600 hover:bg-sky-700 cursor-pointer py-4 w-full rounded-xl transition-colors"
      >
        申し込む
      </button>
    );
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-8 mx-auto">
      <Card>
        {event && (
          <>
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              {event.title}
            </h2>
            <p className="whitespace-pre-wrap">{description}</p>
            <div className="rounded-lg w-full h-auto aspect-[4/3] overflow-hidden">
              <img
                src={event.image_url || DEFAULT_IMAGE}
                alt={event.title}
                className="object-cover w-full h-full"
              />
            </div>
          </>
        )}
      </Card>
      <div className="">
        <Card>
          {event && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                イベントの詳細
              </h2>
              <div className="flex flex-wrap gap-4 text-base">
                <div className="flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-blue-500" />
                  <span>{event.date}〜</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-green-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-500" />
                  <span className={isFull ? "text-red-500" : ""}>
                    {event.attendees}
                    {event.capacity && `/${event.capacity}`}
                    人参加予定
                  </span>
                </div>
              </div>

              {renderActionButton()}
            </>
          )}
        </Card>

        {isEventCreator && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">イベント管理</h3>
            <div className="flex flex-col gap-3">
              <Link to={`/events/${event?.id}/edit`}>
                <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  イベントを編集
                </Button>
              </Link>
              
              {event?.attendees === 0 ? (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      削除中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      イベントを削除
                    </>
                  )}
                </Button>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    <strong>削除不可:</strong> 参加者が{event?.attendees}人います
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
