import { z } from 'zod';
import { errorResponse } from './response';

/**
 * Zodスキーマを使用してリクエストデータをバリデーションする
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション済みデータ または エラーレスポンス
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | Response {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => err.message);
    return errorResponse(errors.join(', '), 400);
  }

  return result.data;
}

/**
 * バリデーション結果がエラーレスポンスかどうかを判定する型ガード
 * @param result バリデーション結果
 * @returns エラーレスポンスの場合true
 */
export function isValidationError(result: unknown): result is Response {
  return result instanceof Response;
}