ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS insurance_plan TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS insurance_price INTEGER DEFAULT 0;

COMMENT ON COLUMN reservations.insurance_plan IS '車両補償プラン: none, A, B, C';
COMMENT ON COLUMN reservations.insurance_price IS '車両補償料金（円）';
