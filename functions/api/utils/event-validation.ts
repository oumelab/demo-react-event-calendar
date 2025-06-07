import type { CreateEventRequest, UpdateEventRequest } from '@shared/types';

// 既存関数（作成時の完全バリデーション）
export function validateEventData(data: CreateEventRequest): string[] {
  const errors: string[] = [];
  
  if (!data.title?.trim()) {
    errors.push('タイトルは必須です');
  }
  if (!data.date?.trim()) {
    errors.push('開催日時は必須です');
  }
  if (!data.location?.trim()) {
    errors.push('開催場所は必須です');
  }
  if (data.capacity && data.capacity < 1) {
    errors.push('定員は1人以上に設定してください');
  }
  if (data.title && data.title.length > 100) {
    errors.push('タイトルは100文字以内で入力してください');
  }
  if (data.description && data.description.length > 1000) {
    errors.push('説明は1000文字以内で入力してください');
  }
  
  return errors;
}

// 新規追加：更新時の部分バリデーション
export function validatePartialEventData(data: UpdateEventRequest): string[] {
  const errors: string[] = [];
  
  // 空のオブジェクトチェック
  if (Object.keys(data).length === 0) {
    errors.push('更新する項目がありません');
    return errors;
  }
  
  // 定義されているフィールドのみバリデーション
  if (data.title !== undefined && !data.title.trim()) {
    errors.push('タイトルは必須です');
  }
  if (data.date !== undefined && !data.date.trim()) {
    errors.push('開催日時は必須です');
  }
  if (data.location !== undefined && !data.location.trim()) {
    errors.push('開催場所は必須です');
  }
  if (data.capacity !== undefined && data.capacity < 1) {
    errors.push('定員は1人以上に設定してください');
  }
  if (data.title !== undefined && data.title.length > 100) {
    errors.push('タイトルは100文字以内で入力してください');
  }
  if (data.description !== undefined && data.description.length > 1000) {
    errors.push('説明は1000文字以内で入力してください');
  }
  
  return errors;
}