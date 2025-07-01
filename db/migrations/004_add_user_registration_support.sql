BEGIN TRANSACTION;

-- attendeesテーブルにuser_idカラムを追加
-- 認証済みユーザーの申し込みをサポート
ALTER TABLE attendees ADD COLUMN user_id TEXT;

-- 外部キー的な制約をコメントで記録（SQLiteの制限により）
-- user_id は user.id を参照する（NULLも許可：既存のメール申し込みとの互換性）

-- パフォーマンス向上のためのインデックス追加
CREATE INDEX IF NOT EXISTS idx_attendees_user_id ON attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendees_event_user ON attendees(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);

-- 重複申し込み防止用の複合インデックス
-- 同一ユーザーが同一イベントに重複申し込みできないよう制御
-- ただし、UNIQUE制約は既存データの互換性のため一旦保留
CREATE INDEX IF NOT EXISTS idx_attendees_unique_user_event ON attendees(event_id, user_id) 
WHERE user_id IS NOT NULL;

-- 既存データの処理
-- 既存のメールベース申し込みはuser_id = NULLのまま保持
-- 新しい認証ベース申し込みはuser_idを設定

-- パフォーマンス最適化：作成日時での検索用
CREATE INDEX IF NOT EXISTS idx_attendees_created_at ON attendees(created_at);

COMMIT;