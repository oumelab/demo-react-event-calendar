// functions/api/events/[id]/cancel.ts - イベントキャンセルAPI
import { getDbClient } from '../../utils/db';
import { jsonResponse, errorResponse } from '../../utils/response';
import { getCurrentUser } from '../../utils/auth';
import { transformEventRow } from '../../utils/data';
import { transformAttendeeRow } from '../../utils/auth-data';
import { validateRequest, isValidationError } from '../../utils/validation';
import { EventCancelSchema } from '../../../../shared/schemas';
import { conditionalLog, conditionalError } from '../../utils/logger';
import type { RequestContext } from '../../../../shared/cloudflare-types';
import type { EventCancelResponse } from '../../../../shared/types';
import { parseDateTimeString } from '../../../../shared/utils';


export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'DELETE') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. 認証チェック（ログイン済みユーザーのみ）
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    conditionalLog(context.env, 'Event cancel attempt by user:', user.id);

    // 2. イベントIDを取得
    const url = new URL(context.request.url);
    const eventId = url.pathname.split('/').slice(-2, -1)[0]; // events/[id]/cancel から [id] を取得

    if (!eventId) {
      return errorResponse('イベントIDが指定されていません', 400);
    }

    // 3. リクエストボディのバリデーション（将来拡張用：キャンセル理由等）
    const body = await context.request.json().catch(() => ({}));
    const validatedData = validateRequest(EventCancelSchema, body);
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
    conditionalLog(context.env, 'Event found for cancellation:', { id: event.id, title: event.title });

    // 5. 申し込み存在確認（申し込み者本人のみキャンセル可能）
    const registrationResult = await client.execute({
      sql: 'SELECT * FROM attendees WHERE event_id = ? AND user_id = ?',
      args: [eventId, user.id]
    });

    if (registrationResult.rows.length === 0) {
      return errorResponse('このイベントに申し込みをしていません', 400);
    }

    const registrationData = transformAttendeeRow(registrationResult.rows[0]);
    conditionalLog(context.env, 'Registration found:', { registrationId: registrationData.id });

    // 6. キャンセル可能期間チェック（イベント開始前のみ）
    try {
      const eventDateTime = parseDateTimeString(event.date);
      const now = new Date();

      if (eventDateTime <= now) {
        return errorResponse('イベント開始後のキャンセルはできません', 400);
      }

      conditionalLog(context.env, 'Cancellation period check passed:', {
        eventDate: event.date,
        parsedDate: eventDateTime.toISOString(),
        currentTime: now.toISOString()
      });
    } catch (error) {
      conditionalError(context.env, 'Date parsing error:', error);
      // パースエラーの場合は安全側に倒してキャンセルを許可
      conditionalLog(context.env, 'Date parsing failed, allowing cancellation by default');
    }

    // 7. attendeesテーブルからのレコード削除
    await client.execute({
      sql: 'DELETE FROM attendees WHERE id = ?',
      args: [registrationData.id]
    });

    conditionalLog(context.env, 'Registration deleted successfully:', {
      registrationId: registrationData.id,
      eventId,
      userId: user.id
    });

    // 8. 🆕 EventCancelResponse 形式で返す（apply.ts パターン）
    const response: EventCancelResponse = {
      success: true,
      message: 'イベントの申し込みをキャンセルしました',
      cancelled_registration_id: registrationData.id
    };

    conditionalLog(context.env, 'Event cancellation successful:', {
      eventTitle: event.title,
      userEmail: user.email,
      cancelledRegistrationId: registrationData.id
    });

    return jsonResponse(response);

  } catch (error) {
    conditionalError(context.env, 'Error cancelling event registration:', error);
    return errorResponse('イベントのキャンセル中にエラーが発生しました', 500);
  }
}