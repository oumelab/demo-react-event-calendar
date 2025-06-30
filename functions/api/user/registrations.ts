// functions/api/user/registrations.ts - ユーザー申し込み履歴API
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

    // 3. ユーザーの申し込み履歴取得（JOINクエリでイベント情報も取得）
    const registrationsResult = await client.execute({
      sql: `
        SELECT 
          a.id as attendee_id,
          a.event_id,
          a.email as attendee_email,
          a.user_id,
          a.created_at as registered_at,
          e.id as event_id,
          e.title as event_title,
          e.date as event_date,
          e.location as event_location,
          e.description as event_description,
          e.image_url as event_image_url,
          e.capacity as event_capacity,
          e.created_at as event_created_at,
          e.creator_id as event_creator_id
        FROM attendees a
        JOIN events e ON a.event_id = e.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [user.id, String(limit), String(offset)]
    });

    conditionalLog(context.env, 'Found registrations:', registrationsResult.rows.length);

    // 4. データを UserRegistration 型に変換
    const registrations: UserRegistration[] = registrationsResult.rows.map(row => {
      // イベント情報を再構築
      const eventData = {
        id: row.event_id,
        title: row.event_title,
        date: row.event_date,
        location: row.event_location,
        description: row.event_description,
        image_url: row.event_image_url,
        capacity: row.event_capacity,
        created_at: row.event_created_at,
        creator_id: row.event_creator_id,
      };

      // transformEventRow を使用して安全に型変換
      const event = transformEventRow(eventData);

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

      // キャンセル可能フラグの判定
      const canCancel = canCancelRegistration(event.date, context.env);

      return {
        id: attendee.id,
        event,
        registered_at: attendee.created_at,
        can_cancel: canCancel,
      };
    });

    // 5. 🆕 UserRegistrationsResponse 形式で返す（既存パターン）
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