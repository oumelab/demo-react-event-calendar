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
