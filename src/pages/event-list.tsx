import { getEvents } from "@/lib/api";
import { EventWithAttendees } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router";
import Card from "../components/card";

export default function EventList() {
  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  if (isLoading) {
    return <div className="text-center py-10">イベントを読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        エラーが発生しました:{" "}
        {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <>
      <h2 id="new-events" className="scroll-mt-6 text-lg font-medium">新着イベント</h2>
      {events?.map((event: EventWithAttendees) => (
        <Card key={event.id} hoverShadow>
          <Link to={`/events/${event.id}`} className="space-y-12">
            <div className="flex flex-col space-y-2">
              <div className="font-bold text-2xl leading-none tracking-tight">
                {event.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
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
                <span
                  className={
                    event?.capacity && event.attendees >= event.capacity
                      ? "text-red-500"
                      : ""
                  }
                >
                  {event.attendees}
                  {event.capacity && `/${event.capacity}`}
                  人参加予定
                </span>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </>
  );
}
