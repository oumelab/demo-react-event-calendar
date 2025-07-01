// functions/api/user/registrations.ts - ユーザー申し込み履歴API（修正版）
import { getDbClient } from '../utils/db';
import { jsonResponse, errorResponse } from '../utils/response';
import { getCurrentUser } from '../utils/auth';
import { transformEventRow } from '../utils/data';
import { transformAttendeeRow } from '../utils/auth-data';
import { validateRequest, isValidationError } from '../utils/validation';
import { UserRegistrationsQuerySchema } from '../../../shared/schemas';
import { conditionalLog, conditionalError } from '../utils/logger';
import type { RequestContext } from '../../../shared/cloudflare-types';
import type { UserRegistrationsResponse, UserRegistration } from '../../../shared/types';
import type { Env } from '../../../shared/cloudflare-types';

/**
 * 日本語形式の日時文字列をDateオブジェクトに変換
 * @param dateTimeStr "2025年9月6日20:00" 形式の文字列
 * @returns Date オブジェクト
 */
function parseDateTimeString(dateTimeStr: string): Date {
  if (!dateTimeStr) {
    throw new Error('Date string is empty');
  }
  
  // "2025年9月6日20:00" 形式をパース
  const match = dateTimeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/);
  
  if (!match) {
    throw new Error(`Invalid date format: ${dateTimeStr}`);
  }
  
  const [, year, month, day, hours, minutes] = match;
  
  // 日本時間でDateオブジェクト作成
  const date = new Date();
  date.setFullYear(parseInt(year, 10));
  date.setMonth(parseInt(month, 10) - 1); // 月は0ベース
  date.setDate(parseInt(day, 10));
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  date.setSeconds(0);
  date.setMilliseconds(0);
  
  return date;
}

/**
 * キャンセル可能かどうかを判定
 * @param eventDate イベント開催日時（日本語形式文字列）
 * @returns boolean キャンセル可能かどうか
 */
function canCancelRegistration(eventDate: string, env: Env): boolean {
  try {
    const eventDateTime = parseDateTimeString(eventDate);
    const now = new Date();
    return eventDateTime > now; // イベント開始前なら true
  } catch (error) {
    // パースエラーの場合は安全側に倒してキャンセル可能とする
    conditionalError(env, 'Date parsing error in canCancelRegistration:', error);
    conditionalLog(env, 'Falling back to allowing cancellation due to date parse error');
    return true;
  }
}

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. 認証チェック（ログイン済みユーザーのみ）
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    conditionalLog(context.env, 'User registrations request from user:', user.id);

    // 2. クエリパラメータのバリデーション（Zod使用で統一性確保）
    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    };

    const validatedQuery = validateRequest(UserRegistrationsQuerySchema, queryParams);
    if (isValidationError(validatedQuery)) {
      return validatedQuery;
    }

    // Zodが自動的にデフォルト値を設定
    const { limit, offset } = validatedQuery;

    conditionalLog(context.env, 'Query parameters:', { limit, offset });

    const client = getDbClient(context.env);

    // 🔧 修正: 既存パターンに合わせて、別々のクエリで取得
    // 3. ユーザーの申し込み履歴取得（attendees情報のみ）
    const registrationsResult = await client.execute({
      sql: `
        SELECT 
          a.id as attendee_id,
          a.event_id,
          a.email as attendee_email,
          a.user_id,
          a.created_at as registered_at
        FROM attendees a
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [user.id, String(limit), String(offset)]
    });

    conditionalLog(context.env, 'Found registrations:', registrationsResult.rows.length);

    if (registrationsResult.rows.length === 0) {
      // 申し込み履歴がない場合は空配列を返す
      const response: UserRegistrationsResponse = {
        registrations: []
      };
      return jsonResponse(response);
    }

    // 4. イベント情報を取得（申し込み済みイベントのみ）
    const eventIds = registrationsResult.rows.map(row => String(row.event_id));
    const placeholders = eventIds.map(() => '?').join(',');
    
    const eventsResult = await client.execute({
      sql: `SELECT * FROM events WHERE id IN (${placeholders})`,
      args: eventIds
    });

    // 🔧 修正: 各イベントの参加者数を取得（既存パターンと同じ）
    const attendeesResult = await client.execute(
      'SELECT event_id, COUNT(*) as count FROM attendees GROUP BY event_id'
    );

    // 参加者数をマッピング（既存パターンと同じ）
    const attendeesMap = new Map<string, number>();
    for (const row of attendeesResult.rows) {
      const eventId = String(row.event_id);
      attendeesMap.set(eventId, Number(row.count));
    }

    // イベント情報をマッピング
    const eventsMap = new Map();
    for (const eventRow of eventsResult.rows) {
      const event = transformEventRow(eventRow);
      const attendees = attendeesMap.get(event.id) || 0; // 🔧 参加者数を追加
      eventsMap.set(event.id, {
        ...event,
        attendees // 既存パターンと同じように参加者数を含める
      });
    }

    // 5. データを UserRegistration 型に変換
    const registrations: UserRegistration[] = registrationsResult.rows.map(row => {
      // 申し込み情報を再構築
      const attendeeData = {
        id: row.attendee_id,
        event_id: row.event_id,
        email: row.attendee_email,
        user_id: row.user_id,
        created_at: row.registered_at,
      };

      // transformAttendeeRow を使用して安全に型変換
      const attendee = transformAttendeeRow(attendeeData);

      // イベント情報を取得
      const event = eventsMap.get(String(row.event_id));
      if (!event) {
        conditionalError(context.env, 'Event not found for registration:', row.event_id);
        throw new Error(`Event not found: ${row.event_id}`);
      }

      // キャンセル可能フラグの判定
      const canCancel = canCancelRegistration(event.date, context.env);

      return {
        id: attendee.id,
        event, // 既に参加者数を含んでいる
        registered_at: attendee.created_at,
        can_cancel: canCancel,
      };
    });

    // 6. UserRegistrationsResponse 形式で返す
    const response: UserRegistrationsResponse = {
      registrations
    };

    conditionalLog(context.env, 'User registrations retrieved successfully:', {
      userEmail: user.email,
      registrationCount: registrations.length,
      canCancelCount: registrations.filter(r => r.can_cancel).length
    });

    return jsonResponse(response);

  } catch (error) {
    conditionalError(context.env, 'Error fetching user registrations:', error);
    return errorResponse('申し込み履歴の取得中にエラーが発生しました', 500);
  }
}