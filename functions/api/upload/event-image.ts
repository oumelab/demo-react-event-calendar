// functions/api/upload/event-image.ts
import { getCurrentUser } from '../utils/auth';
import { errorResponse, successResponse } from '../utils/response';
import { uploadImageToR2, deleteImageFromR2 } from '../utils/image-upload';
import { getDbClient } from '../utils/db';
import { transformEventRow } from '../utils/data';
import type { RequestContext } from '@shared/cloudflare-types';
import type { Event } from '@shared/types';

/**
 * イベント画像URLからR2キーを抽出するヘルパー関数
 */
function extractEventImageKey(imageUrl: string): string | null {
  if (!imageUrl.includes('events/')) {
    return null;
  }
  const keyMatch = imageUrl.match(/events\/[^/]+\/[^/]+$/);
  return keyMatch ? keyMatch[0] : null;
}

/**
 * イベントの所有者チェック
 */
async function validateEventOwnership(
  eventId: string,
  userId: string,
  client: ReturnType<typeof getDbClient>
): Promise<{ 
  success: boolean; 
  error?: string; 
  event?: Event 
}> {
  try {
    const eventResult = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId ?? null]
    });

    if (eventResult.rows.length === 0) {
      return { success: false, error: 'イベントが見つかりません。' };
    }

    const eventRow = eventResult.rows[0];
    if (eventRow.creator_id !== userId) {
      return { success: false, error: 'このイベントの画像を編集する権限がありません。' };
    }

    return { 
      success: true, 
      event: transformEventRow(eventRow) 
    };
  } catch (error) {
    console.error('Event ownership validation error:', error);
    return { success: false, error: 'イベント情報の取得に失敗しました。' };
  }
}

/**
 * イベント画像アップロードAPI
 * POST /api/upload/event-image
 * 
 * Body: FormData
 * - file: File (必須)
 * - eventId: string (必須)
 * 
 * 特徴:
 * - イベント作成者のみ画像変更可能
 * - 古いイベント画像の自動削除
 * - events テーブルの image_url フィールド更新
 */
export async function onRequestPost(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // 匿名ユーザーのチェック
    if (user.isAnonymous) {
      return errorResponse('イベント画像の設定にはアカウント登録が必要です。', 403);
    }

    // Content-Type確認
    const contentType = context.request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return errorResponse('FormDataでのリクエストが必要です。', 400);
    }

    // FormDataの解析
    let formData: FormData;
    try {
      formData = await context.request.formData();
    } catch (error) {
      console.error('FormData parsing error:', error);
      return errorResponse('リクエストデータの解析に失敗しました。', 400);
    }

    // ファイルの取得と検証
    const fileEntry = formData.get('file');
    if (!fileEntry) {
      return errorResponse('イベント画像が選択されていません。', 400);
    }
    
    if (typeof fileEntry === 'string') {
      return errorResponse('ファイルではなく文字列が送信されました。', 400);
    }
    
    const file = fileEntry as File;

    // イベントIDの取得と検証
    const eventId = formData.get('eventId') as string;
    if (!eventId) {
      return errorResponse('イベントIDが指定されていません。', 400);
    }

    // データベース接続
    const client = getDbClient(context.env);

    // イベントの所有者チェック
    const ownershipCheck = await validateEventOwnership(eventId, user.id, client);
    if (!ownershipCheck.success) {
      return errorResponse(ownershipCheck.error!, 403);
    }

    const event = ownershipCheck.event;
    if (!event) {
      return errorResponse('イベント情報の取得に失敗しました。', 500);
    }

    // 現在のイベント画像キーを取得（古い画像削除用）
    let currentImageKey: string | null = null;
    if (event.image_url) {
      currentImageKey = extractEventImageKey(event.image_url);
    }

    // R2に新しいイベント画像をアップロード
    const uploadResult = await uploadImageToR2(
      file,
      'event',
      user.id,
      context.env
    );

    if (!uploadResult.success) {
      return errorResponse(uploadResult.error || 'イベント画像のアップロードに失敗しました。', 500);
    }

    // events テーブルの image_url を更新
    try {
      await client.execute({
        sql: 'UPDATE events SET image_url = ? WHERE id = ?',
        args: [uploadResult.url ?? null, eventId ?? null]
      });
    } catch (error) {
      console.error('Failed to update event image_url in database:', error);
      
      // データベース更新に失敗した場合、アップロードした画像を削除
      if (uploadResult.key) {
        await deleteImageFromR2(uploadResult.key, context.env);
      }
      
      return errorResponse('イベント画像情報の更新に失敗しました。', 500);
    }

    // 古いイベント画像を削除（非同期で実行、エラーでも処理は継続）
    if (currentImageKey && currentImageKey !== uploadResult.key) {
      deleteImageFromR2(currentImageKey, context.env).catch(error => {
        console.error('Failed to delete old event image:', error);
        // エラーログのみ、処理は継続
      });
    }

    // 更新されたイベント情報を取得
    const updatedEventResult = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId ?? null]
    });

    const updatedEvent = updatedEventResult.rows.length > 0 
      ? transformEventRow(updatedEventResult.rows[0])
      : null;

    // 成功レスポンス
    return successResponse({
      message: 'イベント画像が更新されました。',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        fileName: file.name,
        fileSize: file.size,
        eventId: eventId,
        userId: user.id,
        previousImage: currentImageKey ? 'deleted' : 'none',
        event: updatedEvent
      }
    });

  } catch (error) {
    console.error('Event image upload API error:', error);
    return errorResponse('サーバーエラーが発生しました。', 500);
  }
}

