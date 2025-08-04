// functions/api/debug-upload.ts - デバッグ用
import { getCurrentUser } from './utils/auth';
import { errorResponse, successResponse } from './utils/response';
import { generateImageKey, generateImageMetadata } from './utils/image-upload';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequestPost(context: RequestContext): Promise<Response> {
  console.log('🔍 Debug upload started');
  
  try {
    // 認証チェック
    const user = await getCurrentUser(context.request, context.env);
    if (!user) {
      return errorResponse('ログインが必要です。', 401);
    }
    console.log('✅ User authenticated:', user.id);

    // R2バケット確認
    if (!context.env.IMAGES_BUCKET) {
      console.error('❌ IMAGES_BUCKET not available');
      return errorResponse('R2バケットが利用できません。', 500);
    }
    console.log('✅ IMAGES_BUCKET available:', typeof context.env.IMAGES_BUCKET);

    // FormData解析
    const contentType = context.request.headers.get('Content-Type');
    console.log('📄 Content-Type:', contentType);

    const formData = await context.request.formData();
    console.log('📦 FormData keys:', [...formData.keys()]);

    // ファイル取得
    const fileEntry = formData.get('file');
    if (!fileEntry || typeof fileEntry === 'string') {
      return errorResponse('ファイルが正しく送信されていません。', 400);
    }

    const file = fileEntry as File;
    console.log('📁 File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // キー生成
    const key = generateImageKey(file, 'avatar', user.id);
    console.log('🔑 Generated key:', key);

    // メタデータ生成
    const metadata = generateImageMetadata(file, 'avatar', user.id);
    console.log('📋 Metadata:', metadata);

    // R2アップロード（詳細ログ付き）
    console.log('🚀 Starting R2 upload...');
    
    let uploadResult;
    try {
      uploadResult = await context.env.IMAGES_BUCKET.put(
        key,
        file.stream(),
        metadata
      );
      console.log('✅ R2 upload result:', uploadResult ? 'Success' : 'Failed');
      console.log('📊 Upload details:', {
        key: uploadResult?.key,
        size: uploadResult?.size,
        etag: uploadResult?.etag,
        uploaded: uploadResult?.uploaded
      });
    } catch (uploadError) {
      console.error('❌ R2 upload error:', uploadError);
      return errorResponse('R2アップロードでエラーが発生しました: ' + (uploadError instanceof Error ? uploadError.message : 'unknown'), 500);
    }

    if (!uploadResult) {
      console.error('❌ Upload result is null');
      return errorResponse('アップロードに失敗しました（結果がnull）', 500);
    }

    // アップロード確認（list操作で確認）
    console.log('🔍 Verifying upload with list operation...');
    try {
      const listResult = await context.env.IMAGES_BUCKET.list({
        prefix: key,
        limit: 1
      });
      console.log('📋 List result:', {
        found: listResult.objects.length > 0,
        objects: listResult.objects.map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded
        }))
      });
    } catch (listError) {
      console.error('⚠️ List verification failed:', listError);
    }

    // 公開URL生成
    const publicUrl = context.env.R2_PUBLIC_URL 
      ? `${context.env.R2_PUBLIC_URL}/${key}`
      : `https://your-r2-domain.r2.dev/${key}`;

    console.log('🌐 Generated URL:', publicUrl);
    console.log('✅ Debug upload completed successfully');

    return successResponse({
      message: 'デバッグアップロードが完了しました。',
      data: {
        url: publicUrl,
        key: key,
        fileName: file.name,
        fileSize: file.size,
        userId: user.id,
        uploadResult: {
          key: uploadResult.key,
          size: uploadResult.size,
          etag: uploadResult.etag,
          uploaded: uploadResult.uploaded
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug upload fatal error:', error);
    return errorResponse('デバッグアップロードでエラーが発生しました: ' + (error instanceof Error ? error.message : 'unknown'), 500);
  }
}