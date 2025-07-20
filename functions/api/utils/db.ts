// functions/api/utils/db.ts
// DB接続ユーティリティ(Web向けクライアントのみを使用)
import {createClient} from "@libsql/client/web";
import {LibsqlDialect} from "@libsql/kysely-libsql";
import {betterAuth} from "better-auth";
import {anonymous} from "better-auth/plugins";
import {createId} from "@paralleldrive/cuid2";
import type {Env} from "@shared/cloudflare-types";

// 既存のイベントAPI用クライアント
export function getDbClient(env: Env | undefined) {
  if (!env || !env.TURSO_DB_URL || !env.TURSO_DB_AUTH_TOKEN) {
    throw new Error("Database environment variables are required");
  }

  return createClient({
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_AUTH_TOKEN,
  });
}

// Better Auth用dialect
export function getLibsqlDialect(env: Env) {
  if (!env.TURSO_DB_URL || !env.TURSO_DB_AUTH_TOKEN) {
    throw new Error("Database environment variables are required");
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
  const isLocalDevelopment =
    env.ENVIRONMENT === "development" ||
    !env.TURSO_DB_URL?.includes(".turso.io");

  // 🆕 trustedOrigins の設定（環境に応じて動的設定）
  const trustedOrigins = isLocalDevelopment
    ? [
        "http://localhost:5173", // Vite 開発サーバー
        "http://localhost:8788", // Wrangler 開発サーバー
        "http://127.0.0.1:5173", // Vite（IPアドレス）
        "http://127.0.0.1:8788", // Wrangler（IPアドレス）
      ]
    : [
        // 本番・プレビュー環境の場合（実際のドメインに置き換える）
        "https://your-domain.pages.dev", // プレビュー環境
        "https://your-production-domain.com", // 本番環境
      ];

  // ✅ デバッグ用ログ追加
  console.log("🔍 Environment debug:", {
    ENVIRONMENT: env.ENVIRONMENT,
    hasTursoUrl: !!env.TURSO_DB_URL,
    includesTurso: env.TURSO_DB_URL?.includes(".turso.io"),
    isLocalDevelopment,
    trustedOrigins,
  });

  return betterAuth({
    database: {
      dialect,
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET || "dev-secret-min-32-chars",

    trustedOrigins,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },

    session: {
      expiresIn: 604800, // 7日（秒）
      updateAge: 86400, // 1日（秒）
      cookieCache: {
        enabled: false, // すべての環境で無効
        maxAge: 300, // 5分（セッション情報更新）
      },
      // freshAge: 60 * 60 * 24, // デフォルトで1日
      storeSessionInDatabase: true, // データベースにセッション保存
    },

    // Anonymous プラグイン追加
    plugins: [
      anonymous({
        emailDomainName: "demo-events.local", // プロジェクト専用ドメイン
        generateName: () => `ゲスト${Math.floor(Math.random() * 10000)}`, // 日本語対応
        onLinkAccount: async ({anonymousUser, newUser}) => {
          // 匿名ユーザーのデータを正規ユーザーに移行
          console.log(
            `🔄 匿名ユーザー ${anonymousUser.user.id} → 正規ユーザー ${newUser.user.id} にデータを移行しました`
          );

          try {
            const client = getDbClient(env);

            // 1. イベント申し込み履歴の移行
            const attendeesUpdateResult = await client.execute({
              sql: "UPDATE attendees SET user_id = ? WHERE user_id = ?",
              args: [newUser.user.id, anonymousUser.user.id],
            });

            console.log(
              `✅ 申し込み履歴 ${attendeesUpdateResult.rowsAffected} 件を移行完了`
            );

            // 2. 作成したイベントの移行（将来的に匿名ユーザーでも作成可能になった場合）
            const eventsUpdateResult = await client.execute({
              sql: "UPDATE events SET creator_id = ? WHERE creator_id = ?",
              args: [newUser.user.id, anonymousUser.user.id],
            });

            if (eventsUpdateResult.rowsAffected > 0) {
              console.log(
                `✅ 作成イベント ${eventsUpdateResult.rowsAffected} 件を移行完了`
              );
            }

            // 3. その他のユーザー関連データの移行（将来の拡張用）
            // 例：お気に入り、通知設定、閲覧履歴など

            console.log(
              `🎉 データ移行完了: ${anonymousUser.user.id} → ${newUser.user.id}`
            );
          } catch (error) {
            console.error("❌ データ移行中にエラーが発生:", error);

            // エラーが発生しても登録処理は継続させる
            // Better Auth のアカウント作成は成功させ、データ移行のみ失敗とする
            console.log(
              "⚠️ アカウント作成は完了、データ移行はスキップされました"
            );
          }
        },
      }),
    ],

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
