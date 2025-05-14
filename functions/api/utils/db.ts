// DB接続ユーティリティ(Web向けクライアントのみを使用)
import { createClient } from '@libsql/client/web';

export function getDbClient(env) {
  // 本番環境（Cloudflare Pages）
  if (env && env.TURSO_DB_URL && env.TURSO_DB_AUTH_TOKEN) {
    return createClient({
      url: env.TURSO_DB_URL,
      authToken: env.TURSO_DB_AUTH_TOKEN
    });
  }
  
  // ローカル開発環境 - Turso CLIで起動したHTTPサーバーを使用
  return createClient({
    url: 'http://localhost:8080'
  });
}