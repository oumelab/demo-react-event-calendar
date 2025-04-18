import { useParams, Link } from "react-router-dom";
import { EVENTS as events } from "../constants";
import REACT_EVENT from "../assets/react-event.jpg";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Card from "../components/card";
export default function EventDetail() {
  const { id } = useParams();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <>
        <p>URLのイベントが見つかりません</p>
        <Link to="/" className="underline">イベント一覧に戻る</Link>
      </>
    );
  }

  return (
    <div className="flex gap-8 max-w-5xl mx-auto">
    <Card>
      <h2 className="text-4xl font-bold mb-4 text-gray-800">{event.title}</h2>
      <p className="whitespace-pre-wrap">{event.description}</p>
      <img
        src={REACT_EVENT}
        alt={event.title}
        className="rounded-t-lg w-[660px] h-[440px]"
      />
    </Card>
    <div className="">
      <Card>
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
            <span>
              {event.attendees}
              {event.capacity && `/${event.capacity}`}
              人参加予定
            </span>
          </div>
        </div>

        <Link to={`/events/${event.id}/apply`} className="block">
          <button
            // onClick={() => navigate(`/events/${event.id}/apply`)}
            className="py-4 w-full bg-sky-600 hover:opacity-80 text-white rounded-xl"
          >
            申し込む
          </button>
        </Link>
      </Card>
    </div>
  </div>
  );
}