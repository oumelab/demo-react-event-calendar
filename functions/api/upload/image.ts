// functions/api/upload/image.ts
import { getCurrentUser } from '../utils/auth';
import { errorResponse, successResponse } from '../utils/response';
import { uploadImageToR2, deleteImageFromR2 } from '../utils/image-upload';
import type { RequestContext } from '@shared/cloudflare-types';

/**
 * 統合画像アップロードAPI
 * POST /api/upload/image
 * 
 * Body: FormData
 * - file: File (必須) - アップロードする画像ファイル
 * - type: 'avatar' | 'event' (必須) - 画像タイプ
 * 
 * 機能:
 * - ファイルバリデーション (utils/image-upload.ts)
 * - R2ストレージへのアップロード
 * - メタデータ付与と公開URL生成
 */
export async function onRequestPost(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // Content-Type確認（multipart/form-dataを期待）
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
      return errorResponse('リクエストデータの解析に失敗しました。ファイルサイズが大きすぎる可能性があります。', 400);
    }

    // ファイルの取得と検証
    const fileEntry = formData.get('file');
    if (!fileEntry) {
      return errorResponse('画像ファイルが選択されていません。', 400);
    }
    
    // File型かどうかを安全にチェック
    if (typeof fileEntry === 'string') {
      return errorResponse('ファイルではなく文字列が送信されました。', 400);
    }
        
    // この時点で fileEntry は File型
    const file = fileEntry as File;

    // タイプの取得と検証
    const type = formData.get('type') as string;
    if (!type || !['avatar', 'event'].includes(type)) {
      return errorResponse('画像タイプを指定してください。"avatar"（アバター）または"event"（イベント）を送信してください。', 400);
    }

    const imageType = type as 'avatar' | 'event';

    // R2にアップロード（バリデーションは uploadImageToR2 内で実行）
    const uploadResult = await uploadImageToR2(
      file,
      imageType,
      user.id,
      context.env
    );

    if (!uploadResult.success) {
      return errorResponse(uploadResult.error || 'アップロードに失敗しました。', 500);
    }

    // 成功レスポンス
    return successResponse({
      message: `${imageType === 'avatar' ? 'アバター' : 'イベント'}画像が正常にアップロードされました。`,
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        type: imageType,
        fileName: file.name,
        fileSize: file.size,
        userId: user.id,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Image upload API error:', error);
    return errorResponse(
      'アップロード中にサーバーエラーが発生しました。しばらく時間をおいて再度お試しください。', 
      500
    );
  }
}

/**
 * 画像削除API
 * DELETE /api/upload/image
 * 
 * Body: JSON
 * - key: string (必須) - R2内の画像キー
 */
export async function onRequestDelete(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // リクエストボディの解析
    let requestBody: Record<string, unknown>;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return errorResponse('無効なJSONリクエストです。正しいJSON形式で送信してください。', 400);
    }

    // キーの取得と検証
    const { key } = requestBody;
    if (!key || typeof key !== 'string') {
      return errorResponse('削除する画像のキーを指定してください。', 400);
    }

    // キーの所有者チェック（セキュリティ対策）
    if (!key.includes(`/${user.id}/`)) {
      return errorResponse('この画像を削除する権限がありません。自分がアップロードした画像のみ削除できます。', 403);
    }

    // R2から削除（共通関数を使用）
    const deleteResult = await deleteImageFromR2(key, context.env);
    if (!deleteResult.success) {
      console.error('R2 deletion error:', deleteResult.error);
      return errorResponse(deleteResult.error || '画像の削除に失敗しました。', 500);
    }

    // 成功レスポンス
    return successResponse({
      message: '画像が削除されました。',
      data: {
        deletedKey: key,
        userId: user.id
      }
    });

  } catch (error) {
    console.error('Image deletion API error:', error);
    return errorResponse(
      '画像削除中にサーバーエラーが発生しました。しばらく時間をおいて再度お試しください。', 
      500
    );
  }
}

/**
 * 画像一覧取得API（開発・デバッグ用）
 * GET /api/upload/image
 */
export async function onRequestGet(context: RequestContext): Promise<Response> {
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }

    // URLパラメータの取得
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') as 'avatar' | 'event' | null;
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // ユーザー専用フォルダのプレフィックス作成（セキュリティ強化）
    let prefix = '';
    if (type) {
      prefix = `${type}s/${user.id}/`; // avatars/{userId}/ または events/{userId}/
    } else {
      // セキュリティ強化: typeが指定されていない場合でも必ずユーザーIDを含める
      // ユーザーが所有するすべての画像を取得する場合
      prefix = `${user.id}/`; // フォルダ構造に依存しないユーザーIDフィルタリング
    }

    // R2から画像一覧を取得
    const listResult = await context.env.IMAGES_BUCKET.list({
      prefix,
      limit: Math.min(limit, 100) // 最大100件
    });

    // ユーザーの画像のみフィルタリング（セキュリティ対策強化）
    const userImages = listResult.objects.filter(obj => {
      // ユーザーIDが含まれていることを厳密にチェック
      const keyParts = obj.key.split('/');
      
      // フォルダ構造: type/{userId}/filename の場合
      if (keyParts.length >= 3) {
        const userIdInKey = keyParts[1];
        return userIdInKey === user.id;
      }
      
      // レガシー構造や異なる構造の場合の安全なフォールバック
      return obj.key.includes(`/${user.id}/`) && obj.key.split('/').includes(user.id);
    });

    // レスポンス用データの整形
    const images = userImages.map(obj => ({
      key: obj.key,
      url: `${context.env.R2_PUBLIC_URL || 'https://your-r2-domain.r2.dev'}/${obj.key}`,
      size: obj.size,
      uploaded: obj.uploaded,
      type: obj.key.startsWith('avatars/') ? 'avatar' : 'event',
      metadata: obj.customMetadata || {}
    }));

    return successResponse({
      message: `${images.length}件の画像が見つかりました。`,
      data: {
        images,
        total: images.length,
        hasMore: listResult.truncated,
        cursor: listResult.cursor
      }
    });

  } catch (error) {
    console.error('Image list API error:', error);
    return errorResponse(
      '画像一覧の取得中にエラーが発生しました。しばらく時間をおいて再度お試しください。', 
      500
    );
  }
}