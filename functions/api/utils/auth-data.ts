// functions/api/utils/auth-data.ts
import type { Attendee } from '@shared/types';

// ✅ 残す: 実際に使用されている変換関数
export function transformAttendeeRow(row: unknown): Attendee {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid attendee row data');
  }

  const rowObj = row as Record<string, unknown>;

  return {
    id: safeString(rowObj.id),
    event_id: safeString(rowObj.event_id),
    email: safeString(rowObj.email),
    created_at: safeNumber(rowObj.created_at) || Date.now(),
    user_id: rowObj.user_id ? safeString(rowObj.user_id) : undefined,
  };
}

// ヘルパー関数
function safeString(value: unknown, defaultValue = ''): string {
  return value ? String(value) : defaultValue;
}

function safeNumber(value: unknown, defaultValue?: number): number | undefined {
  if (value == null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}