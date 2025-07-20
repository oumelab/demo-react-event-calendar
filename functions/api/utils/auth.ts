// functions/api/utils/auth.ts (Better Auth 型共有版)
import { createAuthForRuntime } from './db';
import type { UserWithAnonymous } from 'better-auth/plugins';
import type { Env } from '@shared/cloudflare-types';

/**
 * Better Auth でセッションからユーザー情報を取得
 */
export async function getCurrentUser(request: Request, env: Env): Promise<UserWithAnonymous | null> {
  try {
    const auth = createAuthForRuntime(env);
    
    const sessionResult = await auth.api.getSession({
      headers: request.headers,
      asResponse: false,
    });

    if (!sessionResult || !sessionResult.user) {
      return null;
    }

    // Better Auth のユーザー情報をそのまま返す
    return sessionResult.user as UserWithAnonymous;
    
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Better Auth User の型ガード関数
 */
export function isBetterAuthUser(user: unknown): user is UserWithAnonymous {
  if (typeof user !== 'object' || user === null) {
    return false;
  }
  
  const obj = user as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.emailVerified === 'boolean'
  );
}

/**
 * 認証エラーのヘルパー関数
 */
export function createAuthError(message: string, code?: string): Error {
  const error = new Error(message);
  error.name = code || 'AuthError';
  return error;
}

/**
 * メールアドレスの簡易バリデーション
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * パスワードのバリデーション
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }
  
  if (password.length > 128) {
    errors.push('パスワードは128文字以下である必要があります');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}