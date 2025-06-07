import type { CreateEventRequest } from '@shared/types';

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