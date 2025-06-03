// イベント情報一覧+各参加者数を取得

import { getDbClient } from './utils/db';
import { jsonResponse, errorResponse } from './utils/response';
import { transformEventRow } from './utils/data';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext) {
  try {
    const client = getDbClient(context.env);
    
    // イベントデータの取得
    const eventsResult = await client.execute('SELECT * FROM events');
    
    // 各イベントの参加者数を取得
    const attendeesResult = await client.execute(
      'SELECT event_id, COUNT(*) as count FROM attendees GROUP BY event_id'
    );

    // 参加者数をマッピング - 型定義を追加
    const attendeesMap = new Map<string, number>();
    for (const row of attendeesResult.rows) {
      // 文字列化して安全にアクセスできるようにする
      const eventId = String(row.event_id);
      attendeesMap.set(eventId, Number(row.count));
    }
    
    // イベントデータと参加者数を結合
    const events = eventsResult.rows.map(row => {
      const event = transformEventRow(row);
      const attendees = attendeesMap.get(event.id) || 0;
      return {
        ...event,
        attendees
      };
    });
    
    return jsonResponse(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse('イベントの取得中にエラーが発生しました', 500);
  }
}