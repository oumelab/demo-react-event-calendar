import { useParams, useNavigate, Link } from "react-router";
import Card from "../components/card";
import { EVENTS as events } from "../constants";

export default function EventApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="w-fit mx-auto py-24 space-y-8 text-center">
        <h3 className="text-lg font-bold text-red-600">URLのイベントが見つかりません</h3>
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
}

if (event.capacity && event.attendees >= event.capacity) {
  return (
    <div className="w-fit mx-auto py-24 space-y-8 text-center">
      <h3 className="text-lg font-bold text-red-600">このイベントはすでに定員に達しています。</h3>
      <Link to="/" className="underline">
        イベント一覧に戻る
      </Link>
    </div>
  );
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ここでイベント申し込み処理を行う
  alert("（テスト）確認メールを送信しました!");
  navigate(`/events/${event?.id}/confirm`);
};
return (
  <div className="max-w-3xl mx-auto">
      <Card>
        <Link to="/">
          <p className="text-sky-700 underline text-lg">イベント一覧</p>
        </Link>
        <h2 className="text-4xl font-bold my-4 text-gray-800">
          イベントに申し込む
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2" htmlFor="email">
              参加者のメールアドレス：
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="border border-gray-300 rounded-xl p-2 w-full"
              />
              <button className="py-4 w-1/3 bg-sky-600 hover:opacity-80 text-white rounded-xl cursor-pointer">
                申し込みを確定する
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            （架空のイベントのため、ダミーのメールアドレスで構いません。）
          </p>
        </form>

        <hr />
        <h2 className="text-2xl font-bold mb-4 text-gray-800">👀 確認事項</h2>
        <ul className="list-disc list-inside">
          <li>イベント名：{event.title}</li>
          <li>開催日時：{event.date}</li>
          <li>開催場所：{event.location}</li>
          <li>
            参加状況：{event.attendees}
            {event.capacity && `/${event.capacity}`}
          </li>
        </ul>
      </Card>
    </div>
);
};
