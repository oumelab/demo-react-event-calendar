// shared/cloudflare-types.ts
export interface Env {
  TURSO_DB_URL?: string;
  TURSO_DB_AUTH_TOKEN?: string;
  ENVIRONMENT?: string;
  // 他の環境変数があれば追加

  [key: string]: string | undefined;  // インデックスシグネチャを追加
}

export interface RequestContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}