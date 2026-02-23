-- 自転車タイプの更新マイグレーション
-- 新しい自転車タイプ構成に合わせてデータベースを更新

-- =========================================================
-- 1. 古い自転車タイプのデータを新しいタイプに移行
-- =========================================================

-- キッズ130以下 → キッズ20インチ（約115cm〜）
DO $$
DECLARE
  k_record RECORD;
BEGIN
  FOR k_record IN 
    SELECT date FROM stock WHERE bike_type = 'キッズ130以下'
  LOOP
    IF EXISTS (
      SELECT 1 FROM stock WHERE date = k_record.date AND bike_type = 'キッズ20インチ'
    ) THEN
      DELETE FROM stock WHERE date = k_record.date AND bike_type = 'キッズ130以下';
    ELSE
      UPDATE stock SET bike_type = 'キッズ20インチ' WHERE date = k_record.date AND bike_type = 'キッズ130以下';
    END IF;
  END LOOP;
END $$;

-- キッズ130以上 → キッズ24インチ（約130cm〜）
-- 注意: 26インチは新規なので、既存データは24インチに移行
DO $$
DECLARE
  k_record RECORD;
BEGIN
  FOR k_record IN 
    SELECT date FROM stock WHERE bike_type = 'キッズ130以上'
  LOOP
    IF EXISTS (
      SELECT 1 FROM stock WHERE date = k_record.date AND bike_type = 'キッズ24インチ'
    ) THEN
      DELETE FROM stock WHERE date = k_record.date AND bike_type = 'キッズ130以上';
    ELSE
      UPDATE stock SET bike_type = 'キッズ24インチ' WHERE date = k_record.date AND bike_type = 'キッズ130以上';
    END IF;
  END LOOP;
END $$;

-- クロスバイク S → クロスバイク S（サイズ範囲が変更されているが、Sのまま）
-- クロスバイク M → クロスバイク M（サイズ範囲が変更されているが、Mのまま）
-- クロスバイク L → クロスバイク XL（LがXLに変更）
DO $$
DECLARE
  c_record RECORD;
BEGIN
  FOR c_record IN 
    SELECT date FROM stock WHERE bike_type = 'クロスバイク L'
  LOOP
    IF EXISTS (
      SELECT 1 FROM stock WHERE date = c_record.date AND bike_type = 'クロスバイク XL'
    ) THEN
      DELETE FROM stock WHERE date = c_record.date AND bike_type = 'クロスバイク L';
    ELSE
      UPDATE stock SET bike_type = 'クロスバイク XL' WHERE date = c_record.date AND bike_type = 'クロスバイク L';
    END IF;
  END LOOP;
END $$;

-- クロスバイク XSは新規なので、既存データはそのまま

-- 電動A S → 電動A S（サイズ範囲が変更されているが、Sのまま）
-- 電動A M → 電動A M（サイズ範囲が変更されているが、Mのまま）
-- 電動A L → 削除（Lサイズがなくなったので、Mに統合するか削除）
-- 注意: 電動A Lのデータがある場合は、Mに移行するか手動で確認が必要
-- 電動A Lを電動A Mに統合（base_quantityを合算）
DO $$
DECLARE
  l_record RECORD;
BEGIN
  FOR l_record IN 
    SELECT date, base_quantity, manual_adjustment, reserved, available
    FROM stock
    WHERE bike_type = '電動A L'
  LOOP
    -- 同じ日付の電動A Mが既に存在するか確認
    IF EXISTS (
      SELECT 1 FROM stock
      WHERE date = l_record.date AND bike_type = '電動A M'
    ) THEN
      -- 既に存在する場合は、base_quantityを合算して更新
      UPDATE stock
      SET 
        base_quantity = base_quantity + COALESCE(l_record.base_quantity, 0),
        manual_adjustment = manual_adjustment + COALESCE(l_record.manual_adjustment, 0),
        reserved = reserved + COALESCE(l_record.reserved, 0),
        available = available + COALESCE(l_record.available, 0),
        updated_at = NOW()
      WHERE date = l_record.date AND bike_type = '電動A M';
      
      -- 電動A Lのレコードを削除
      DELETE FROM stock WHERE date = l_record.date AND bike_type = '電動A L';
    ELSE
      -- 存在しない場合は、bike_typeを更新
      UPDATE stock
      SET bike_type = '電動A M'
      WHERE date = l_record.date AND bike_type = '電動A L';
    END IF;
  END LOOP;
END $$;

-- 電動B → 電動B M（電動Bが電動B Mに変更）
-- 電動Bが既に存在する場合の処理
DO $$
DECLARE
  b_record RECORD;
