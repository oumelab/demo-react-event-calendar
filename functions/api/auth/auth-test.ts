import { getCurrentSession } from '../utils/auth-client';
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequest(context: RequestContext): Promise<Response> {
  if (context.request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const sessionData = await getCurrentSession(context);
    
    // デバッグ情報を含むレスポンス
    const debugInfo = {
      timestamp: new Date().toISOString(),
      headers: {
        cookie: context.request.headers.get('Cookie') || 'No cookies',
        userAgent: context.request.headers.get('User-Agent') || 'No user agent',
      },
      environment: {
        ENVIRONMENT: context.env.ENVIRONMENT,
        hasTursoUrl: !!context.env.TURSO_DB_URL,
        hasAuthSecret: !!context.env.BETTER_AUTH_SECRET,
      },
      session: sessionData,
    };
    
    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'テスト中にエラーが発生しました',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }, null, 2), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}