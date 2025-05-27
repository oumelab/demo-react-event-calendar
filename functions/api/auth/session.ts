// functions/api/auth/session.ts (Better Auth対応版)
import { createAuthForRuntime, getDbClient } from '../utils/db';
import { authSuccessResponse, authErrorResponse, unauthenticatedResponse } from '../utils/response';
import { APIError } from 'better-auth/api';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'GET') {
    return authErrorResponse('Method not allowed', 405);
  }

  try {
    const auth = createAuthForRuntime(context.env);
    
    console.log('=== Better Auth Session Check (Enhanced) ===');
    
    // Better Auth のgetSessionを改善された方法で呼び出し
    const sessionResult = await auth.api.getSession({
      headers: context.request.headers,
      asResponse: false, // オブジェクトとして取得
    });

    console.log('Better Auth getSession result:', {
      hasUser: !!sessionResult?.user,
      hasSession: !!sessionResult?.session,
      userEmail: sessionResult?.user?.email,
      sessionId: sessionResult?.session?.id,
    });

    // Better Auth でセッションが取得できた場合
    if (sessionResult?.session && sessionResult?.user) {
      console.log('✅ Better Auth session found!');
      
      const user = {
        id: sessionResult.user.id,
        email: sessionResult.user.email,
        emailVerified: sessionResult.user.emailVerified,
        name: sessionResult.user.name || null,
        image: sessionResult.user.image || null,
        createdAt: new Date(sessionResult.user.createdAt),
        updatedAt: new Date(sessionResult.user.updatedAt),
      };

      const session = {
        id: sessionResult.session.id,
        userId: sessionResult.session.userId,
        expiresAt: new Date(sessionResult.session.expiresAt),
        user,
      };

      return authSuccessResponse({
        authenticated: true,
        user,
        session,
        message: '認証済みです（Better Auth）',
      });
    }

    // Better Auth が失敗した場合のフォールバック（直接DB確認）
    console.log('⚠️ Better Auth session not found, falling back to direct DB check');
    
    const cookieHeader = context.request.headers.get('Cookie');
    
    let sessionToken = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith('better-auth.session_token='));
      if (sessionCookie) {
        sessionToken = sessionCookie.split('=')[1];
      }
    }
    
    if (!sessionToken) {
      return unauthenticatedResponse('認証されていません');
    }

    // 直接データベースでセッション確認
    console.log('=== Direct DB Session Check (Fallback) ===');
    const dbClient = getDbClient(context.env);
    const dbSessionResult = await dbClient.execute({
      sql: `SELECT 
              s.id as session_id, s.userId, s.token, s.expiresAt,
              u.id as user_id, u.email, u.emailVerified, u.name, u.image, 
              u.createdAt as user_createdAt, u.updatedAt as user_updatedAt
            FROM session s 
            JOIN user u ON s.userId = u.id 
            WHERE s.token = ? AND s.expiresAt > datetime("now")`,
      args: [sessionToken]
    });

    if (dbSessionResult.rows.length > 0) {
      const row = dbSessionResult.rows[0];
      console.log('✅ Session found in DB (fallback)');
      
      const user = {
        id: String(row.user_id),
        email: String(row.email),
        emailVerified: Boolean(row.emailVerified),
        name: row.name ? String(row.name) : null,
        image: row.image ? String(row.image) : null,
        createdAt: new Date(row.user_createdAt as string),
        updatedAt: new Date(row.user_updatedAt as string),
      };

      const session = {
        id: String(row.session_id),
        userId: String(row.userId),
        expiresAt: new Date(row.expiresAt as string),
        user,
      };

      return authSuccessResponse({
        authenticated: true,
        user,
        session,
        message: '認証済みです（DB直接確認）',
      });
    }

    // どちらの方法でもセッションが見つからない場合
    console.log('❌ No session found');
    return unauthenticatedResponse('セッションが無効です');

  } catch (error) {
    console.error('Session check error:', error);
    
    // APIError の詳細ログ
    if (error instanceof APIError) {
      console.log('APIError in getSession:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        body: error.body,
      });
    }
    
    return authErrorResponse('セッション確認中にエラーが発生しました', 500);
  }
}