// functions/api/user/created-events.ts - ユーザー作成イベント履歴取得API

import { getDbClient } from '../utils/db';
import { getCurrentUser } from '../utils/auth';
import { transformEventRow } from '../utils/data';
import { jsonResponse, errorResponse } from '../utils/response';
import { validateRequest, isValidationError } from '../utils/validation';
import { conditionalLog, conditionalError } from '../utils/logger';
import { UserCreatedEventsQuerySchema } from '@shared/schemas';
import type { RequestContext } from '@shared/cloudflare-types';
import type { UserCreatedEventsResponse, UserCreatedEvent } from '@shared/types';

/**
 * ユーザーが作成したイベント履歴を取得するAPI
 * GET /api/user/created-events
 */
export async function onRequest(context: RequestContext): Promise<Response> {
  if (context.request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. 認証チェック（正規ユーザーのみアクセス可能）
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    // 匿名ユーザーはアクセス不可
    if (user.isAnonymous) {
      return errorResponse('正規アカウントでのみアクセス可能です', 403);
    }

    conditionalLog(context.env, 'User created events request from user:', user.id);

    // 2. クエリパラメータのバリデーション（申し込み履歴APIと同じパターン）
    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    };

    const validatedQuery = validateRequest(UserCreatedEventsQuerySchema, queryParams);
    if (isValidationError(validatedQuery)) {
      return validatedQuery;
    }

    // Zodが自動的にデフォルト値を設定
    const { limit, offset } = validatedQuery;

    conditionalLog(context.env, 'Query parameters:', { limit, offset });

    const client = getDbClient(context.env);

    // 3. ユーザーが作成したイベント履歴を取得
    const createdEventsResult = await client.execute({
      sql: `
        SELECT *
        FROM events
        WHERE creator_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [user.id, String(limit), String(offset)]
    });

    conditionalLog(context.env, 'Found created events:', createdEventsResult.rows.length);

    if (createdEventsResult.rows.length === 0) {
      // 作成履歴がない場合は空配列を返す
      const response: UserCreatedEventsResponse = {
        createdEvents: []
      };
      return jsonResponse(response);
    }

    // 4. 各イベントの参加者数を取得（申し込み履歴APIと同じパターン）
    const eventIds = createdEventsResult.rows.map(row => String(row.id));
    const placeholders = eventIds.map(() => '?').join(',');
    
    const attendeesResult = await client.execute({
      sql: `SELECT event_id, COUNT(*) as count FROM attendees WHERE event_id IN (${placeholders}) GROUP BY event_id`,
      args: eventIds
    });

    // 参加者数をマッピング
    const attendeesMap = new Map<string, number>();
    for (const row of attendeesResult.rows) {
      const eventId = String(row.event_id);
      attendeesMap.set(eventId, Number(row.count));
    }

    // 5. データを UserCreatedEvent 型に変換
    const createdEvents: UserCreatedEvent[] = createdEventsResult.rows.map(row => {
      // transformEventRow を使用して安全に型変換
      const event = transformEventRow(row);
      const attendeeCount = attendeesMap.get(event.id) || 0;

      // 編集・削除可能フラグの判定
      const canEdit = true; // 作成者は常に編集可能
      const canDelete = attendeeCount === 0; // 参加者がいない場合のみ削除可能

      // created_at が undefined の場合はデフォルト値を使用
      const createdAt = event.created_at ?? Date.now();

      return {
        id: event.id,
        event: {
          ...event,
          attendees: attendeeCount // 参加者数を含める
        },
        created_at: createdAt,
        attendee_count: attendeeCount,
        can_edit: canEdit,
        can_delete: canDelete,
      };
    });

    // 6. UserCreatedEventsResponse 形式で返す
    const response: UserCreatedEventsResponse = {
      createdEvents
    };

    conditionalLog(context.env, 'User created events retrieved successfully:', {
      userEmail: user.email,
      createdEventCount: createdEvents.length,
      canDeleteCount: createdEvents.filter(e => e.can_delete).length
    });

    return jsonResponse(response);

  } catch (error) {
    conditionalError(context.env, 'Error fetching user created events:', error);
    return errorResponse('作成イベント履歴の取得中にエラーが発生しました', 500);
  }
}