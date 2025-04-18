import {CalendarDays, MapPin, Users} from "lucide-react";
import {Link, useParams, useNavigate} from "react-router";
import DEFAULT_IMAGE from "/default.png";
import Card from "../components/card";
import {EVENTS as events} from "../constants";
import {useEffect, useState} from "react";
export default function EventDetail() {
  const {id} = useParams();
  const navigate = useNavigate();
  const event = events.find((e) => e.id === id);
  const [isFull, setIsFull] = useState<boolean>(false);

  useEffect(() => {
    if (!event) {
      return;
    }

    if (event.capacity === event.attendees) {
      setIsFull(true);
    }
  }, [event]);

  if (!event) {
    return (
      <div className="w-fit mx-auto py-24 space-y-8 text-center">
        <h3 className="text-lg font-bold text-red-600">
          URLのイベントが見つかりません
        </h3>
        <Link to="/" className="underline">
          イベント一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-8 max-w-5xl mx-auto">
      <Card>
        <h2 className="text-4xl font-bold mb-4 text-gray-800">{event.title}</h2>
        <p className="whitespace-pre-wrap">{event.description}</p>
        <img
          src={event.imageUrl || DEFAULT_IMAGE}
          alt={event.title}
          className="rounded-lg w-[660px] h-[440px]"
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
              <span className={isFull ? "text-red-500" : ""}>
                {event.attendees}
                {event.capacity && `/${event.capacity}`}
                人参加予定
              </span>
            </div>
          </div>

          {/* <Link to={`/events/${event.id}/apply`} className="block"> */}
          <button
            onClick={() => navigate(`/events/${event.id}/apply`)}
            className={`${
              isFull
                ? "text-zinc-900 bg-zinc-300 cursor-not-allowed"
                : "text-white bg-sky-600 hover:opacity-80 cursor-pointer"
            } py-4 w-full rounded-xl`}
            disabled={isFull}
          >
            {isFull ? "満員" : "申し込む"}
          </button>
          {/* </Link> */}
        </Card>
      </div>
    </div>
  );
}