BEGIN
  FOR b_record IN 
    SELECT date, base_quantity, manual_adjustment, reserved, available
    FROM stock
    WHERE bike_type = '電動B'
  LOOP
    -- 同じ日付の電動B Mが既に存在するか確認
    IF EXISTS (
      SELECT 1 FROM stock
      WHERE date = b_record.date AND bike_type = '電動B M'
    ) THEN
      -- 既に存在する場合は、base_quantityを合算して更新
      UPDATE stock
      SET 
        base_quantity = base_quantity + COALESCE(b_record.base_quantity, 0),
        manual_adjustment = manual_adjustment + COALESCE(b_record.manual_adjustment, 0),
        reserved = reserved + COALESCE(b_record.reserved, 0),
        available = available + COALESCE(b_record.available, 0),
        updated_at = NOW()
      WHERE date = b_record.date AND bike_type = '電動B M';
      
      -- 電動Bのレコードを削除
      DELETE FROM stock WHERE date = b_record.date AND bike_type = '電動B';
    ELSE
      -- 存在しない場合は、bike_typeを更新
      UPDATE stock
      SET bike_type = '電動B M'
      WHERE date = b_record.date AND bike_type = '電動B';
    END IF;
  END LOOP;
END $$;

-- 予約データはダミーのため、更新処理はスキップ
-- 必要に応じて、予約データをクリアまたは手動で更新してください

-- =========================================================
-- 2. 新しい自転車タイプの初期在庫データを作成
-- =========================================================

-- 今日から1年後までの日付で、新しい自転車タイプの在庫レコードを作成
-- 既存の日付範囲を確認して、その範囲で作成

DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  loop_date DATE;
  new_bike_types TEXT[] := ARRAY[
    'キッズ20インチ',
    'キッズ24インチ',
    'キッズ26インチ',
    'クロスバイク XS',
    'クロスバイク S',
    'クロスバイク XL',
    'ロードバイク M',
    'ロードバイク L',
    '電動B チャイルドシート',
    '電動C M',
    '電動C L'
  ];
  bike_type_var TEXT;
BEGIN
  -- 既存のstockテーブルから日付範囲を取得
  SELECT MIN(date), MAX(date) INTO start_date, end_date
  FROM stock;
  
  -- 日付範囲が取得できない場合は、今日から1年後まで
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE;
    end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;
  
  -- 各日付、各新しい自転車タイプに対して在庫レコードを作成
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    FOREACH bike_type_var IN ARRAY new_bike_types LOOP
      -- 既にレコードが存在しない場合のみ作成
      IF NOT EXISTS (
        SELECT 1 FROM stock
        WHERE date = loop_date AND stock.bike_type = bike_type_var
      ) THEN
        INSERT INTO stock (date, bike_type, base_quantity, manual_adjustment, reserved, available)
        VALUES (
          loop_date,
          bike_type_var,
          0, -- 初期在庫数は0（管理画面で設定）
          0,
          0,
          0
        );
      END IF;
    END LOOP;
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- =========================================================
-- 3. 初期在庫数の設定（指定されたストック数）
-- =========================================================

-- 注意: この部分は、既存の日付範囲の最初の日付に対してのみ設定します
-- 他の日付は管理画面から設定してください

DO $$
DECLARE
  first_date DATE;
BEGIN
  -- 最初の日付を取得
  SELECT MIN(date) INTO first_date FROM stock;
  
  IF first_date IS NOT NULL THEN
    -- キッズ
    UPDATE stock SET base_quantity = 1 WHERE date = first_date AND bike_type = 'キッズ20インチ';
    UPDATE stock SET base_quantity = 4 WHERE date = first_date AND bike_type = 'キッズ24インチ';
    UPDATE stock SET base_quantity = 2 WHERE date = first_date AND bike_type = 'キッズ26インチ';
    
    -- クロスバイク
    UPDATE stock SET base_quantity = 5 WHERE date = first_date AND bike_type = 'クロスバイク XS';
    UPDATE stock SET base_quantity = 6 WHERE date = first_date AND bike_type = 'クロスバイク S';
    UPDATE stock SET base_quantity = 5 WHERE date = first_date AND bike_type = 'クロスバイク M';
    UPDATE stock SET base_quantity = 7 WHERE date = first_date AND bike_type = 'クロスバイク XL';
    
    -- ロードバイク
    UPDATE stock SET base_quantity = 1 WHERE date = first_date AND bike_type = 'ロードバイク M';
    UPDATE stock SET base_quantity = 2 WHERE date = first_date AND bike_type = 'ロードバイク L';
    
    -- 電動A（シティ）
    UPDATE stock SET base_quantity = 4 WHERE date = first_date AND bike_type = '電動A S';
    UPDATE stock SET base_quantity = 17 WHERE date = first_date AND bike_type = '電動A M';
    
    -- 電動B（スポーティ）
    UPDATE stock SET base_quantity = 4 WHERE date = first_date AND bike_type = '電動B M';
    UPDATE stock SET base_quantity = 3 WHERE date = first_date AND bike_type = '電動B チャイルドシート';
    
    -- 電動C（スポーツ）
    UPDATE stock SET base_quantity = 2 WHERE date = first_date AND bike_type = '電動C M';
    UPDATE stock SET base_quantity = 0 WHERE date = first_date AND bike_type = '電動C L';
    
    -- availableを再計算（base_quantity - manual_adjustment - reserved）
    UPDATE stock
    SET available = COALESCE(base_quantity, 0) - COALESCE(manual_adjustment, 0) - COALESCE(reserved, 0)
    WHERE date = first_date;
  END IF;
