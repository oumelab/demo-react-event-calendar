// functions/api/utils/auth.ts
import { createAuthForRuntime } from './db';
import type { Env } from '../../../shared/cloudflare-types';
import type { User, Session, Attendee, AttendeeWithUser } from '../../../shared/types';

// User型への変換（既存のtransformEventRowパターンを踏襲）
export function transformUserRow(row: unknown): User {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid user row data');
  }

  const rowObj = row as Record<string, unknown>;

  return {
    id: String(rowObj.id ?? ''),
    email: String(rowObj.email ?? ''),
    emailVerified: Boolean(rowObj.emailVerified ?? false),
    name: rowObj.name ? String(rowObj.name) : null,
    image: rowObj.image ? String(rowObj.image) : null,
    createdAt: rowObj.createdAt 
      ? new Date(rowObj.createdAt as string) 
      : new Date(),
    updatedAt: rowObj.updatedAt 
      ? new Date(rowObj.updatedAt as string) 
      : new Date(),
  };
}

// Session型への変換
export function transformSessionRow(row: unknown): Session {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid session row data');
  }

  const rowObj = row as Record<string, unknown>;

  return {
    id: String(rowObj.id ?? ''),
    userId: String(rowObj.userId ?? ''),
    expiresAt: new Date(rowObj.expiresAt as string),
    user: transformUserRow(rowObj.user || {}), // ユーザー情報も変換
  };
}

// Better Auth結果の安全な抽出
export function extractUserFromAuthResult(result: unknown): User | null {
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  
  const authResult = result as Record<string, unknown>;
  
  if (authResult.user) {
    try {
      return transformUserRow(authResult.user);
    } catch {
      return null;
    }
  }
  
  return null;
}

export function extractSessionFromAuthResult(result: unknown): Session | null {
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  
  const authResult = result as Record<string, unknown>;
  
  if (authResult.session && authResult.user) {
    try {
      // any型を回避して型安全に変換
      const sessionObj = authResult.session as Record<string, unknown>;
      
      return {
        id: String(sessionObj.id ?? ''),
        userId: String(sessionObj.userId ?? ''),
        expiresAt: new Date(sessionObj.expiresAt as string),
        user: transformUserRow(authResult.user),
      };
    } catch {
      return null;
    }
  }
  
  return null;
}

// Attendee型への変換（既存のattendeesテーブル用）
export function transformAttendeeRow(row: unknown): Attendee {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid attendee row data');
  }

  const rowObj = row as Record<string, unknown>;

  return {
    id: String(rowObj.id ?? ''),
    event_id: String(rowObj.event_id ?? ''),
    email: String(rowObj.email ?? ''),
    created_at: rowObj.created_at != null ? Number(rowObj.created_at) : Date.now(),
    user_id: rowObj.user_id ? String(rowObj.user_id) : undefined,
  };
}

// ユーザー情報と結合されたAttendee型への変換
export function transformAttendeeWithUserRow(row: unknown): AttendeeWithUser {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid attendee with user row data');
  }

  const rowObj = row as Record<string, unknown>;
  const attendee = transformAttendeeRow(row);
  
  // AttendeeをAttendeeWithUserに拡張
  const attendeeWithUser: AttendeeWithUser = { ...attendee };

  // ユーザー情報がある場合は変換
  if (rowObj.user_name || rowObj.user_email) {
    attendeeWithUser.user = {
      id: String(rowObj.user_id ?? ''),
      email: String(rowObj.user_email ?? ''),
      emailVerified: Boolean(rowObj.user_emailVerified ?? false),
      name: rowObj.user_name ? String(rowObj.user_name) : null,
      image: rowObj.user_image ? String(rowObj.user_image) : null,
      createdAt: rowObj.user_createdAt 
        ? new Date(rowObj.user_createdAt as string) 
        : new Date(),
      updatedAt: rowObj.user_updatedAt 
        ? new Date(rowObj.user_updatedAt as string) 
        : new Date(),
    };
  }

  return attendeeWithUser;
}

// 認証エラーの処理（既存のerrorResponseと連携）
export function createAuthError(message: string, code?: string): Error {
  const error = new Error(message);
  error.name = code || 'AuthError';
  return error;
}

// 型ガード関数（既存パターンを踏襲）
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

export function isValidSession(session: unknown): session is Session {
  if (typeof session !== 'object' || session === null) {
    return false;
  }
  
  const obj = session as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    obj.expiresAt instanceof Date &&
    isValidUser(obj.user)
  );
}

// セッション検証ヘルパー
export function isSessionValid(session: Session): boolean {
  return session.expiresAt > new Date();
}

// パスワード強度チェック（基本版）
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

// メールアドレス検証
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// getCurrentUser関数（新規追加）
export async function getCurrentUser(request: Request, env: Env): Promise<User | null> {
  try {
    // 実際のRuntime用Better Authインスタンスを使用
    const auth = createAuthForRuntime(env);
    
    // Better Authのセッション検証を使用
    const sessionResult = await auth.api.getSession({
      headers: request.headers,
      asResponse: false, // オブジェクトとして取得
    });

    if (!sessionResult || !sessionResult.user) {
      return null;
    }

    // Better Authの結果を安全にUser型に変換
    return extractUserFromAuthResult({ user: sessionResult.user });
    
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
