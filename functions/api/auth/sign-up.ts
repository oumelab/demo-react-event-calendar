// functions/api/auth/sign-up.ts (Better Auth対応版)
import { createAuthForRuntime } from '../utils/db';
import { authSuccessResponse, authErrorResponse } from '../utils/response';
import { validateEmail, validatePassword } from '../utils/auth';
import { APIError } from 'better-auth/api';
import type { RequestContext } from '@shared/cloudflare-types';
import type { RegisterCredentials } from '@shared/types';

export async function onRequest(context: RequestContext) {
  if (context.request.method !== 'POST') {
    return authErrorResponse('Method not allowed', 405);
  }

  try {
    const auth = createAuthForRuntime(context.env);
    
    // 型安全にボディを取得
    const body = await context.request.json() as RegisterCredentials;
    
    console.log('Registration attempt for:', body.email);
    
    // バリデーション
    if (!body.email || !body.password || !body.name) {
      return authErrorResponse('メールアドレス、パスワード、名前は必須です', 400);
    }

    if (!validateEmail(body.email)) {
      return authErrorResponse('有効なメールアドレスを入力してください', 400);
    }

    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.isValid) {
      return authErrorResponse(passwordValidation.errors.join(', '), 400);
    }

    // Better Auth のサインアップ（レスポンスヘッダーも取得）
    console.log('Attempting Better Auth signUpEmail with returnHeaders...');
    
    const result = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
      headers: context.request.headers,
      returnHeaders: true, // ← これが重要！
    });

    console.log('Better Auth signUpEmail result:', {
      hasResponse: !!result.response,
      hasUser: !!result.response?.user,
      userEmail: result.response?.user?.email,
      hasToken: !!result.response?.token,
      hasHeaders: !!result.headers,
    });

    // エラーハンドリング
    if (!result?.response || !result.response.user) {
      return authErrorResponse('ユーザー登録に失敗しました', 400);
    }

    // ユーザー情報を安全に変換
    const user = {
      id: result.response.user.id,
      email: result.response.user.email,
      emailVerified: result.response.user.emailVerified,
      name: result.response.user.name || null,
      image: result.response.user.image || null,
      createdAt: new Date(result.response.user.createdAt),
      updatedAt: new Date(result.response.user.updatedAt),
    };

    // セッション情報はBetter Authから直接取得できないため、undefinedに設定
    const session = undefined;
    
    console.log('Extracted data:', {
      hasUser: !!user,
      hasSession: !!session,
      token: result.response.token?.substring(0, 10) + '...',
    });

    // レスポンス作成
    const response = authSuccessResponse({
      authenticated: true,
      user,
      session,
      message: 'ユーザー登録が完了しました',
    });

    // Better Auth からのSet-Cookieヘッダーを転送
    if (result.headers) {
      const setCookieHeader = result.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('Setting cookies from Better Auth:', setCookieHeader);
        response.headers.set('Set-Cookie', setCookieHeader);
      }
    }

    return response;

  } catch (error) {
    console.error('Sign up error:', error);
    
    // APIError の詳細なハンドリング
    if (error instanceof APIError) {
      console.log('APIError details:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        body: error.body,
      });
      
      // 既存ユーザーエラーの判定
      if (error.statusCode === 409 || 
          error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('UNIQUE constraint failed')) {
        return authErrorResponse('このメールアドレスは既に登録されています', 409);
      }
      
      return authErrorResponse(error.message, error.statusCode || 400);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return authErrorResponse('このメールアドレスは既に登録されています', 409);
      }
      return authErrorResponse(error.message, 400);
    }
    
    return authErrorResponse('ユーザー登録中にエラーが発生しました', 500);
  }
}