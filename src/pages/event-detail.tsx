import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/hooks/useAuth";
import { useEventRegistrationStatus } from "@/hooks/useEventRegistration";
import { useEventDelete } from "@/hooks/useEvents";
import { getEventById, queryKeys } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle,
  Edit,
  History,
  List,
  MapPin,
  Trash2,
  Users
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import Card from "../components/card";
import DEFAULT_IMAGE from "/default.png";

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
    queryKey: queryKeys.event(id as string), // 統一されたqueryKeyを使用
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

  // 申し込み状況の判定
  const registrationStatus = useEventRegistrationStatus(
    id as string,
    event,
    user
  );
  const {isRegistered} = registrationStatus;

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

    // 申し込み済みの場合の表示
    if (isRegistered) {
      return (
        <div className="space-y-2">
          <Button
            className="text-white text-lg bg-emerald-500 border py-8 w-full rounded-lg disabled:opacity-100 cursor-default"
            disabled
          >
            <CheckCircle className="size-6" />
            申し込み済み
          </Button>
          <p className="text-sm text-gray-600 text-center">
            申し込み履歴から管理できます
          </p>
          <Button asChild variant="outline" className="w-full border-sky-600 text-sky-600 hover:bg-sky-50 transition-colors">
            <Link
              to="/user/registrations"
              className=""
            >
              <History className="w-4 h-4" />
              申し込み履歴
            </Link>
          </Button>
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
    <div className="py-8 flex flex-col-reverse md:flex-row gap-8 mx-auto">
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
      <div className="space-y-2">
        <Card>
          {event && (
            <>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                イベントの詳細
              </h2>
              <div className="flex flex-wrap gap-3 text-base">
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
          {isEventCreator && (
            <>
              <hr className="mb-5 text-blue-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                管理者メニュー
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Button
                  asChild
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                >
                  <Link to={`/events/${event?.id}/edit`}>
                    <Edit className="w-4 h-4" />
                    編集
                  </Link>
                </Button>

                {event?.attendees === 0 ? (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        削除中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        削除
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 gap-1 py-2 text-gray-800 disabled:opacity-100 bg-gray-300 disabled:pointer-events-auto"
                    title={`参加者がいるため削除できません（${event?.attendees}人参加中）`}
                  >
                    <span className="relative">
                      <Trash2 className="w-4 h-4 text-gray-500" />
                      <span className="absolute w-[1px] h-5 -bottom-[3px] rotate-45 bg-gray-800 rounded-md"></span>
                    </span>
                    <span className="sm:text-xs">参加者あり</span>
                  </Button>
                )}
              </div>
              <Button
                asChild
                variant="outline"
                className="w-full text-sky-600 border-sky-600 hover:bg-sky-50 cursor-pointer"
              >
                <Link to="/user/created-events">
                  <List className="w-4 h-4" />
                  イベント作成履歴
                </Link>
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
