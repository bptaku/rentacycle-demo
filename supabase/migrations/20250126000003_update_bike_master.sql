-- =========================================================
-- bike_masterテーブルの現在のデータを確認して更新するSQL
-- Supabase Dashboard → SQL Editor で実行してください
-- =========================================================

-- =========================================================
-- ステップ1: 現在のbike_masterテーブルのデータを確認
-- =========================================================

-- すべてのデータを取得
SELECT * FROM bike_master ORDER BY bike_type;

-- データ件数を確認
SELECT COUNT(*) as "現在の件数" FROM bike_master;

-- =========================================================
-- ステップ2: 既存の自転車タイプを新しい名前に更新し、base_quantityも更新
-- =========================================================

-- キッズ130以下 → キッズ20インチ（1台）
UPDATE bike_master
SET bike_type = 'キッズ20インチ', base_quantity = 1, updated_at = NOW()
WHERE bike_type = 'キッズ130以下';

-- キッズ130以上 → キッズ24インチ（4台）
UPDATE bike_master
SET bike_type = 'キッズ24インチ', base_quantity = 4, updated_at = NOW()
WHERE bike_type = 'キッズ130以上';

-- クロスバイク S → base_quantityを6台に更新
UPDATE bike_master
SET base_quantity = 6, updated_at = NOW()
WHERE bike_type = 'クロスバイク S';

-- クロスバイク M → base_quantityを5台に更新
UPDATE bike_master
SET base_quantity = 5, updated_at = NOW()
WHERE bike_type = 'クロスバイク M';

-- クロスバイク L → クロスバイク XL（7台）
UPDATE bike_master
SET bike_type = 'クロスバイク XL', base_quantity = 7, updated_at = NOW()
WHERE bike_type = 'クロスバイク L';

-- 電動A S → base_quantityを4台に更新
UPDATE bike_master
SET base_quantity = 4, updated_at = NOW()
WHERE bike_type = '電動A S';

-- 電動A M → base_quantityを17台に更新
UPDATE bike_master
SET base_quantity = 17, updated_at = NOW()
WHERE bike_type = '電動A M';

-- 電動B → 電動B M（4台）
UPDATE bike_master
SET bike_type = '電動B M', base_quantity = 4, updated_at = NOW()
WHERE bike_type = '電動B';

-- =========================================================
-- ステップ3: 不要な自転車タイプを削除
-- =========================================================

-- 電動A Lを削除（新しい構成に存在しない）
DELETE FROM bike_master
WHERE bike_type = '電動A L';

-- =========================================================
-- ステップ4: 新しい自転車タイプを追加（正しいbase_quantityを設定）
-- =========================================================

-- 新しい自転車タイプを追加（既に存在する場合はスキップ）
INSERT INTO bike_master (bike_type, base_quantity, updated_at)
VALUES 
  ('キッズ26インチ', 2, NOW()),                    -- 約140cm〜　2台
  ('クロスバイク XS', 5, NOW()),                   -- 150〜163cm 5台
  ('ロードバイク M', 1, NOW()),                    -- 1台
  ('ロードバイク L', 2, NOW()),                    -- 2台
  ('電動B チャイルドシート', 3, NOW()),              -- チャイルドシート付き 3台
  ('電動C M', 2, NOW()),                          -- 170cm〜182cm前後　2台
  ('電動C L', 0, NOW())                            -- 0台
ON CONFLICT (bike_type) DO UPDATE
SET base_quantity = EXCLUDED.base_quantity, updated_at = NOW();

-- =========================================================
-- ステップ5: 更新後の確認
-- =========================================================

-- 更新後のすべてのデータを確認（base_quantityも含む）
SELECT 
  bike_type as "自転車タイプ",
  base_quantity as "基本在庫数",
  updated_at as "更新日時"
FROM bike_master 
ORDER BY bike_type;

-- 期待される自転車タイプと比較
WITH expected_bikes AS (
  SELECT unnest(ARRAY[
    'キッズ20インチ',
    'キッズ24インチ',
    'キッズ26インチ',
    'クロスバイク XS',
    'クロスバイク S',
    'クロスバイク M',
    'クロスバイク XL',
    'ロードバイク M',
    'ロードバイク L',
    '電動A S',
    '電動A M',
    '電動B M',
    '電動B チャイルドシート',
    '電動C M',
    '電動C L'
  ]) as bike_type
)
SELECT 
  eb.bike_type as "期待される自転車タイプ",
  CASE 
    WHEN bm.bike_type IS NOT NULL THEN '✅ 存在'
    ELSE '❌ 存在しない'
  END as "状態"
FROM expected_bikes eb
LEFT JOIN bike_master bm ON eb.bike_type = bm.bike_type
ORDER BY eb.bike_type;

-- 予期しない自転車タイプが残っていないか確認
WITH expected_bikes AS (
  SELECT unnest(ARRAY[
    'キッズ20インチ',
    'キッズ24インチ',
    'キッズ26インチ',
    'クロスバイク XS',
    'クロスバイク S',
    'クロスバイク M',
    'クロスバイク XL',
    'ロードバイク M',
    'ロードバイク L',
    '電動A S',
    '電動A M',
    '電動B M',
    '電動B チャイルドシート',
    '電動C M',
    '電動C L'
  ]) as bike_type
)
SELECT 
  bm.bike_type as "予期しない自転車タイプ"
FROM bike_master bm
WHERE bm.bike_type NOT IN (SELECT bike_type FROM expected_bikes)
ORDER BY bm.bike_type;

-- base_quantityの設定状況を確認
SELECT 
  bike_type as "自転車タイプ",
  base_quantity as "基本在庫数",
  CASE 
    WHEN base_quantity IS NULL THEN '⚠️ NULL'
    WHEN base_quantity = 0 THEN '⚠️ 0台'
    ELSE '✅ 設定済み'
  END as "状態"
FROM bike_master
ORDER BY bike_type;

