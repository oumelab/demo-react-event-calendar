import type { Event } from '@shared/types';
export function transformEventRow(row: unknown): Event {
  // 型ガードで安全に変換
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid event row data');
  }
  
  const rowObj = row as Record<string, unknown>;

  // リテラルの文字列"\n"を実際の改行文字に置換
  const description = typeof rowObj?.description === 'string'
    ? rowObj.description.replace(/\\n/g, '\n')
    : '';
  
  return {
    id: String(rowObj.id ?? ''),
    title: String(rowObj.title ?? ''),
    date: String(rowObj.date ?? ''),
    location: String(rowObj.location ?? ''),
    // description: rowObj.description ? String(rowObj.description) : '',
    description,
    image_url: rowObj.image_url ? String(rowObj.image_url) : undefined,
    capacity: rowObj.capacity != null ? Number(rowObj.capacity) : undefined,
    creator_id: rowObj.creator_id ? String(rowObj.creator_id) : null, //  creator_id の処理、undefined → null に変更
    created_at: rowObj.created_at != null ? Number(rowObj.created_at) : undefined
  };
}