/**
 * イベント画像情報取得API
 * GET /api/upload/event-image?eventId=xxx
 */
export async function onRequestGet(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // クエリパラメータからイベントIDを取得
    const url = new URL(context.request.url);
    const eventId = url.searchParams.get('eventId');
    
    if (!eventId) {
      return errorResponse('イベントIDが指定されていません。', 400);
    }

    // データベース接続
    const client = getDbClient(context.env);

    // イベントの所有者チェック
    const ownershipCheck = await validateEventOwnership(eventId, user.id, client);
    if (!ownershipCheck.success) {
      return errorResponse(ownershipCheck.error!, 403);
    }

    const event = ownershipCheck.event;
    if (!event) {
      return errorResponse('イベント情報の取得に失敗しました。', 500);
    }
    
    const imageUrl = event.image_url;

    // イベント画像情報のレスポンス
    return successResponse({
      message: imageUrl ? 'イベント画像情報を取得しました。' : 'イベント画像は設定されていません。',
      data: {
        eventId: eventId,
        hasImage: !!imageUrl,
        url: imageUrl,
        event: transformEventRow(event),
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Event image info API error:', error);
    return errorResponse('イベント画像情報の取得に失敗しました。', 500);
  }
}

/**
 * イベント画像削除API
 * DELETE /api/upload/event-image
 * 
 * Body: JSON
 * - eventId: string (必須)
 */
export async function onRequestDelete(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // 匿名ユーザーのチェック
    if (user.isAnonymous) {
      return errorResponse('イベント画像の削除にはアカウント登録が必要です。', 403);
    }

    // リクエストボディの解析
    let requestBody: Record<string, unknown>;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return errorResponse('無効なJSONリクエストです。', 400);
    }

    // イベントIDの取得と検証
    const { eventId } = requestBody;
    if (!eventId || typeof eventId !== 'string') {
      return errorResponse('イベントIDを指定してください。', 400);
    }

    // データベース接続
    const client = getDbClient(context.env);

    // イベントの所有者チェック
    const ownershipCheck = await validateEventOwnership(eventId, user.id, client);
    if (!ownershipCheck.success) {
      return errorResponse(ownershipCheck.error!, 403);
    }

    const event = ownershipCheck.event;
    if (!event) {
      return errorResponse('イベント情報の取得に失敗しました。', 500);
    }
    
    const currentImageUrl = event.image_url;

    if (!currentImageUrl) {
      return errorResponse('削除するイベント画像がありません。', 400);
    }

    // R2のキーを抽出
    const imageKey = extractEventImageKey(currentImageUrl);

    // events テーブルの image_url を NULL に更新
    try {
      await client.execute({
        sql: 'UPDATE events SET image_url = NULL WHERE id = ?',
        args: [eventId ?? null]
      });
    } catch (error) {
      console.error('Failed to update event image_url in database:', error);
      return errorResponse('イベント画像情報の更新に失敗しました。', 500);
    }

    // R2から画像を削除
    if (imageKey) {
      const deleteResult = await deleteImageFromR2(imageKey, context.env);
      if (!deleteResult.success) {
        console.error('Failed to delete event image from R2:', deleteResult.error);
        // データベースは既に更新済みなので、警告ログのみ
      }
    }

    // 更新されたイベント情報を取得
    const updatedEventResult = await client.execute({
      sql: 'SELECT * FROM events WHERE id = ?',
      args: [eventId ?? null]
    });

    const updatedEvent = updatedEventResult.rows.length > 0 
      ? transformEventRow(updatedEventResult.rows[0])
      : null;

    // 成功レスポンス
    return successResponse({
      message: 'イベント画像が削除されました。',
      data: {
        eventId: eventId,
        deletedUrl: currentImageUrl,
        deletedKey: imageKey,
        userId: user.id,
        event: updatedEvent
      }
    });

  } catch (error) {
    console.error('Event image deletion API error:', error);
    return errorResponse('サーバーエラーが発生しました。', 500);
  }
}