END $$;

-- =========================================================
-- 4. bike_masterテーブルがある場合の更新（オプション）
-- =========================================================

-- bike_masterテーブルが存在し、かつlabelカラムがある場合のみ更新
DO $$
DECLARE
  has_bike_master BOOLEAN;
  has_label_column BOOLEAN;
BEGIN
  -- bike_masterテーブルの存在確認
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'bike_master'
  ) INTO has_bike_master;
  
  -- labelカラムの存在確認
  IF has_bike_master THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bike_master' 
      AND column_name = 'label'
    ) INTO has_label_column;
    
    -- labelカラムが存在する場合のみ更新処理を実行
    IF has_label_column THEN
      -- 新しい自転車タイプを追加（既に存在する場合はスキップ）
      INSERT INTO bike_master (bike_type, label, category)
      VALUES
        ('キッズ20インチ', 'キッズ 20インチ（約115cm〜）', 'キッズ'),
        ('キッズ24インチ', 'キッズ 24インチ（約130cm〜）', 'キッズ'),
        ('キッズ26インチ', 'キッズ 26インチ（約140cm〜）', 'キッズ'),
        ('クロスバイク XS', 'クロスバイク XS（150〜163cm）', 'クロスバイク'),
        ('クロスバイク S', 'クロスバイク S（157〜170cm）', 'クロスバイク'),
        ('クロスバイク XL', 'クロスバイク XL（180〜195cm）', 'クロスバイク'),
        ('ロードバイク M', 'ロードバイク M', 'ロードバイク'),
        ('ロードバイク L', 'ロードバイク L', 'ロードバイク'),
        ('電動B チャイルドシート', '電動B（スポーティ） チャイルドシート付き', '電動B'),
        ('電動C M', '電動C（スポーツ） M（170cm〜182cm前後）', '電動C'),
        ('電動C L', '電動C（スポーツ） L', '電動C')
      ON CONFLICT (bike_type) DO NOTHING;
      
      -- 既存の自転車タイプのラベルを更新
      UPDATE bike_master SET label = 'クロスバイク XS（150〜163cm）' WHERE bike_type = 'クロスバイク XS';
      UPDATE bike_master SET label = 'クロスバイク S（157〜170cm）' WHERE bike_type = 'クロスバイク S';
      UPDATE bike_master SET label = 'クロスバイク M（165〜177cm）' WHERE bike_type = 'クロスバイク M';
      UPDATE bike_master SET label = 'クロスバイク XL（180〜195cm）' WHERE bike_type = 'クロスバイク XL';
      UPDATE bike_master SET label = '電動A（シティ） S（146cm〜170cm）' WHERE bike_type = '電動A S';
      UPDATE bike_master SET label = '電動A（シティ） M（153cm〜185cm前後）' WHERE bike_type = '電動A M';
      UPDATE bike_master SET label = '電動B（スポーティ） M（156cm〜180cm前後）' WHERE bike_type = '電動B M';
      
      -- 古い自転車タイプを削除（または無効化）
      DELETE FROM bike_master WHERE bike_type IN ('キッズ130以下', 'キッズ130以上', 'クロスバイク L', '電動A L', '電動B');
    END IF;
  END IF;
END $$;

-- =========================================================
-- 5. コメント追加
-- =========================================================

COMMENT ON COLUMN stock.bike_type IS '自転車タイプ。新しい構成: キッズ(20/24/26インチ), クロスバイク(XS/S/M/XL), ロードバイク(M/L), 電動A(S/M), 電動B(M/チャイルドシート), 電動C(M/L)';

-- =========================================================
-- 6. クロスバイク Sのレコードが存在しない場合の追加処理
-- =========================================================

-- クロスバイク Sが既存の日付範囲に存在しない場合、レコードを作成
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  loop_date DATE;
BEGIN
  -- 既存のstockテーブルから日付範囲を取得
  SELECT MIN(date), MAX(date) INTO start_date, end_date
  FROM stock;
  
  -- 日付範囲が取得できない場合は、今日から1年後まで
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE;
    end_date := CURRENT_DATE + INTERVAL '1 year';
  END IF;
  
  -- 各日付に対してクロスバイク Sのレコードを作成（存在しない場合のみ）
  loop_date := start_date;
  WHILE loop_date <= end_date LOOP
    IF NOT EXISTS (
      SELECT 1 FROM stock
      WHERE date = loop_date AND stock.bike_type = 'クロスバイク S'
    ) THEN
      INSERT INTO stock (date, bike_type, base_quantity, manual_adjustment, reserved, available)
      VALUES (
        loop_date,
        'クロスバイク S',
        0,
        0,
        0,
        0
      );
    END IF;
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
  
  -- 最初の日付のクロスバイク Sの在庫数を6台に設定
  IF start_date IS NOT NULL THEN
    UPDATE stock
    SET base_quantity = 6,
        available = 6 - COALESCE(manual_adjustment, 0) - COALESCE(reserved, 0)
    WHERE date = start_date AND stock.bike_type = 'クロスバイク S';
  END IF;
END $$;

