import { createId } from '@paralleldrive/cuid2';
import type { RequestContext } from '../../../shared/cloudflare-types';
import { CreateEventSchema } from '../../../shared/schemas';
import type { EventOperationResponse } from '../../../shared/types';
import { getCurrentUser } from '../utils/auth';
import { transformEventRow } from '../utils/data';
import { getDbClient } from '../utils/db';
import { errorResponse, jsonResponse } from '../utils/response';
import { isValidationError, validateRequest } from '../utils/validation';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('認証が必要です', 401);
    }

    // 匿名ユーザー制限を追加
    if (user.isAnonymous) {
      return errorResponse(
        'イベントの作成には正規のアカウント登録が必要です。アカウントを作成してください。', 
        403
      );
    }

    // リクエストボディを取得
    const body = await context.request.json();
    
    // 🆕 Zodバリデーション使用
    const validatedData = validateRequest(CreateEventSchema, body);
    if (isValidationError(validatedData)) {
      return validatedData; // バリデーションエラーレスポンスをそのまま返す
    }

    const { title, date, location, description, image_url, capacity } = validatedData;

    const client = getDbClient(context.env);
    const eventId = createId();

    // イベント作成
    await client.execute({
      sql: `INSERT INTO events (id, title, date, location, description, image_url, capacity, creator_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        eventId,
        title,
        date,
        location,
        description || '',
        image_url || null,
        capacity || null,
        user.id
      ]
    });

    // return jsonResponse({ 
    //   message: 'イベントが作成されました',
    //   eventId,
    //   event: {
    //     id: eventId,
    //     title,
    //     date,
    //     location,
    //     description: description || '',
    //     image_url: image_url || undefined,
    //     capacity: capacity || undefined,
    //     creator_id: user.id,
    //     attendees: 0,
    //     created_at: Math.floor(Date.now() / 1000)
    //   }
    // }, 201);

    // 🆕 作成されたイベントを取得
    const createdEventResult = await client.execute({
      sql: "SELECT * FROM events WHERE id = ?",
      args: [eventId],
    });

    // 🔧 transformEventRow を使用して安全に型変換
    const createdEvent = transformEventRow(createdEventResult.rows[0]);

    // 🔧 EventOperationResponse 形式で返す
    const response: EventOperationResponse = {
      success: true,
      message: 'イベントが作成されました',
      eventId,
      event: createdEvent
    };

    return jsonResponse(response, 201);

  } catch (error) {
    console.error('Error creating event:', error);
    
    // 🔧 エラーも EventOperationResponse 形式で返す
    const errorResponse: EventOperationResponse = {
      success: false,
      message: 'イベントの作成中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return jsonResponse(errorResponse, 500);
  }
}