// shared/cloudflare-types.ts
export interface Env {
  // データベース関連（既存）
  TURSO_DB_URL?: string;
  TURSO_DB_AUTH_TOKEN?: string;
  
  // 認証関連（新規追加）
  AUTH_SECRET?: string;
  
  // 環境設定（既存）
  ENVIRONMENT?: string;

  // 他の環境変数があれば追加
  [key: string]: string | undefined;  // インデックスシグネチャ
}

export interface RequestContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  // セッション情報（認証ミドルウェア使用時に追加予定）
  session?: {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    userId: string;
  };
}

// 認証が必要なAPIコンテキスト（将来の実装で使用）
export interface AuthenticatedRequestContext extends RequestContext {
  session: NonNullable<RequestContext['session']>;
}