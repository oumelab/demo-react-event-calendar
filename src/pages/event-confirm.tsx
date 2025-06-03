import { useEffect } from "react";
import {useQuery} from "@tanstack/react-query";
import {useParams, Link, useLocation, useNavigate} from "react-router";
import Card from "../components/card";
import {getEventById} from "@/lib/api";

export default function EventConfirm() {
  const {id} = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 🆕 申し込み完了状態のチェック(不正アクセス防止)
  useEffect(() => {
    // location.state に申し込み完了フラグがない場合は不正アクセス
    const isValidAccess = location.state?.fromApplication === true;
    
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
    queryKey: ["event", id],
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
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  if (event?.capacity && event.attendees >= event.capacity) {
    return (
      <div className="w-fit mx-auto py-24 space-y-8 text-center">
        <h3 className="text-lg font-bold text-red-600">
          このイベントはすでに定員に達しています。
        </h3>
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Card>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          🎉 イベント申し込みが完了しました！
        </h2>

        <p>当日は、下記の時間に余裕を持ってご参加ください！</p>
        {event && (
          <ul className="list-disc list-inside">
            <li>イベント名：{event.title}</li>
            <li>開催日時：{event.date}</li>
            <li>開催場所：{event.location}</li>
            <li>
              参加状況：{event.attendees}
              {event.capacity && `/${event.capacity}`}
            </li>
          </ul>
        )}

        <Link to="/" className="block">
          <button className="py-4 px-8 bg-sky-600 hover:opacity-80 text-white rounded-xl">
            トップページに戻る
          </button>
        </Link>
      </Card>
    </div>
  );
}
