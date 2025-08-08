// src/lib/image.ts - シンプルな環境変数版
/**
 * イベント画像のURLを安全に取得する
 * アップロードされた画像と外部URLの両方に対応
 */
import DEFAULT_EVENT_IMG from '/default.png'; // デフォルト画像のパス

export const getEventImageSrc = (imageUrl?: string): string => {
  // 画像URLがない場合
  if (!imageUrl || imageUrl === '') {
    return DEFAULT_EVENT_IMG;
  }
  
  // HTTPS URLの場合はそのまま使用
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // R2キーの場合、環境変数でURL構築
  if (import.meta.env.VITE_R2_PUBLIC_URL) {
    return `${import.meta.env.VITE_R2_PUBLIC_URL}/${imageUrl}`;
  }
  
  // R2が利用できない環境（ローカル開発）ではデフォルト画像を使用
  return DEFAULT_EVENT_IMG;
};

/**
 * アバター画像のURLを安全に取得する
 * shadcn/ui Avatar コンポーネント用
 */
export const getAvatarImageSrc = (imageUrl?: string): string | undefined => {
  // 画像URLがない場合
  if (!imageUrl || imageUrl === '') {
    return undefined; // AvatarFallback にフォールバック
  }
  
  // HTTPS URLの場合はそのまま使用
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // R2キーの場合、環境変数でURL構築
  if (import.meta.env.VITE_R2_PUBLIC_URL) {
    return `${import.meta.env.VITE_R2_PUBLIC_URL}/${imageUrl}`;
  }
  
  // R2が利用できない場合は undefined を返してフォールバックに任せる
  return undefined;
};