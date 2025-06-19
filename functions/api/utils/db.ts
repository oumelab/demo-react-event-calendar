// functions/api/utils/db.ts
// DB接続ユーティリティ(Web向けクライアントのみを使用)
import { createClient } from '@libsql/client/web';
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";
import { createId } from "@paralleldrive/cuid2";
import type { Env } from '@shared/cloudflare-types';

// 既存のイベントAPI用クライアント
export function getDbClient(env: Env | undefined) {
  if (!env || !env.TURSO_DB_URL || !env.TURSO_DB_AUTH_TOKEN) {
    throw new Error('Database environment variables are required');
  }

  return createClient({
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_AUTH_TOKEN
  });
}

// Better Auth用dialect
export function getLibsqlDialect(env: Env) {
  if (!env.TURSO_DB_URL || !env.TURSO_DB_AUTH_TOKEN) {
    throw new Error('Database environment variables are required');
  }

  return new LibsqlDialect({
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_AUTH_TOKEN,
  });
}

// Better Auth インスタンス生成（Runtime用）- デフォルトクッキー使用版
export function createAuthForRuntime(env: Env) {
  const dialect = getLibsqlDialect(env);
  
  // 環境判定：ローカル開発環境かどうか
  const isLocalDevelopment = env.ENVIRONMENT === 'development' || 
                            !env.TURSO_DB_URL?.includes('.turso.io');

  // ✅ デバッグ用ログ追加
  console.log('🔍 Environment debug:', {
    ENVIRONMENT: env.ENVIRONMENT,
    hasTursoUrl: !!env.TURSO_DB_URL,
    includesTurso: env.TURSO_DB_URL?.includes('.turso.io'),
    isLocalDevelopment,
  });
  
  return betterAuth({
    database: {
      dialect,
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET || "dev-secret-min-32-chars",
    
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    
    session: {
      expiresIn: 604800, // 7日（秒）
      updateAge: 86400,  // 1日（秒）
      cookieCache: {
        enabled: false, // すべての環境で無効
        maxAge: 300       // 5分（セッション情報更新）
      },
      // freshAge: 60 * 60 * 24, // デフォルトで1日
      storeSessionInDatabase: true, // データベースにセッション保存
    },
    
    // 環境に応じた設定（クッキー設定は削除してデフォルト使用）
    advanced: {
      crossSubDomainCookies: {
        enabled: false, // 単一ドメイン用
      },
      useSecureCookies: !isLocalDevelopment, // 本番環境では自動的にtrue
      disableCSRFCheck: false,
      database: {
        generateId: () => createId(), // CUID2でID生成
      },
    },
  });
}