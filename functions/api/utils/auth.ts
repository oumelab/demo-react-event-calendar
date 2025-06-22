// functions/api/utils/auth.ts (リファクタリング版)
import { createAuthForRuntime } from './db';
import { transformBetterAuthUser } from './auth-data';
import type { Env } from '@shared/cloudflare-types';
import type { User } from '@shared/types';

// getCurrentUser関数（auth-data.tsの統一関数を使用）
export async function getCurrentUser(request: Request, env: Env): Promise<User | null> {
  try {
    const auth = createAuthForRuntime(env);
    
    const sessionResult = await auth.api.getSession({
      headers: request.headers,
      asResponse: false,
    });

    if (!sessionResult || !sessionResult.user) {
      return null;
    }

    // auth-data.tsの統一関数を使用
    return transformBetterAuthUser(sessionResult.user);
    
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// ユーティリティ関数
export function isValidUser(user: unknown): user is User {
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

export function createAuthError(message: string, code?: string): Error {
  const error = new Error(message);
  error.name = code || 'AuthError';
  return error;
}