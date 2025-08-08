// functions/api/utils/image-upload.ts
import { createId } from '@paralleldrive/cuid2';
import type { Env } from '@shared/cloudflare-types';
import { IMAGE_CONFIGS } from '../../../shared/image-config';

/**
 * 画像アップロード設定
 */
export interface ImageUploadConfig {
  type: 'avatar' | 'event';
  maxSize: number; // bytes
  allowedTypes: string[];
  resize?: {
    width: number;
    height: number;
    quality: number;
  };
}

/**
 * アップロード結果
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  key?: string;
}

// 画像設定は shared/image-config.ts から IMAGE_CONFIGS をインポートして使用

/**
 * ファイルバリデーション
 */
export function validateImageFile(
  file: File,
  config: ImageUploadConfig
): { isValid: boolean; error?: string } {
  // ファイルサイズチェック
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'ファイルが空です。正しい画像ファイルを選択してください。'
    };
  }

  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `ファイルサイズが制限を超えています。現在: ${currentSizeMB}MB, 最大: ${maxSizeMB}MB`
    };
  }

  // MIME Type チェック（強化）
  if (!file.type) {
    return {
      isValid: false,
      error: 'ファイルの種類を特定できません。JPEG、PNG、WebP形式の画像を選択してください。'
    };
  }

  if (!config.allowedTypes.includes(file.type)) {
    const allowedTypesStr = config.allowedTypes.map(type => type.replace('image/', '')).join('、').toUpperCase();
    return {
      isValid: false,
      error: `対応していないファイル形式です: ${file.type}\n対応形式: ${allowedTypesStr}`
    };
  }

  // ファイル名の安全性チェック（セキュリティ強化）
  if (!file.name || file.name.length > 255) {
    return {
      isValid: false,
      error: 'ファイル名が無効です。255文字以内の正しいファイル名を使用してください。'
    };
  }

  // 危険なファイル名パターンのチェック
  const dangerousPatterns = [/\.\./, /[<>:"/|?*]/, /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i];
  if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'ファイル名に使用できない文字が含まれています。ファイル名を変更してください。'
    };
  }

  return { isValid: true };
}

/**
 * ファイル名生成
 */
export function generateImageKey(
  file: File,
  type: 'avatar' | 'event',
  userId: string
): string {
  const timestamp = Date.now();
  const randomId = createId();
  const normalized = normalizeImageType(file);
  const folder = type === 'avatar' ? 'avatars' : 'events';
  
  return `${folder}/${userId}/${timestamp}-${randomId}${normalized.extension}`;
}

/**
 * 画像形式の正規化とセキュリティ対応
 * ファイルのMIMEタイプと拡張子を統一的に安全な形式に正規化
 */
export interface NormalizedImageType {
  extension: string;
  mimeType: string;
  isValid: boolean;
}

export function normalizeImageType(file: File): NormalizedImageType {
  // 安全な画像形式の定義（拡張子とMIMEタイプのペア）
  const safeImageTypes = {
    'image/jpeg': { extension: '.jpg', mimeType: 'image/jpeg' },
    'image/jpg': { extension: '.jpg', mimeType: 'image/jpeg' }, // 非標準だが対応
    'image/png': { extension: '.png', mimeType: 'image/png' },
    'image/webp': { extension: '.webp', mimeType: 'image/webp' }
  } as const;

  // ファイル名から拡張子を抽出
  const parts = file.name.split('.');
  const fileExtension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

  // ファイルのMIMEタイプが安全な形式かチェック
  if (file.type && file.type in safeImageTypes) {
    const normalizedType = safeImageTypes[file.type as keyof typeof safeImageTypes];
    
    // 拡張子とMIMEタイプの整合性をチェック
    const expectedExtension = normalizedType.extension.replace('.', '');
    if (fileExtension && 
        !['jpg', 'jpeg'].includes(expectedExtension) && 
        fileExtension !== expectedExtension) {
      console.warn(`拡張子とMIMEタイプの不整合: ${fileExtension} vs ${file.type}`);
    }
    
    return {
      extension: normalizedType.extension,
      mimeType: normalizedType.mimeType,
      isValid: true
    };
  }

  // MIMEタイプが不明または危険な場合の処理
  if (['jpg', 'jpeg'].includes(fileExtension)) {
    console.warn(`不明なMIMEタイプ（${file.type}）をJPEGとして処理: ${file.name}`);
    return {
      extension: '.jpg',
      mimeType: 'image/jpeg',
      isValid: true
    };
  } else if (fileExtension === 'png') {
    console.warn(`不明なMIMEタイプ（${file.type}）をPNGとして処理: ${file.name}`);
    return {
      extension: '.png',
      mimeType: 'image/png',
      isValid: true
    };
  } else if (fileExtension === 'webp') {
    console.warn(`不明なMIMEタイプ（${file.type}）をWebPとして処理: ${file.name}`);
    return {
      extension: '.webp',
      mimeType: 'image/webp',
      isValid: true
    };
  }

  // 完全に不明な形式の場合はJPEGにフォールバック（セキュリティ優先）
  console.warn(`危険または不明な画像形式（${file.type}, ${fileExtension}）をJPEGにフォールバック: ${file.name}`);
  return {
    extension: '.jpg',
    mimeType: 'image/jpeg',
    isValid: false // フォールバックなので無効フラグ
  };
}


/**
 * Content-Type 設定（後方互換性維持）
 * @deprecated normalizeImageType を使用してください
 */
export function getContentType(file: File): string {
  const normalized = normalizeImageType(file);
  return normalized.mimeType;
}

/**
 * 画像のメタデータ生成
 */
