// DB接続ユーティリティ
import { createClient } from '@libsql/client';

export function getDbClient(env) {
  // 本番環境（Cloudflare Pages）
  if (env && env.TURSO_DB_URL && env.TURSO_DB_AUTH_TOKEN) {
    return createClient({
      url: env.TURSO_DB_URL,
      authToken: env.TURSO_DB_AUTH_TOKEN
    });
  }
  
  // 開発環境（ローカルSQLite）- 相対パスに注意
  return createClient({
    url: 'file: db/local_dev.db'
  });
}