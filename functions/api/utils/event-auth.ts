import { getCurrentUser } from './auth';
import { getDbClient } from './db';
import { errorResponse } from './response';
import { transformEventRow } from './data';
import type { RequestContext } from '@shared/cloudflare-types';
import type { Event, User } from '@shared/types';

export interface EventAuthResult {
  user: User;
  event: Event;
  eventId: string;
  client: ReturnType<typeof getDbClient>;
}

/**
 * イベント認証・権限チェックのヘルパー関数
 */
export async function validateEventAccess(
  context: RequestContext,
  action: 'edit' | 'delete' = 'edit'
): Promise<EventAuthResult | Response> {
  
  // 1. 認証チェック
  const user = await getCurrentUser(context.request, context.env);
  if (!user) {
    return errorResponse('認証が必要です', 401);
  }

  // 2. URLからイベントID取得
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/');
  const eventId = pathParts[pathParts.indexOf('events') + 1];

  if (!eventId) {
    return errorResponse('イベントIDが指定されていません', 400);
  }

  // 3. DB接続・イベント取得
  const client = getDbClient(context.env);
  const existingEvent = await client.execute({
    sql: 'SELECT * FROM events WHERE id = ?',
    args: [eventId]
  });

  if (existingEvent.rows.length === 0) {
    return errorResponse('イベントが見つかりません', 404);
  }

  // 4. 権限チェック
  const eventRow = existingEvent.rows[0];
  if (eventRow.creator_id !== user.id) {
    const actionText = action === 'edit' ? '編集' : '削除';
    return errorResponse(`このイベントを${actionText}する権限がありません`, 403);
  }

  // 5. 成功時：必要なデータを返却
  const event = transformEventRow(eventRow);
  
  return {
    user,
    event,
    eventId,
    client
  };
}

/**
 * レスポンスかデータかを判定する型ガード
 */
export function isEventAuthError(result: EventAuthResult | Response): result is Response {
  return result instanceof Response;
}