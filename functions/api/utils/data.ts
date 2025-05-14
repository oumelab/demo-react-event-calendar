import { Event } from '../types';
export function transformEventRow(row: unknown): Event {
  // 型ガードで安全に変換
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid event row data');
  }
  
  const rowObj = row as Record<string, unknown>;
  
  return {
    id: String(rowObj.id ?? ''),
    title: String(rowObj.title ?? ''),
    date: String(rowObj.date ?? ''),
    location: String(rowObj.location ?? ''),
    description: rowObj.description ? String(rowObj.description) : '',
    image_url: rowObj.image_url ? String(rowObj.image_url) : undefined,
    capacity: rowObj.capacity != null ? Number(rowObj.capacity) : undefined,
    created_at: rowObj.created_at != null ? Number(rowObj.created_at) : undefined
  };
}