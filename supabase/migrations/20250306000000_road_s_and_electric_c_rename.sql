-- ロードバイク S 追加 / 電動C M→S, L→M リネーム
-- アプリの車種変更に合わせてDBを更新

-- =========================================================
-- 1. 電動C のリネーム（既存データを新しい車種名に移行）
-- =========================================================

-- 1-1. stock: 電動C M → 電動C S、電動C L → 電動C M
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- 電動C M → 電動C S（同じ日付に 電動C S がなければ UPDATE、あれば合算して削除）
  FOR rec IN SELECT date FROM stock WHERE bike_type = '電動C M'
  LOOP
    IF EXISTS (SELECT 1 FROM stock WHERE date = rec.date AND bike_type = '電動C S') THEN
      UPDATE stock
      SET base_quantity = base_quantity + (SELECT base_quantity FROM stock WHERE date = rec.date AND bike_type = '電動C M'),
          manual_adjustment = manual_adjustment + (SELECT manual_adjustment FROM stock WHERE date = rec.date AND bike_type = '電動C M'),
          reserved = reserved + (SELECT reserved FROM stock WHERE date = rec.date AND bike_type = '電動C M'),
          available = available + (SELECT available FROM stock WHERE date = rec.date AND bike_type = '電動C M'),
          updated_at = NOW()
      WHERE date = rec.date AND bike_type = '電動C S';
      DELETE FROM stock WHERE date = rec.date AND bike_type = '電動C M';
    ELSE
      UPDATE stock SET bike_type = '電動C S', updated_at = NOW() WHERE date = rec.date AND bike_type = '電動C M';
    END IF;
  END LOOP;

  -- 電動C L → 電動C M（同じ日付に 電動C M がなければ UPDATE、あれば合算して削除）
  FOR rec IN SELECT date FROM stock WHERE bike_type = '電動C L'
  LOOP
    IF EXISTS (SELECT 1 FROM stock WHERE date = rec.date AND bike_type = '電動C M') THEN
      UPDATE stock
      SET base_quantity = base_quantity + (SELECT base_quantity FROM stock WHERE date = rec.date AND bike_type = '電動C L'),
          manual_adjustment = manual_adjustment + (SELECT manual_adjustment FROM stock WHERE date = rec.date AND bike_type = '電動C L'),
          reserved = reserved + (SELECT reserved FROM stock WHERE date = rec.date AND bike_type = '電動C L'),
          available = available + (SELECT available FROM stock WHERE date = rec.date AND bike_type = '電動C L'),
          updated_at = NOW()
      WHERE date = rec.date AND bike_type = '電動C M';
      DELETE FROM stock WHERE date = rec.date AND bike_type = '電動C L';
    ELSE
      UPDATE stock SET bike_type = '電動C M', updated_at = NOW() WHERE date = rec.date AND bike_type = '電動C L';
    END IF;
  END LOOP;
END $$;

-- 1-2. bike_master: 電動C M → 電動C S、電動C L → 電動C M
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bike_master') THEN
    IF EXISTS (SELECT 1 FROM bike_master WHERE bike_type = '電動C M') THEN
      IF EXISTS (SELECT 1 FROM bike_master WHERE bike_type = '電動C S') THEN
        DELETE FROM bike_master WHERE bike_type = '電動C M';
      ELSE
        UPDATE bike_master SET bike_type = '電動C S', updated_at = NOW() WHERE bike_type = '電動C M';
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM bike_master WHERE bike_type = '電動C L') THEN
      IF EXISTS (SELECT 1 FROM bike_master WHERE bike_type = '電動C M') THEN
        DELETE FROM bike_master WHERE bike_type = '電動C L';
      ELSE
        UPDATE bike_master SET bike_type = '電動C M', updated_at = NOW() WHERE bike_type = '電動C L';
      END IF;
    END IF;
  END IF;
END $$;

-- 1-3. reservations: bikes / bike_numbers のキーを 電動C M→S, 電動C L→M に更新
UPDATE reservations
SET
  bikes = (
    bikes - '電動C M' - '電動C L'
    || CASE WHEN bikes ? '電動C M' THEN jsonb_build_object('電動C S', bikes->'電動C M') ELSE '{}'::jsonb END
    || CASE WHEN bikes ? '電動C L' THEN jsonb_build_object('電動C M', bikes->'電動C L') ELSE '{}'::jsonb END
  ),
  bike_numbers = CASE
    WHEN bike_numbers ? '電動C M' OR bike_numbers ? '電動C L' THEN
      (bike_numbers - '電動C M' - '電動C L')
      || CASE WHEN bike_numbers ? '電動C M' THEN jsonb_build_object('電動C S', bike_numbers->'電動C M') ELSE '{}'::jsonb END
      || CASE WHEN bike_numbers ? '電動C L' THEN jsonb_build_object('電動C M', bike_numbers->'電動C L') ELSE '{}'::jsonb END
    ELSE bike_numbers
  END
WHERE bikes ? '電動C M' OR bikes ? '電動C L' OR bike_numbers ? '電動C M' OR bike_numbers ? '電動C L';

-- =========================================================
-- 2. ロードバイク S の追加
-- =========================================================

-- 2-1. bike_master に ロードバイク S を追加（テーブルがある場合）
INSERT INTO bike_master (bike_type, base_quantity, updated_at)
SELECT 'ロードバイク S', 0, NOW()
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bike_master')
  AND NOT EXISTS (SELECT 1 FROM bike_master WHERE bike_type = 'ロードバイク S');

-- 2-2. stock に ロードバイク S を全日付で追加（既存の日付範囲にのみ）
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  loop_date DATE;
BEGIN
  SELECT MIN(date), MAX(date) INTO start_date, end_date FROM stock;
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE;
    end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    INSERT INTO stock (date, bike_type, base_quantity, manual_adjustment, reserved, available)
    SELECT loop_date, 'ロードバイク S', 0, 0, 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM stock WHERE date = loop_date AND bike_type = 'ロードバイク S');
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- 2-3. 初期在庫（オプション: 既存の「最初の日」に1台など設定する場合はここで UPDATE）
-- 必要に応じて管理画面で設定可能なため、ここでは 0 のままとする
