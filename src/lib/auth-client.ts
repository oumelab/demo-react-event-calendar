// src/lib/auth-client.ts (本番対応版)
import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

// 環境に応じたbaseURL取得関数k
function getBaseURL(): string {
    // ブラウザ環境での判定
  if (typeof window !== 'undefined') {
    // プレビュー環境（bun run preview）
    if (window.location.port === '4173') {
      return 'http://localhost:8788'; // Wrangler API サーバー
    }
    
    // 開発環境（bun run dev）
    if (window.location.hostname === 'localhost' && window.location.port === '5173') {
      return 'http://localhost:8788'; // Wrangler API サーバー
    }
    
    // 本番・プレビュー環境
    return window.location.origin;
  }
  
  // SSR等でwindowが無い場合のフォールバック
  return 'http://localhost:8788';
}

// Better Auth クライアント作成
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    anonymousClient(), // Anonymous プラグイン追加
  ],
});

// 🎯 Better Auth の型推論を使用
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user']; // Session から User 型を抽出

// TypeScript向けの型エクスポート
export type AuthClient = typeof authClient;