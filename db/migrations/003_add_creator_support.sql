BEGIN TRANSACTION;

-- eventsテーブルにcreator_idカラムを追加
ALTER TABLE events ADD COLUMN creator_id TEXT;

-- 外部キー的な制約をコメントで記録（SQLiteの制限により）
-- creator_id は user.id を参照する

-- パフォーマンス向上のためのインデックス追加
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- 既存データの処理（開発環境の場合）
-- 既存のイベントがあれば、デフォルトのcreator_idを設定
-- UPDATE events SET creator_id = 'default_creator' WHERE creator_id IS NULL;

-- プレビュー・本番環境では既存データはNULLのまま保持
-- アプリケーション側で適切にハンドリング

COMMIT;