import {getEvents} from "@/lib/api";
import {EventWithAttendees} from "@shared/types";
import {useQuery} from "@tanstack/react-query";
import {CalendarDays, MapPin, Users} from "lucide-react";
import {Link} from "react-router";
import Card from "../components/card";
import {isEventNotStarted} from "@/hooks/useEventRegistration"; // 🆕 追加

// 🆕 日付文字列を Date オブジェクトに変換する関数
function parseEventDate(dateStr: string): Date {
  try {
    // "2025年9月6日20:00" 形式をパース
    const match = dateStr.match(
      /(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/
    );

    if (!match) {
      // パースできない場合は現在時刻を返す（ソート時に後ろに来る）
      console.warn("Date format not recognized:", dateStr);
      return new Date();
    }

    const [, year, month, day, hours, minutes] = match;

    const eventDate = new Date();
    eventDate.setFullYear(parseInt(year, 10));
    eventDate.setMonth(parseInt(month, 10) - 1); // 月は0ベース
    eventDate.setDate(parseInt(day, 10));
    eventDate.setHours(parseInt(hours, 10));
    eventDate.setMinutes(parseInt(minutes, 10));
    eventDate.setSeconds(0);
    eventDate.setMilliseconds(0);

    return eventDate;
  } catch (error) {
    console.warn("Date parsing error:", error);
    return new Date();
  }
}

export default function EventList() {
  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  // 🆕 イベント並び替え: 開催日時の新しい順（昇順）
  const sortedEvents = events
    ? [...events].sort((a, b) => {
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        return dateB.getTime() - dateA.getTime(); // 降順ソート（開催日時が遠い順）
      })
    : [];

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
      <h2 id="new-events" className="scroll-mt-6 text-lg font-medium">
        新着イベント
      </h2>
      {sortedEvents?.map((event: EventWithAttendees) => {
        // 🆕 開催終了判定
        const isPastEvent = !isEventNotStarted(event.date);

        return (
          <Card key={event.id} hoverShadow>
            <Link to={`/events/${event.id}`} className="space-y-12">
              <div className="flex flex-col space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="font-bold text-2xl leading-none tracking-tight flex-1">
                    {event.title}
                  </div>
                  {/* 🆕 終了マーク */}
                  {isPastEvent && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full shrink-0">
                      終了
                    </span>
                  )}
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
        );
      })}
    </>
  );
}
