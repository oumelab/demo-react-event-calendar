// DB接続ユーティリティ(Web向けクライアントのみを使用)
import { createClient } from '@libsql/client/web';
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";
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

// Better Auth インスタンス生成（Runtime用）
export function createAuthForRuntime(env: Env) {
  const dialect = getLibsqlDialect(env);
  
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
      expiresIn: 60 * 60 * 24 * 7,
    },
  });
}