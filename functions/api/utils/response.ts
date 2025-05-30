// functions/api/utils/response.ts (拡張版)
import type { AuthResponse } from '../../../shared/types';

// 既存のヘルパー関数（保持）
export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

// 認証API用の拡張ヘルパー関数（新規追加）
export function authSuccessResponse(authData: Omit<AuthResponse, 'success'>, status = 200) {
  const response: AuthResponse = {
    success: true,
    ...authData,
  };
  return jsonResponse(response, status);
}

export function authErrorResponse(message: string, status = 400) {
  const response: AuthResponse = {
    success: false,
    authenticated: false,
    user: undefined,
    session: undefined,
    error: message,
  };
  return jsonResponse(response, status);
}

// 未認証レスポンス用
export function unauthenticatedResponse(message = '認証されていません') {
  const response: AuthResponse = {
    success: true,
    authenticated: false,
    user: undefined,
    session: undefined,
    message,
  };
  return jsonResponse(response, 200);
}