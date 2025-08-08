import {validateRequest, isValidationError} from "../../utils/validation";
import {UpdateEventSchema} from "../../../../shared/schemas";
import {validateEventAccess, isEventAuthError} from "../../utils/event-auth";
import {jsonResponse, errorResponse} from "../../utils/response";
import type {RequestContext} from "../../../../shared/cloudflare-types";
import type {EventOperationResponse} from "../../../../shared/types";
import { transformEventRow } from "functions/api/utils/data";
import { uploadImageToR2, deleteImageFromR2 } from "../../utils/image-upload";


/**
 * 既存画像キーの抽出ヘルパー
 */
function extractImageKeyFromUrl(imageUrl: string | null): string | null {
  if (!imageUrl || (!imageUrl.includes('events/') && !imageUrl.startsWith('events/'))) {
    return null;
  }
  
  // R2 URLからキーを抽出
  const keyMatch = imageUrl.match(/events\/[^/]+\/[^/?#]+/);
  return keyMatch ? keyMatch[0] : null;
}

export async function onRequest(context: RequestContext) {
  if (context.request.method !== "PUT") {
    return errorResponse("Method not allowed", 405);
  }

  let uploadedImageKey: string | null = null; // ロールバック用
  let oldImageKey: string | null = null; // 既存画像削除用

  try {
    // 🆕：3行で同じ処理！
    const authResult = await validateEventAccess(context, "edit");
    if (isEventAuthError(authResult)) {
      return authResult;
    }

    const {event, eventId, client, user} = authResult;

    // Content-Typeによる分岐処理（create.tsと同様）
    const contentType = context.request.headers.get('Content-Type');
    
    let eventData: unknown;
    let imageFile: File | null = null;
    
    if (contentType?.includes('multipart/form-data')) {
      // FormData処理
      console.log('Processing FormData request for event update');
      
      try {
        const formData = await context.request.formData();
        
        const eventDataString = formData.get('eventData') as string;
        if (!eventDataString) {
          return errorResponse('イベントデータが含まれていません。', 400);
        }
        
        eventData = JSON.parse(eventDataString);
        
        const fileEntry = formData.get('imageFile');
        if (fileEntry && typeof fileEntry !== 'string') {
          imageFile = fileEntry as File;
          console.log('Update: Image file detected:', imageFile.name, imageFile.size);
        }
        
      } catch (error) {
        console.error('FormData parsing error in update:', error);
        return errorResponse('フォームデータの解析に失敗しました。', 400);
      }
      
    } else {
      // 既存のJSON処理
      try {
        eventData = await context.request.json();
      } catch (error) {
        console.error('JSON parsing error in update:', error);
        return errorResponse('無効なJSONデータです。', 400);
      }
    }

    // 🆕 Zodバリデーション使用（UpdateEventSchema = partial）
    const validatedData = validateRequest(UpdateEventSchema, eventData);
    if (isValidationError(validatedData)) {
      return validatedData;
    }

    const {title, date, location, description, capacity} = validatedData;

    // 空の更新チェック（画像のみの更新は除く）
    if (Object.keys(validatedData).length === 0 && !imageFile) {
      return jsonResponse({
        success: true,
        message: "更新する項目がありませんでした",
        eventId,
        event: event,
      });
    }

    // 既存画像のキーを取得（削除用）
    oldImageKey = extractImageKeyFromUrl(event.image_url ?? null);
    
    // 画像処理（FormData画像またはURL画像）
    let finalImageUrl: string | null = null;
    let imageChanged = false;
    
    try {
      if (imageFile) {
        // FormDataで送信された画像ファイルをアップロード
        console.log('Uploading new image file for event update...');
        const uploadResult = await uploadImageToR2(imageFile, 'event', user.id, context.env);
        
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url!;
          uploadedImageKey = uploadResult.key!;
          imageChanged = true;
          console.log('Update: FormData image uploaded successfully:', finalImageUrl);
        } else {
          return errorResponse(`画像アップロードに失敗: ${uploadResult.error}`, 400);
        }
        
      } else if (validatedData.image_url !== undefined) {
        // image_url フィールドが提供された場合
        console.log('Update: image_url provided:', validatedData.image_url, typeof validatedData.image_url);
        if (validatedData.image_url === null) {
          // 画像削除（nullに設定）
          finalImageUrl = null;
          imageChanged = true;
          console.log('Update: Image removal requested - setting to null');
        } else {
          // 画像はURL変更なし
          finalImageUrl = event.image_url ? String(event.image_url) : null;
          console.log('Update: Keeping existing image:', finalImageUrl);
        }
      } else {
        // image_url フィールドが提供されていない場合は既存の画像を維持
        finalImageUrl = event.image_url ? String(event.image_url) : null;
      }
      
    } catch (error) {
      console.error('Image processing error in update:', error);
      return errorResponse('画像の処理中にエラーが発生しました。', 500);
    }

    // イベント更新（画像URL込み）
    console.log('Update: Final image URL value:', finalImageUrl);
    const imageUrlToUpdate = finalImageUrl !== undefined ? finalImageUrl : (event.image_url ? String(event.image_url) : null);
    console.log('Update: Will update image_url to:', imageUrlToUpdate);
    
    try {
      await client.execute({
        sql: `UPDATE events 
              SET title = ?, date = ?, location = ?, description = ?, image_url = ?, capacity = ?
              WHERE id = ?`,
        args: [
          title ?? String(event.title),
          date ?? String(event.date),
          location ?? String(event.location),
          description ?? String(event.description || ""),
          imageUrlToUpdate,
          capacity ?? (event.capacity ? Number(event.capacity) : null),
          eventId,
        ],
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      
      // データベースエラー時は新しくアップロードした画像をクリーンアップ
      if (uploadedImageKey) {
        console.log('Rolling back uploaded image in update:', uploadedImageKey);
        await deleteImageFromR2(uploadedImageKey, context.env).catch(cleanupError => {
          console.error('Failed to cleanup uploaded image in update:', cleanupError);
        });
      }
      
      throw dbError;
    }

    // 更新成功後に古い画像を削除（非同期）
    if (imageChanged && oldImageKey && oldImageKey !== uploadedImageKey) {
      console.log('Cleaning up old image in update:', oldImageKey);
      deleteImageFromR2(oldImageKey, context.env).catch(cleanupError => {
        console.error('Failed to cleanup old image in update:', cleanupError);
        // エラーでも処理は継続
      });
    }

    // 更新後のイベント情報を取得
    const updatedEvent = await client.execute({
      sql: "SELECT * FROM events WHERE id = ?",
      args: [eventId],
    });

    // 🔧 transformEventRow を使用して安全に型変換
    const transformedEvent = transformEventRow(updatedEvent.rows[0]);

    // 🔧 EventOperationResponse 形式で返す
    const response: EventOperationResponse = {
      success: true,
      message: `イベント「${transformedEvent.title}」が更新されました${imageChanged ? '（画像も更新）' : ''}`,
      eventId,
      event: transformedEvent
    };

    console.log('Event updated successfully:', {
      eventId,
      title: transformedEvent.title,
      imageChanged,
      newImageUrl: finalImageUrl,
      oldImageCleaned: imageChanged && oldImageKey ? 'scheduled' : 'none'
    });

    return jsonResponse(response);
  } catch (error) {
    console.error("Error updating event:", error);
    
    // エラー時の画像クリーンアップ（念のため）
    if (uploadedImageKey) {
      console.log('Cleaning up uploaded image due to error in update:', uploadedImageKey);
      await deleteImageFromR2(uploadedImageKey, context.env).catch(cleanupError => {
        console.error('Failed to cleanup image after error in update:', cleanupError);
      });
    }
    
    // 🔧 エラーも EventOperationResponse 形式で返す
    const errorResponse: EventOperationResponse = {
      success: false,
      message: "イベントの更新中にエラーが発生しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return jsonResponse(errorResponse, 500);
  }
}
