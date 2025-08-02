// src/lib/image.ts
/**
 * イベント画像のURLを安全に取得する
 * 開発環境でアップロードされた画像の場合はデフォルト画像を返す
 */
export const getEventImageSrc = (imageUrl?: string): string => {
  // 画像URLがない場合
  if (!imageUrl || imageUrl === '') {
    return '/images/default-event.jpg';
  }
  
  // 開発環境でアップロードされた画像の場合
  if (imageUrl.startsWith('uploaded:')) {
    return '/images/default-event.jpg';
  }
  
  // 通常のHTTPS URLの場合
  return imageUrl;
};

/**
 * アバター画像のURLを安全に取得する
 * shadcn/ui Avatar コンポーネント用
 * アップロードされた画像（開発環境）の場合は undefined を返してフォールバックに任せる
 */
export const getAvatarImageSrc = (imageUrl?: string): string | undefined => {
  // 画像URLがない場合、またはアップロードされた画像の場合
  if (!imageUrl || imageUrl === '' || imageUrl.startsWith('uploaded:')) {
    return undefined; // AvatarFallback にフォールバック
  }
  
  // 通常のHTTPS URLの場合
  return imageUrl;
};