// functions/api/upload/avatar.ts
import { getCurrentUser } from '../utils/auth';
import { errorResponse, successResponse } from '../utils/response';
import { uploadImageToR2, deleteImageFromR2 } from '../utils/image-upload';
import { getDbClient } from '../utils/db';
import type { RequestContext } from '@shared/cloudflare-types';

/**
 * 画像URLからR2キーを抽出するヘルパー関数
 */
function extractAvatarKey(imageUrl: string): string | null {
  if (!imageUrl.includes('avatars/')) {
    return null;
  }
  const keyMatch = imageUrl.match(/avatars\/[^/]+\/[^/]+$/);
  return keyMatch ? keyMatch[0] : null;
}

//  * POST /api/upload/avatar
//  * 
//  * Body: FormData
//  * - file: File (必須)
//  * 
//  * 特徴:
//  * - ユーザーごとに1つのアバターのみ管理
//  * - 古いアバター画像の自動削除
//  * - Better Auth のユーザーレコード更新
//  */

export async function onRequestPost(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // 匿名ユーザーのチェック
    if (user.isAnonymous) {
      return errorResponse('アバター画像の設定にはアカウント登録が必要です。', 403);
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
      return errorResponse('アバター画像が選択されていません。', 400);
    }
    
    if (typeof fileEntry === 'string') {
      return errorResponse('ファイルではなく文字列が送信されました。', 400);
    }
    
    const file = fileEntry as File;

    // データベース接続
    const client = getDbClient(context.env);

    // 現在のアバター情報を取得（古い画像削除用）
    let currentAvatarKey: string | null = null;
    try {
      const userResult = await client.execute({
        sql: 'SELECT image FROM user WHERE id = ?',
        args: [user.id]
      });

      if (userResult.rows.length > 0 && userResult.rows[0].image) {
        const currentImageUrl = userResult.rows[0].image as string;
        currentAvatarKey = extractAvatarKey(currentImageUrl);
      }
    } catch (error) {
      console.error('Failed to get current avatar:', error);
      // エラーでも処理は継続（古い画像削除はスキップ）
    }

    // R2に新しいアバターをアップロード
    const uploadResult = await uploadImageToR2(
      file,
      'avatar',
      user.id,
      context.env
    );

    if (!uploadResult.success) {
      return errorResponse(uploadResult.error || 'アバターのアップロードに失敗しました。', 500);
    }

    // Better Auth のユーザーレコードを更新
    try {
      await client.execute({
        sql: 'UPDATE user SET image = ?, updatedAt = ? WHERE id = ?',
        args: [uploadResult.url ?? null, Date.now(), user.id ?? null]
      });
    } catch (error) {
      console.error('Failed to update user avatar in database:', error);
      
      // データベース更新に失敗した場合、アップロードした画像を削除
      if (uploadResult.key) {
        await deleteImageFromR2(uploadResult.key, context.env);
      }
      
      return errorResponse('アバター情報の更新に失敗しました。', 500);
    }

    // 古いアバター画像を削除（非同期で実行、エラーでも処理は継続）
    if (currentAvatarKey && currentAvatarKey !== uploadResult.key) {
      deleteImageFromR2(currentAvatarKey, context.env).catch(error => {
        console.error('Failed to delete old avatar:', error);
        // エラーログのみ、処理は継続
      });
    }

    // 成功レスポンス
    return successResponse({
      message: 'アバター画像が更新されました。',
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        fileName: file.name,
        fileSize: file.size,
        userId: user.id,
        previousAvatar: currentAvatarKey ? 'deleted' : 'none'
      }
    });

  } catch (error) {
    console.error('Avatar upload API error:', error);
    return errorResponse('サーバーエラーが発生しました。', 500);
  }
}

/**
 * 現在のアバター画像情報取得API
 * GET /api/upload/avatar
 */
export async function onRequestGet(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // データベースから現在のアバター情報を取得
    const client = getDbClient(context.env);
    const userResult = await client.execute({
      sql: 'SELECT image, updatedAt FROM user WHERE id = ?',
      args: [user.id ?? null]
    });

    if (userResult.rows.length === 0) {
      return errorResponse('ユーザー情報が見つかりません。', 404);
    }

    const userData = userResult.rows[0];
    const avatarUrl = userData.image as string | null;
    const updatedAt = userData.updatedAt as number | null;

    // アバター情報のレスポンス
    return successResponse({
      message: avatarUrl ? 'アバター画像情報を取得しました。' : 'アバター画像は設定されていません。',
      data: {
        hasAvatar: !!avatarUrl,
        url: avatarUrl,
        updatedAt: updatedAt,
        userId: user.id,
        isAnonymous: user.isAnonymous || false
      }
    });

  } catch (error) {
    console.error('Avatar info API error:', error);
    return errorResponse('アバター情報の取得に失敗しました。', 500);
  }
}

/**
 * アバター画像削除API
 * DELETE /api/upload/avatar
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
      return errorResponse('アバター画像の削除にはアカウント登録が必要です。', 403);
    }

    // データベース接続
    const client = getDbClient(context.env);

    // 現在のアバター情報を取得
    const userResult = await client.execute({
      sql: 'SELECT image FROM user WHERE id = ?',
      args: [user.id]
    });

    if (userResult.rows.length === 0) {
      return errorResponse('ユーザー情報が見つかりません。', 404);
    }

    const currentImageUrl = userResult.rows[0].image as string | null;
    if (!currentImageUrl) {
      return errorResponse('削除するアバター画像がありません。', 400);
    }

    // R2のキーを抽出
    const avatarKey = currentImageUrl ? extractAvatarKey(currentImageUrl) : null;

    // Better Auth のユーザーレコードを更新（アバターをnullに）
    try {
      await client.execute({
        sql: 'UPDATE user SET image = NULL, updatedAt = ? WHERE id = ?',
        args: [Date.now(), user.id ?? null]
      });
    } catch (error) {
      console.error('Failed to update user avatar in database:', error);
      return errorResponse('アバター情報の更新に失敗しました。', 500);
    }

    // R2から画像を削除
    if (avatarKey) {
      const deleteResult = await deleteImageFromR2(avatarKey, context.env);
      if (!deleteResult.success) {
        console.error('Failed to delete avatar from R2:', deleteResult.error);
        // データベースは既に更新済みなので、警告ログのみ
      }
    }

    // 成功レスポンス
    return successResponse({
      message: 'アバター画像が削除されました。',
      data: {
        deletedUrl: currentImageUrl,
        deletedKey: avatarKey,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Avatar deletion API error:', error);
    return errorResponse('サーバーエラーが発生しました。', 500);
  }
}