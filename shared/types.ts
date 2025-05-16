// フロントとバックエンドで共有する型定義

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string;
  capacity?: number;
  created_at?: number;
}

export interface EventWithAttendees extends Event {
  attendees: number;
}