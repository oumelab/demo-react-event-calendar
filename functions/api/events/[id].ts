// 単体イベント情報+参加者数を取得
import { getDbClient } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';
import { transformEventRow } from '../utils/data';
import { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext) {
  try {
    // URLからイベントIDを取得
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return errorResponse('イベントIDが指定されていません', 400);
    }
    
    const client = getDbClient(context.env);
    
    // イベント情報を取得
    const eventResult = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [id]
    });
    
    if (eventResult.rows.length === 0) {
      return errorResponse('イベントが見つかりません', 404);
    }
    
    // 参加者数を取得
    const attendeesResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM attendees WHERE event_id = ?',
      args: [id]
    });

    // イベントデータを安全に変換
    const event = transformEventRow(eventResult.rows[0]);

     // 参加者数を追加
    const attendees = Number(attendeesResult.rows[0].count);
    
    return jsonResponse({
      ...event,
      attendees
    });
    
  } catch (error) {
    console.error(`Error fetching event:`, error);
    return errorResponse('イベントの取得中にエラーが発生しました', 500);
  }
}