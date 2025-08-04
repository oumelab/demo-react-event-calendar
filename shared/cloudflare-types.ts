// shared/cloudflare-types.ts
export interface Env {
  // データベース関連（既存）
  TURSO_DB_URL?: string;
  TURSO_DB_AUTH_TOKEN?: string;
  
  // 認証関連（新規追加）
  BETTER_AUTH_SECRET?: string;
  
  // 環境設定（既存）
  ENVIRONMENT?: string;

  // R2 Bucket Binding (NEW)
  IMAGES_BUCKET: R2Bucket;
  
  // R2 公開URL（オプション - カスタムドメイン用）
  R2_PUBLIC_URL?: string;
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

// R2 Bucket Interface (Cloudflare Workers Types)
export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

export interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  expires?: Date;
}

export interface R2GetOptions {
  onlyIf?: R2Conditional;
  range?: R2Range;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  range?: R2Range;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

export interface R2Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}