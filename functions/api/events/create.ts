import { getDbClient } from '../utils/db';
import { getCurrentUser } from '../utils/auth';
import { validateEventData } from '../utils/event-validation';
import { jsonResponse, errorResponse } from '../utils/response';
import type { RequestContext } from '@shared/cloudflare-types';
import type { CreateEventRequest } from '@shared/types';
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

    const body: CreateEventRequest = await context.request.json();
    
    // バリデーション
    const validationErrors = validateEventData(body);
    if (validationErrors.length > 0) {
      return errorResponse(validationErrors.join(', '), 400);
    }

    const client = getDbClient(context.env);
    const eventId = createId();

    // イベント作成
    await client.execute({
      sql: `INSERT INTO events (id, title, date, location, description, image_url, capacity, creator_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        eventId,
        body.title,
        body.date,
        body.location,
        body.description || '',
        body.image_url || null,
        body.capacity || null,
        user.id
      ]
    });

    return jsonResponse({ 
      message: 'イベントが作成されました',
      eventId,
      event: {
        id: eventId,
        ...body,
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