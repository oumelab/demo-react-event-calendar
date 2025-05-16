import { EventWithAttendees } from "@shared/types";

// イベント一覧の情報+参加者数を取得
export async function getEvents(): Promise<EventWithAttendees[]> {
  const response = await fetch('/api/events');
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

// 単一イベントの情報+参加者数を取得
export async function getEventById(id: string): Promise<EventWithAttendees> {
  const response = await fetch(`/api/events/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found');
    }
    throw new Error('Failed to fetch event');
  }
  return response.json();
}