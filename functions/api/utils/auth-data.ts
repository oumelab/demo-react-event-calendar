// functions/api/utils/auth-data.ts
// 認証関連の型変換関数（data.tsパターンを踏襲）

import type { User, Session, Attendee, AttendeeWithUser } from '@shared/types';

// ===========================================
// 基本的な型変換ユーティリティ（再利用可能）
// ===========================================

/**
 * 安全なString変換
 */
function safeString(value: unknown, defaultValue = ''): string {
  return value ? String(value) : defaultValue;
}

/**
 * 安全なNumber変換
 */
function safeNumber(value: unknown, defaultValue?: number): number | undefined {
  if (value == null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全なBoolean変換
 */
function safeBoolean(value: unknown, defaultValue = false): boolean {
  return value ? Boolean(value) : defaultValue;
}

/**
 * 安全なDate変換
 */
function safeDate(value: unknown, defaultValue?: Date): Date {
  if (!value) return defaultValue || new Date();
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? (defaultValue || new Date()) : date;
}

// ===========================================
// Better Auth専用の変換関数
// ===========================================

/**
 * Better AuthのUser結果をUser型に変換（統一関数）
 */
export function transformBetterAuthUser(authUser: unknown): User {
  if (typeof authUser !== 'object' || authUser === null) {
    throw new Error('Invalid auth user data');
  }

  const userObj = authUser as Record<string, unknown>;

  return {
    id: safeString(userObj.id),
    email: safeString(userObj.email),
    emailVerified: safeBoolean(userObj.emailVerified),
    name: userObj.name ? safeString(userObj.name) : null,
    image: userObj.image ? safeString(userObj.image) : null,
    createdAt: safeDate(userObj.createdAt),
    updatedAt: safeDate(userObj.updatedAt),
  };
}

/**
 * Better AuthのSession結果をSession型に変換
 */
export function transformBetterAuthSession(authSession: unknown, user: User): Session {
  if (typeof authSession !== 'object' || authSession === null) {
    throw new Error('Invalid auth session data');
  }

  const sessionObj = authSession as Record<string, unknown>;

  return {
    id: safeString(sessionObj.id),
    userId: safeString(sessionObj.userId),
    expiresAt: safeDate(sessionObj.expiresAt),
    user,
  };
}

// ===========================================
// データベース行の変換関数（既存パターン保持）
// ===========================================

/**
 * DB行データをUser型に変換（data.tsパターン）
 */
export function transformUserRow(row: unknown): User {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid user row data');
  }

  return transformBetterAuthUser(row); // 統一関数を使用
}

/**
 * DB行データをSession型に変換
 */
export function transformSessionRow(row: unknown): Session {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid session row data');
  }

  const rowObj = row as Record<string, unknown>;
  const user = transformUserRow(rowObj.user || {});
  
  return {
    id: safeString(rowObj.id),
    userId: safeString(rowObj.userId),
    expiresAt: safeDate(rowObj.expiresAt),
    user,
  };
}

/**
 * DB行データをAttendee型に変換
 */
export function transformAttendeeRow(row: unknown): Attendee {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid attendee row data');
  }

  const rowObj = row as Record<string, unknown>;

  return {
    id: safeString(rowObj.id),
    event_id: safeString(rowObj.event_id),
    email: safeString(rowObj.email),
    created_at: safeNumber(rowObj.created_at) || Date.now(),
    user_id: rowObj.user_id ? safeString(rowObj.user_id) : undefined,
  };
}

/**
 * ユーザー情報と結合されたAttendee型への変換
 */
export function transformAttendeeWithUserRow(row: unknown): AttendeeWithUser {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Invalid attendee with user row data');
  }

  const rowObj = row as Record<string, unknown>;
  const attendee = transformAttendeeRow(row);
  const attendeeWithUser: AttendeeWithUser = { ...attendee };

  // ユーザー情報がある場合は変換
  if (rowObj.user_name || rowObj.user_email) {
    attendeeWithUser.user = {
      id: safeString(rowObj.user_id),
      email: safeString(rowObj.user_email),
      emailVerified: safeBoolean(rowObj.user_emailVerified),
      name: rowObj.user_name ? safeString(rowObj.user_name) : null,
      image: rowObj.user_image ? safeString(rowObj.user_image) : null,
      createdAt: safeDate(rowObj.user_createdAt),
      updatedAt: safeDate(rowObj.user_updatedAt),
    };
  }

  return attendeeWithUser;
}

// ===========================================
// Better Auth結果の安全な抽出（統一関数使用）
// ===========================================

/**
 * Better Auth結果からUser型を安全に抽出
 */
export function extractUserFromAuthResult(result: unknown): User | null {
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  
  const authResult = result as Record<string, unknown>;
  
  if (authResult.user) {
    try {
      return transformBetterAuthUser(authResult.user);
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Better Auth結果からSession型を安全に抽出
 */
export function extractSessionFromAuthResult(result: unknown): Session | null {
  if (typeof result !== 'object' || result === null) {
    return null;
  }
  
  const authResult = result as Record<string, unknown>;
  
  if (authResult.session && authResult.user) {
    try {
      const user = transformBetterAuthUser(authResult.user);
      return transformBetterAuthSession(authResult.session, user);
    } catch {
      return null;
    }
  }
  
  return null;
}