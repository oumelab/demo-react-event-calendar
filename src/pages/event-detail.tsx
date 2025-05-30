import {useQuery} from "@tanstack/react-query";
import {Link, useParams, useNavigate} from "react-router";
import Card from "../components/card";
import {CalendarDays, MapPin, Users} from "lucide-react";
import DEFAULT_IMAGE from "/default.png";
import {getEventById} from "@/lib/api";
import {useAuth} from "../hooks/useAuth";

export default function EventDetail() {
  const {id} = useParams();
  const navigate = useNavigate();
  const {isAuthenticated, isLoading: authLoading} = useAuth();

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id as string),
    enabled: !!id,
  });

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
  // const isFull = event?.capacity && event.attendees >= event.capacity; => button disabled={isFull}でエラーになる
  // event?.capacity は number | undefined 型を返す
  // 論理演算子 (&&) の結果は、型システム上は必ずしも boolean 型とは限らない
  // TypeScriptでは、論理演算子の結果は最後に評価された値の型になる可能性がある
  // 下記もしくは const isFull = event?.capacity && event.attendees >= event.capacity ? true : false;
  const isFull = Boolean(event?.capacity && event.attendees >= event.capacity);

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
              className="flex-1 py-3 text-center bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors"
            >
              ログイン
            </Link>
            <Link
              to="/register"
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
              {/* <button
            onClick={() => navigate(`/events/${event.id}/apply`)}
            className={`${
              isFull
                ? "text-zinc-900 bg-zinc-300 cursor-not-allowed"
                : "text-white bg-sky-600 hover:opacity-80 cursor-pointer"
            } py-4 w-full rounded-xl`}
            disabled={isFull}
          >
            {isFull ? "満員" : "申し込む"}
          </button> */}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
