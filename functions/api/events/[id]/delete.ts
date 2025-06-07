import { getDbClient } from '../../utils/db';
import { getCurrentUser } from '../../utils/auth';
import { jsonResponse, errorResponse } from '../../utils/response';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'DELETE') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    // URLからイベントIDを取得
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const eventId = pathParts[pathParts.indexOf('events') + 1];

    if (!eventId) {
      return errorResponse('イベントIDが指定されていません', 400);
    }

    const client = getDbClient(context.env);

    // 既存イベント確認と権限チェック
    const existingEvent = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId]
    });

    if (existingEvent.rows.length === 0) {
      return errorResponse('イベントが見つかりません', 404);
    }

    const event = existingEvent.rows[0];
    if (event.creator_id !== user.id) {
      return errorResponse('このイベントを削除する権限がありません', 403);
    }

    // 参加者がいるかチェック
    const attendeeCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM attendees WHERE event_id = ?',
      args: [eventId]
    });

    const count = Number(attendeeCount.rows[0].count);
    if (count > 0) {
      return errorResponse(`参加者が${count}人いるため削除できません`, 400);
    }

    // イベント削除
    await client.execute({
      sql: 'DELETE FROM events WHERE id = ?',
      args: [eventId]
    });

    return jsonResponse({ 
      message: 'イベントが削除されました',
      eventId 
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return errorResponse('イベントの削除中にエラーが発生しました', 500);
  }
}