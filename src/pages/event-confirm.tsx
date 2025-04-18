import { useParams, Link } from "react-router-dom";
import Card from "../components/card";
import { EVENTS as events } from "../constants";

export default function EventConfirm() {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <>
        <p>URLのイベントが見つかりません</p>
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          🎉 イベント申し込みが完了しました！
        </h2>

        <p>当日は、下記の時間に余裕を持ってご参加ください！</p>
        <ul className="list-disc list-inside">
          <li>イベント名：{event.title}</li>
          <li>開催日時：{event.date}</li>
          <li>開催場所：{event.location}</li>
          <li>
            参加状況：{event.attendees}
            {event.capacity && `/${event.capacity}`}
          </li>
        </ul>

        <Link to="/" className="block">
          <button className="py-4 px-8 bg-sky-600 hover:opacity-80 text-white rounded-xl">
            トップページに戻る
          </button>
        </Link>
      </Card>
    </div>
  );
}