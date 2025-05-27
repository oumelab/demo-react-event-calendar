import { createAuthForRuntime } from './db';
import type { RequestContext } from '@shared/cloudflare-types';
import type { User, Session } from '@shared/types';

// セッション確認のヘルパー関数
export async function getCurrentSession(context: RequestContext): Promise<{
  user: User | null;
  session: Session | null;
  authenticated: boolean;
}> {
  try {
    const auth = createAuthForRuntime(context.env);
    
    // Better Auth のgetSessionを使用
    const sessionData = await auth.api.getSession({
      headers: context.request.headers,
    });
    
    if (sessionData?.user && sessionData?.session) {
      const user: User = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailVerified: sessionData.user.emailVerified,
        name: sessionData.user.name || null,
        image: sessionData.user.image || null,
        createdAt: new Date(sessionData.user.createdAt),
        updatedAt: new Date(sessionData.user.updatedAt),
      };
      
      const session: Session = {
        id: sessionData.session.id,
        userId: sessionData.session.userId,
        expiresAt: new Date(sessionData.session.expiresAt),
        user,
      };
      
      return {
        user,
        session,
        authenticated: true,
      };
    }
    
    return {
      user: null,
      session: null,
      authenticated: false,
    };
    
  } catch (error) {
    console.error('Session check failed:', error);
    return {
      user: null,
      session: null,
      authenticated: false,
    };
  }
}

// 認証が必要なエンドポイント用のミドルウェア
export async function requireAuthentication(context: RequestContext): Promise<{
  user: User;
  session: Session;
} | Response> {
  const sessionData = await getCurrentSession(context);
  
  if (!sessionData.authenticated || !sessionData.user || !sessionData.session) {
    return new Response(
      JSON.stringify({ 
        error: '認証が必要です',
        authenticated: false 
      }), 
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  return {
    user: sessionData.user,
    session: sessionData.session,
  };
}

// ユーザー所有権チェック
export async function requireOwnership(
  context: RequestContext, 
  resourceUserId: string
): Promise<{ user: User; session: Session } | Response> {
  const authResult = await requireAuthentication(context);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  if (authResult.user.id !== resourceUserId) {
    return new Response(
      JSON.stringify({ 
        error: 'このリソースにアクセスする権限がありません',
        authenticated: true,
        authorized: false
      }), 
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  return authResult;
}