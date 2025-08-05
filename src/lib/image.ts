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
  
  // アップロードされた画像の場合（uploaded:プレフィックス）
  if (imageUrl.startsWith('uploaded:')) {
    const actualUrl = imageUrl.replace('uploaded:', '');
    
    // 実際のHTTPS URLの場合はそれを使用
    if (actualUrl.startsWith('https://')) {
      return actualUrl;
    }
    
    // R2が利用可能な環境では、環境変数を使用してURLを構築
    if (import.meta.env.VITE_R2_PUBLIC_URL) {
      return `${import.meta.env.VITE_R2_PUBLIC_URL}/${actualUrl}`;
    }
    
    // R2が利用できない環境（ローカル開発）ではデフォルト画像を使用
    return DEFAULT_EVENT_IMG;
  }
  
  // 通常のHTTPS URLの場合
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // その他の場合はデフォルト画像を返す
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
  
  // アップロードされた画像の場合（uploaded:プレフィックス）
  if (imageUrl.startsWith('uploaded:')) {
    const actualUrl = imageUrl.replace('uploaded:', '');
    
    // 実際のHTTPS URLの場合はそれを使用
    if (actualUrl.startsWith('https://')) {
      return actualUrl;
    }
    
    // R2が利用可能な環境では、環境変数を使用してURLを構築
    if (import.meta.env.VITE_R2_PUBLIC_URL) {
      return `${import.meta.env.VITE_R2_PUBLIC_URL}/${actualUrl}`;
    }
    
    // R2が利用できない場合は undefined を返してフォールバックに任せる
    return undefined;
  }
  
  // 通常のHTTPS URLの場合
  if (imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // その他の場合は undefined を返してフォールバックに任せる
  return undefined;
};