-- キャンセル申請機能のためのカラム追加

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS cancel_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

COMMENT ON COLUMN reservations.cancel_requested IS 'キャンセル申請があるか';
COMMENT ON COLUMN reservations.cancel_requested_at IS 'キャンセル申請日時';
COMMENT ON COLUMN reservations.cancel_reason IS 'キャンセル申請理由';

-- インデックス追加（キャンセル申請一覧を取得する際に使用）
CREATE INDEX IF NOT EXISTS idx_reservations_cancel_requested ON reservations(cancel_requested, cancel_requested_at)
WHERE cancel_requested = true;

