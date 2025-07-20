// functions/api/auth/[[catchall]].ts
import { createAuthForRuntime } from '../utils/db';
import type { RequestContext } from '../../../shared/cloudflare-types';

export async function onRequest(context: RequestContext): Promise<Response> {
  const origin = context.request.headers.get('origin');
  
  // プリフライトリクエスト処理
  if (context.request.method === 'OPTIONS') {
    return createOptionsResponse(origin);
  }
  
  const auth = createAuthForRuntime(context.env);
  const response = await auth.handler(context.request);
  
  // CORS ヘッダーを追加（全環境対応）
  return addCorsHeaders(response, origin);
}

/**
 * オリジンが許可されているかチェック
 */
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  
  // ローカル開発環境
  const localPatterns = [
    'http://localhost:4173',
    'http://localhost:5173', 
    'http://localhost:8788',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8788',
  ];
  
  if (localPatterns.includes(origin)) {
    return true;
  }
  
  // Cloudflare Pages パターン（動的）
  // *.your-project.pages.dev の形式をチェック
  const pagesPattern = /^https:\/\/.*\.demo-react-event-calendar\.pages\.dev$/;
  if (pagesPattern.test(origin)) {
    return true;
  }
  
  // 本番環境（メインドメイン）
  if (origin === 'https://demo-react-event-calendar.pages.dev') {
    return true;
  }
  
  return false;
}

/**
 * CORS ヘッダーを追加
 */
function addCorsHeaders(response: Response, origin: string | null): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  
  if (origin && isAllowedOrigin(origin)) {
    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
  }
  
  return newResponse;
}

/**
 * OPTIONS プリフライトリクエスト用レスポンス
 */
function createOptionsResponse(origin: string | null): Response {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24時間キャッシュ
  };
  
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return new Response(null, {
    status: 200,
    headers,
  });
}