ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS bike_numbers JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN reservations.bike_numbers IS '自転車番号を車種ごとに保管するJSONB。例: {"クロスバイク S": ["12", "34"] }';
