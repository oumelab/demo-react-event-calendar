import { createId } from '@paralleldrive/cuid2';
import type { RequestContext } from '../../../shared/cloudflare-types';
import { CreateEventSchema } from '../../../shared/schemas';
import type { EventOperationResponse } from '../../../shared/types';
import { getCurrentUser } from '../utils/auth';
import { transformEventRow } from '../utils/data';
import { getDbClient } from '../utils/db';
import { errorResponse, jsonResponse } from '../utils/response';
import { isValidationError, validateRequest } from '../utils/validation';
import { uploadImageToR2, deleteImageFromR2 } from '../utils/image-upload';


export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let uploadedImageKey: string | null = null; // ロールバック用

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

    // Content-Typeによる分岐処理
    const contentType = context.request.headers.get('Content-Type');
    
    let eventData: unknown;
    let imageFile: File | null = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // FormData処理新旧対応)
      console.log('Processing FormData request for event creation');
      
      try {
        const formData = await context.request.formData();
        
        // イベントデータをJSONで取得
        const eventDataString = formData.get('eventData') as string;
        if (!eventDataString) {
          return errorResponse('イベントデータが含まれていません。', 400);
        }
        
        eventData = JSON.parse(eventDataString);
        
        // 画像ファイルを取得 (オプション)
        const fileEntry = formData.get('imageFile');
        if (fileEntry && typeof fileEntry !== 'string') {
          imageFile = fileEntry as File;
          console.log('Image file detected:', imageFile.name, imageFile.size);
        }
        
      } catch (error) {
        console.error('FormData parsing error:', error);
        return errorResponse('フォームデータの解析に失敗しました。', 400);
      }
      
    } else {
      // 既存のJSON処理方式
      try {
        eventData = await context.request.json();
      } catch (error) {
        console.error('JSON parsing error:', error);
        return errorResponse('無効なJSONデータです。', 400);
      }
    }
    
    // 🆕 Zodバリデーション使用
    const validatedData = validateRequest(CreateEventSchema, eventData);
    if (isValidationError(validatedData)) {
      return validatedData; // バリデーションエラーレスポンスをそのまま返す
    }

    const { title, date, location, description, capacity } = validatedData;

    const client = getDbClient(context.env);
    const eventId = createId();
    
    // 画像処理（FormData画像またはURL画像）
    let finalImageUrl: string | null = null;
    
    try {
      if (imageFile) {
        // FormDataで送信された画像ファイルをアップロード
        console.log('Uploading FormData image file...');
        const uploadResult = await uploadImageToR2(imageFile, 'event', user.id, context.env);
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url!;
          uploadedImageKey = uploadResult.key!;
          console.log('FormData image uploaded successfully:', finalImageUrl);
        } else {
          return errorResponse(`画像アップロードに失敗: ${uploadResult.error}`, 400);
        }
      }
      // 外部URL機能は廃止されたため、image_urlがある場合は無視
      
    } catch (error) {
      console.error('Image processing error:', error);
      return errorResponse('画像の処理中にエラーが発生しました。', 500);
    }

    // イベント作成（画像URL込み）
    try {
      await client.execute({
        sql: `INSERT INTO events (id, title, date, location, description, image_url, capacity, creator_id) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          eventId,
          title,
          date,
          location,
          description || '',
          finalImageUrl || null,
          capacity || null,
          user.id
        ]
      });
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      
      // データベースエラー時は画像をクリーンアップ
      if (uploadedImageKey) {
        console.log('Rolling back uploaded image:', uploadedImageKey);
        await deleteImageFromR2(uploadedImageKey, context.env).catch(cleanupError => {
          console.error('Failed to cleanup uploaded image:', cleanupError);
        });
      }
      
      throw dbError; // 元のエラーを再throw
    }

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
      message: `イベント「${createdEvent.title}」が作成されました${finalImageUrl ? '（画像付き）' : ''}`,
      eventId,
      event: createdEvent
    };

    console.log('Event created successfully:', {
      eventId,
      title: createdEvent.title,
      hasImage: !!finalImageUrl,
      imageUrl: finalImageUrl
    });

    return jsonResponse(response, 201);

  } catch (error) {
    console.error('Error creating event:', error);
    
    // エラー時の画像クリーンアップ（念のため）
    if (uploadedImageKey) {
      console.log('Cleaning up uploaded image due to error:', uploadedImageKey);
      await deleteImageFromR2(uploadedImageKey, context.env).catch(cleanupError => {
        console.error('Failed to cleanup image after error:', cleanupError);
      });
    }
    
    // 🔧 エラーも EventOperationResponse 形式で返す
    const errorResponse: EventOperationResponse = {
      success: false,
      message: 'イベントの作成中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return jsonResponse(errorResponse, 500);
  }
}