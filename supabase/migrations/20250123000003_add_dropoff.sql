ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS dropoff BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dropoff_price INTEGER DEFAULT 0;

COMMENT ON COLUMN reservations.dropoff IS 'ドロップオフサービス利用フラグ';
COMMENT ON COLUMN reservations.dropoff_price IS 'ドロップオフ料金（円）';