export function generateImageMetadata(
  file: File,
  type: 'avatar' | 'event',
  userId: string
) {
  const normalized = normalizeImageType(file);
  
  return {
    // R2 HTTPメタデータ
    httpMetadata: {
      contentType: normalized.mimeType,
      cacheControl: 'public, max-age=31536000', // 1年キャッシュ
      contentDisposition: `inline; filename="${encodeURIComponent(file.name)}"`,
    },
    // R2 カスタムメタデータ
    customMetadata: {
      originalName: file.name,
      uploadedBy: userId,
      imageType: type,
      uploadTimestamp: Date.now().toString(),
      fileSize: file.size.toString(),
      normalizedType: normalized.mimeType,
      isNormalized: normalized.isValid.toString(),
    }
  };
}

/**
 * 画像をR2にアップロード
 */
export async function uploadImageToR2(
  file: File,
  type: 'avatar' | 'event',
  userId: string,
  env: Env
): Promise<UploadResult> {
  try {
    // 設定取得
    const config = IMAGE_CONFIGS[type];
    
    // バリデーション
    const validation = validateImageFile(file, config);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // R2バケット確認
    if (!env.IMAGES_BUCKET) {
      console.error('IMAGES_BUCKET が設定されていません');
      return {
        success: false,
        error: 'ストレージサービスが利用できません。システム管理者にお問い合わせください。'
      };
    }

    // ファイルキー生成
    const key = generateImageKey(file, type, userId);
    
    // メタデータ生成
    const metadata = generateImageMetadata(file, type, userId);

    // R2にアップロード
    const uploadResult = await env.IMAGES_BUCKET.put(
      key,
      file.stream(),
      metadata
    );

    if (!uploadResult) {
      console.error('R2 upload failed: uploadResult is null');
      return {
        success: false,
        error: 'ファイルのアップロードに失敗しました。しばらく時間をおいて再度お試しください。'
      };
    }

    // 公開URL生成（カスタムドメインまたはCloudflare R2の標準URL）
    const publicUrl = generatePublicUrl(key, env);

    return {
      success: true,
      url: publicUrl,
      key: key
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: 'アップロード中にエラーが発生しました。しばらく時間をおいて再度お試しください。'
    };
  }
}

/**
 * 公開URL生成
 * 本番環境: R2カスタムドメインURLを使用
 * 開発環境: キーのみ返す（フロントエンドでBlob URLを使用）
 */
function generatePublicUrl(key: string, env: Env): string {
  // 本番環境: カスタムドメインが設定されている場合
  if (env.R2_PUBLIC_URL && env.R2_PUBLIC_URL.startsWith('https://')) {
    const publicUrl = `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    console.log('✨ Production mode: using custom R2 domain:', publicUrl);
    return publicUrl;
  }
  
  // 開発環境: keyのみ返す（Issue #56の新フロー対応）
  console.log('🔧 Development mode: returning key for frontend blob URL usage');
  console.log('   → フロントエンドはBlob URLでプレビュー、アップロードはフォーム送信時のみ');
  return key; // URLではなくkeyを返す（新仕様）
}

/**
 * 画像削除（古い画像の cleanup 用）
 */
export async function deleteImageFromR2(
  key: string,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.IMAGES_BUCKET) {
      console.error('IMAGES_BUCKET が設定されていません');
      return {
        success: false,
        error: 'ストレージサービスが利用できません。'
      };
    }

    // キーの安全性チェック
    if (!key || key.includes('..') || !key.match(/^(avatars|events)\/[\w-]+\/[\w.-]+$/)) {
      console.error('不正なファイルキー:', key);
      return {
        success: false,
        error: '無効なファイルキーです。'
      };
    }

    await env.IMAGES_BUCKET.delete(key);
    console.log('画像削除成功:', key);
    
    return { success: true };
  } catch (error) {
    console.error('画像削除エラー:', error, 'キー:', key);
    return {
      success: false,
      error: `画像の削除に失敗しました: ${key}`
    };
  }
}

/**
 * 外部URL画像のダウンロード・統合処理
 * create.tsとupdate.tsで共通使用される処理
 */
export async function processImageUrl(
  imageUrl: string, 
  userId: string, 
  env: Env
): Promise<{ success: boolean; url?: string; error?: string; key?: string }> {
  try {
    // 外部URLの場合のみダウンロード処理
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('Processing external image URL:', imageUrl);
      
      // タイムアウトとサイズ制限付きでダウンロード
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const response = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'EventCalendar/1.0 ImageProcessor'
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Content-Type検証
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`無効なコンテンツタイプ: ${contentType}`);
      }
      
      // サイズ制限チェック (5MB)
      const contentLength = response.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        throw new Error('画像サイズが5MBを超えています');
      }
      
      const blob = await response.blob();
      
      // ファイル名生成 (URLから抽出)
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1] || 'downloaded-image';
      const extension = filename.includes('.') ? '' : '.jpg';
      const finalFilename = filename + extension;
      
      // Fileオブジェクト化
      const file = new File([blob], finalFilename, { type: blob.type });
      
      // 通常のアップロード処理と同じ流れ
      const uploadResult = await uploadImageToR2(file, 'event', userId, env);
      
      if (uploadResult.success) {
        console.log('外部URL画像のアップロード成功:', uploadResult.url);
        return {
          success: true,
          url: uploadResult.url,
          key: uploadResult.key
        };
      } else {
        throw new Error(uploadResult.error || 'アップロードに失敗');
      }
    } else {
      // 既存のアップロード済み画像はそのまま
      return {
        success: true,
        url: imageUrl
      };
    }
  } catch (error) {
    console.error('外部URL画像処理エラー:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: '画像のダウンロードがタイムアウトしました。' };
      }
      return { success: false, error: `画像の処理に失敗: ${error.message}` };
    }
    
    return { success: false, error: '画像の処理中に不明なエラーが発生しました。' };
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}