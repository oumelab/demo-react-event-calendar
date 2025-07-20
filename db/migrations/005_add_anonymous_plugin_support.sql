-- 005_add_anonymous_plugin_support.sql
-- Anonymous認証プラグイン対応のためのスキーマ更新
-- Better Auth anonymous plugin 用の isAnonymous フィールドを追加

BEGIN TRANSACTION;

-- 1. userテーブルに isAnonymous カラムを追加
ALTER TABLE user ADD COLUMN isAnonymous BOOLEAN DEFAULT FALSE;

-- 2. インデックス追加（匿名ユーザーの検索を高速化）
CREATE INDEX IF NOT EXISTS idx_user_isAnonymous ON user(isAnonymous);

-- 3. 既存ユーザーは全て正規ユーザーとして扱う（DEFAULT FALSE により自動設定）
-- 新規の匿名ユーザーは Better Auth が自動的に isAnonymous = TRUE で作成

-- Migration completed: Anonymous plugin support added
COMMIT;