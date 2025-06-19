// functions/api/utils/logger.ts
import type { Env } from '@shared/cloudflare-types';

/**
 * 開発環境でのみログを出力するヘルパー関数
 */
export function conditionalLog(env: Env, ...args: unknown[]) {
  if (env.ENVIRONMENT === 'development') {
    console.log(...args);
  }
}

/**
 * 開発環境でのみエラーログを出力するヘルパー関数
 */
export function conditionalError(env: Env, ...args: unknown[]) {
  if (env.ENVIRONMENT === 'development') {
    console.error(...args);
  }
}