// functions/api/utils/image-upload.ts
import { createId } from '@paralleldrive/cuid2';
import type { Env } from '@shared/cloudflare-types';

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

/**
 * 画像設定定義
 */
export const IMAGE_CONFIGS: Record<'avatar' | 'event', ImageUploadConfig> = {
  avatar: {
    type: 'avatar',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    resize: {
      width: 256,
      height: 256,
      quality: 85
    }
  },
  event: {
    type: 'event',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    resize: {
      width: 800,
      height: 600,
      quality: 80
    }
  }
};

/**
 * ファイルバリデーション
 */
export function validateImageFile(
  file: File,
  config: ImageUploadConfig
): { isValid: boolean; error?: string } {
  // ファイルサイズチェック
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `ファイルサイズが制限を超えています。最大${maxSizeMB}MBまで対応しています。`
    };
  }

  // ファイル形式チェック
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `対応していないファイル形式です。JPEG、PNG、WebP形式のみ対応しています。`
    };
  }

  // ファイル名の安全性チェック（基本的な検証）
  if (!file.name || file.name.length > 255) {
    return {
      isValid: false,
      error: 'ファイル名が無効です。'
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
  const extension = getFileExtension(file.name);
  const folder = type === 'avatar' ? 'avatars' : 'events';
  
  return `${folder}/${userId}/${timestamp}-${randomId}${extension}`;
}

/**
 * ファイル拡張子取得
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '.jpg'; // デフォルト拡張子
  return `.${parts[parts.length - 1].toLowerCase()}`;
}

/**
 * Content-Type 設定
 */
export function getContentType(file: File): string {
  // ブラウザが提供するContent-Typeをそのまま使用
  return file.type || 'image/jpeg';
}

/**
 * 画像のメタデータ生成
 */
export function generateImageMetadata(
  file: File,
  type: 'avatar' | 'event',
  userId: string
) {
  return {
    // R2 HTTPメタデータ
    httpMetadata: {
      contentType: getContentType(file),
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
      return {
        success: false,
        error: 'ストレージサービスが利用できません。'
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
      return {
        success: false,
        error: 'ファイルのアップロードに失敗しました。'
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
 * 公開URL生成（開発段階用）
 */
function generatePublicUrl(key: string, env: Env): string {
  // カスタムドメインが設定されている場合
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
  
  // 開発段階：プレースホルダーURLを返す
  // フロントエンド統合時に実際のドメインを設定予定
  console.log('🔧 Development mode: using placeholder URL for key:', key);
  return `https://dev-images.placeholder.dev/${key}`;
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
      return {
        success: false,
        error: 'ストレージサービスが利用できません。'
      };
    }

    await env.IMAGES_BUCKET.delete(key);
    
    return { success: true };
  } catch (error) {
    console.error('Image deletion error:', error);
    return {
      success: false,
      error: '画像の削除に失敗しました。'
    };
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