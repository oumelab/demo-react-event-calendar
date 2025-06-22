import { getDbClient } from '../utils/db';
import { getCurrentUser } from '../utils/auth';
import { validateRequest, isValidationError } from '../utils/validation';
import { CreateEventSchema } from '../../../shared/schemas';
import { jsonResponse, errorResponse } from '../utils/response';
import type { RequestContext } from '../../../shared/cloudflare-types';
import { createId } from '@paralleldrive/cuid2';

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

    return jsonResponse({ 
      message: 'イベントが作成されました',
      eventId,
      event: {
        id: eventId,
        title,
        date,
        location,
        description: description || '',
        image_url: image_url || undefined,
        capacity: capacity || undefined,
        creator_id: user.id,
        attendees: 0,
        created_at: Math.floor(Date.now() / 1000)
      }
    }, 201);

  } catch (error) {
    console.error('Error creating event:', error);
    return errorResponse('イベントの作成中にエラーが発生しました', 500);
  }
}