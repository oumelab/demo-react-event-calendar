import { getDbClient } from '../../utils/db';
import { getCurrentUser } from '../../utils/auth';
import { validatePartialEventData } from '../../utils/event-validation';
import { jsonResponse, errorResponse } from '../../utils/response';
import type { RequestContext } from '@shared/cloudflare-types';
import type { UpdateEventRequest } from '@shared/types';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'PUT') {
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
      return errorResponse('このイベントを編集する権限がありません', 403);
    }

    const body: UpdateEventRequest = await context.request.json();
    
    // 部分バリデーション
    const validationErrors = validatePartialEventData(body);
    if (validationErrors.length > 0) {
      return errorResponse(validationErrors.join(', '), 400);
    }

    // 更新実行（固定SQL - create.tsと同じパターン）
    await client.execute({
      sql: `UPDATE events 
            SET title = ?, date = ?, location = ?, description = ?, image_url = ?, capacity = ?
            WHERE id = ?`,
      args: [
        body.title ?? String(event.title),
        body.date ?? String(event.date),
        body.location ?? String(event.location),
        body.description ?? String(event.description || ''),
        body.image_url ?? (event.image_url ? String(event.image_url) : null),
        body.capacity ?? (event.capacity ? Number(event.capacity) : null),
        eventId
      ]
    });

    // 更新後のイベント情報を取得
    const updatedEvent = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId]
    });

    return jsonResponse({ 
      message: 'イベントが更新されました',
      eventId,
      event: updatedEvent.rows[0]
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return errorResponse('イベントの更新中にエラーが発生しました', 500);
  }
}