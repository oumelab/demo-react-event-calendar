// functions/api/events/[id]/apply.ts - イベント申し込みAPI
import { getDbClient } from '../../utils/db';
import { jsonResponse, errorResponse } from '../../utils/response';
import { getCurrentUser } from '../../utils/auth';
import { transformEventRow } from '../../utils/data';
import { transformAttendeeRow } from '../../utils/auth-data';
import { validateRequest, isValidationError } from '../../utils/validation';
import { EventApplySchema } from '../../../../shared/schemas';
import { conditionalLog, conditionalError } from '../../utils/logger';
import { createId } from '@paralleldrive/cuid2'; // 🆕 CUID2 使用
import type { RequestContext } from '../../../../shared/cloudflare-types';
import type { EventApplyResponse, EventRegistration } from '../../../../shared/types';
import { parseDateTimeString } from '../../../../shared/utils';


export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. 認証チェック（ログイン済みユーザーのみ）
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    conditionalLog(context.env, 'Event apply attempt by user:', user.id);

    // 2. イベントIDを取得
    const url = new URL(context.request.url);
    const eventId = url.pathname.split('/').slice(-2, -1)[0]; // events/[id]/apply から [id] を取得

    if (!eventId) {
      return errorResponse('イベントIDが指定されていません', 400);
    }

    // 3. リクエストボディのバリデーション（将来拡張用）
    const body = await context.request.json().catch(() => ({}));
    const validatedData = validateRequest(EventApplySchema, body);
    if (isValidationError(validatedData)) {
      return validatedData;
    }

    const client = getDbClient(context.env);

    // 4. イベント存在確認と情報取得
    const eventResult = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId]
    });

    if (eventResult.rows.length === 0) {
      return errorResponse('指定されたイベントが見つかりません', 404);
    }

    const event = transformEventRow(eventResult.rows[0]);
    conditionalLog(context.env, 'Event found:', { id: event.id, title: event.title });

    // 5. 重複申し込みチェック（同一ユーザーの重複申し込み防止）
    const existingRegistration = await client.execute({
      sql: 'SELECT id FROM attendees WHERE event_id = ? AND user_id = ?',
      args: [eventId, user.id]
    });

    if (existingRegistration.rows.length > 0) {
      return errorResponse('すでにこのイベントに申し込み済みです', 400);
    }

    // 6. 🆕 申し込み可能期間チェック（イベント開始前のみ）
    try {
      const eventDateTime = parseDateTimeString(event.date);
      const now = new Date();

      if (eventDateTime <= now) {
        return errorResponse('イベント開始後の申し込みはできません', 400);
      }

      conditionalLog(context.env, 'Event registration period check passed:', {
        eventDate: event.date,
        parsedDate: eventDateTime.toISOString(),
        currentTime: now.toISOString()
      });
    } catch (error) {
      conditionalError(context.env, 'Date parsing error in apply API:', error);
      // パースエラーの場合は安全側に倒して申し込みを許可
      conditionalLog(context.env, 'Date parsing failed, allowing registration by default');
    }


    // 7. 定員チェック（満員の場合エラー）
    if (event.capacity) {
      const attendeeCountResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM attendees WHERE event_id = ?',
        args: [eventId]
      });

      const currentAttendees = Number(attendeeCountResult.rows[0].count);
      
      if (currentAttendees >= event.capacity) {
        return errorResponse(`このイベントは満員です（定員：${event.capacity}人）`, 400);
      }

      conditionalLog(context.env, 'Capacity check passed:', {
        current: currentAttendees,
        capacity: event.capacity
      });
    }

    // 8. attendeesテーブルへのレコード挿入
    // 🆕 CUID2 使用（既存パターンと統一）
    const attendeeId = createId();
    const createdAt = Date.now();

    await client.execute({
      sql: `INSERT INTO attendees (id, event_id, email, user_id, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [attendeeId, eventId, user.email, user.id, createdAt]
    });

    conditionalLog(context.env, 'Registration inserted successfully:', {
      attendeeId,
      eventId,
      userId: user.id
    });

    // 9. 🆕 作成された申し込み情報を取得して返却（create.ts パターン）
    const newRegistrationResult = await client.execute({
      sql: 'SELECT * FROM attendees WHERE id = ?',
      args: [attendeeId]
    });

    if (newRegistrationResult.rows.length === 0) {
      conditionalError(context.env, 'Failed to retrieve created registration');
      return errorResponse('申し込み情報の取得に失敗しました', 500);
    }

    // 🆕 transformAttendeeRow を使用して安全に型変換（create.ts パターン）
    const attendeeData = transformAttendeeRow(newRegistrationResult.rows[0]);

    // 🔧 user_id 必須チェック（認証ベース申し込みのため必須）
    if (!attendeeData.user_id) {
      conditionalError(context.env, 'User ID missing in registration data');
      return errorResponse('申し込み処理でエラーが発生しました', 500);
    }

    // 🆕 EventRegistration 型に変換（型安全）
    const registrationData: EventRegistration = {
      id: attendeeData.id,
      event_id: attendeeData.event_id,
      user_id: attendeeData.user_id,
      email: attendeeData.email,
      created_at: attendeeData.created_at,
    };

    // 10. 🆕 EventApplyResponse 形式で返す（create.ts パターン）
    const response: EventApplyResponse = {
      success: true,
      message: 'イベントに申し込みました',
      registration: registrationData  // 🎯 型安全な代入
    };

    conditionalLog(context.env, 'Event application successful:', {
      eventTitle: event.title,
      userEmail: user.email,
      registrationId: registrationData.id
    });

    return jsonResponse(response);

  } catch (error) {
    conditionalError(context.env, 'Error applying to event:', error);
    return errorResponse('イベントの申し込み中にエラーが発生しました', 500);
  }
}