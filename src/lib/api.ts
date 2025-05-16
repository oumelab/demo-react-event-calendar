import { EventWithAttendees } from "./types";

export async function getEvents(): Promise<EventWithAttendees[]> {
  const res = await fetch('/api/events');
  return res.json();
}