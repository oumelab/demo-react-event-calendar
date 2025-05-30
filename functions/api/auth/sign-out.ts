// functions/api/auth/sign-out.ts (Better Auth対応版)
import { createAuthForRuntime, getDbClient } from '../utils/db';
import { authSuccessResponse, authErrorResponse } from '../utils/response';
import { APIError } from 'better-auth/api';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'POST') {
    return authErrorResponse('Method not allowed', 405);
  }

  try {
    const auth = createAuthForRuntime(context.env);
    
    console.log('=== Better Auth Sign Out (Enhanced) ===');
    
    // Better Auth のサインアウト（ヘッダー付き）
    const signOutResult = await auth.api.signOut({
      headers: context.request.headers,
      returnHeaders: true, // ← これが重要！
    });

    console.log('Better Auth signOut result:', {
      success: !!signOutResult,
      hasHeaders: !!signOutResult?.headers,
    });

    // レスポンス作成
    const response = authSuccessResponse({
      authenticated: false,
      user: undefined,
      session: undefined,
      message: 'ログアウトしました',
    });

    // Better Auth からのSet-Cookieヘッダーを転送（クッキー削除用）
    if (signOutResult?.headers) {
      const setCookieHeader = signOutResult.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('Setting cookie deletion from Better Auth:', setCookieHeader);
        response.headers.set('Set-Cookie', setCookieHeader);
      }
    } else {
      // フォールバック: 手動でクッキーを削除
      console.log('Fallback: Manual cookie deletion');
      response.headers.set('Set-Cookie', 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    }

    return response;

  } catch (error) {
    console.error('Sign out error:', error);
    
    // APIError の場合でも、フォールバック処理を実行
    if (error instanceof APIError) {
      console.log('APIError in signOut, falling back to manual cleanup:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
      });
      
      // フォールバック: 直接データベースからセッション削除
      try {
        const cookieHeader = context.request.headers.get('Cookie');
        let sessionToken = null;
        
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').map(c => c.trim());
          const sessionCookie = cookies.find(c => c.startsWith('better-auth.session_token='));
          if (sessionCookie) {
            sessionToken = sessionCookie.split('=')[1];
          }
        }

        if (sessionToken) {
          const dbClient = getDbClient(context.env);
          await dbClient.execute({
            sql: 'DELETE FROM session WHERE token = ?',
            args: [sessionToken]
          });
          console.log('✅ Session manually deleted from database');
        }
      } catch (dbError) {
        console.error('Failed to manually delete session:', dbError);
      }
    }
    
    // エラーが発生してもログアウト成功として扱う（冪等性のため）
    const response = authSuccessResponse({
      authenticated: false,
      user: undefined,
      session: undefined,
      message: 'ログアウトしました',
    });

    // クッキー削除（エラー時も実行）
    response.headers.set('Set-Cookie', 'better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    return response;
  }
}