import {getEvents} from "@/lib/api";
import {EventWithAttendees} from "@shared/types";
import {useQuery} from "@tanstack/react-query";
import {CalendarDays, MapPin, Users} from "lucide-react";
import {Link, useSearchParams} from "react-router";
import Card from "../components/card";
import {isEventNotStarted, useEventsSortedByDate} from "@/hooks/useEventUtils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import EventEndedBadge from "@/components/ui/EventEndedBadge";
import {cn} from "@/lib/utils";
import {useEffect, useRef} from "react";

const EVENTS_PER_PAGE = 5; // 1ページあたりのイベント数

export default function EventList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const eventListRef = useRef<HTMLHeadingElement>(null);

  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  // リファクタリング：専用フックで日付ソート
  const sortedEvents = useEventsSortedByDate(events, "desc");

  // ページネーション計算
  const totalEvents = sortedEvents.length;
  const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const currentEvents = sortedEvents.slice(startIndex, endIndex);

  // ページ変更ハンドラ
  const handlePageChange = (page: number) => {
    setTimeout(() => {
      setSearchParams({page: page.toString()});
    }, 200);
  };

  // ページ変更時にイベント一覧セクションへスクロール
  useEffect(() => {
    // ページネーション操作時のみスクロール（初回アクセス時は除外）
    if (searchParams.has("page") && eventListRef.current) {
      // ページ遷移後、即座にイベント一覧セクションへ移動
      eventListRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, [currentPage, searchParams]);

  // ページネーション表示用のページ番号を計算
  const getVisiblePages = () => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const range = [];
    const rangeWithDots = [];

    // 常に最初のページを表示
    range.push(1);

    // 現在のページ周辺のページを追加
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // 常に最後のページを表示（totalPages > 1の場合）
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // 重複を除去してソート
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // 省略記号を挿入
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push("ellipsis");
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

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
      {/* イベント一覧ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h2
          id="new-events"
          ref={eventListRef}
          className="scroll-mt-6 text-lg font-medium"
        >
          イベント一覧
        </h2>
        <p className="text-sm text-gray-600">
          {totalEvents}件のイベント（{currentPage}/{totalPages}ページ）
        </p>
      </div>

      {/* イベント一覧 */}
      {currentEvents.length > 0 ? (
        <div className="space-y-6">
          {currentEvents?.map((event: EventWithAttendees) => {
            // 開催終了判定
            const isPastEvent = !isEventNotStarted(event.date);

            return (
              <Card key={event.id} hoverShadow>
                <Link to={`/events/${event.id}`} className="space-y-12">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-bold text-2xl leading-none tracking-tight flex-1">
                        {event.title}
                      </div>
                      {/* 終了マーク */}
                      {isPastEvent && <EventEndedBadge />}
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
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          イベントが見つかりません
        </div>
      )}
      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* 前のページ */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "hover:text-sky-500 hover:bg-sky-50 cursor-pointer"
                  }
                />
              </PaginationItem>

              {/* ページ番号と省略記号 */}
              {getVisiblePages().map((item, index) => (
                <PaginationItem key={index}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(item as number);
                      }}
                      isActive={item === currentPage}
                      className={cn(
                        "cursor-pointer",
                        item === currentPage
                          ? "text-sky-500 bg-sky-50/50 hover:bg-sky-100/80"
                          : "hover:bg-sky-50 hover:text-sky-500"
                      )}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* 次のページ */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "hover:text-sky-500 hover:bg-sky-50 cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
