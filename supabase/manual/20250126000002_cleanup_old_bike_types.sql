-- =========================================================
-- 古い自転車タイプの確認と削除SQL
-- Supabase Dashboard → SQL Editor で実行してください
-- =========================================================

-- =========================================================
-- 1. 古い自転車タイプがstockテーブルで使用されているか確認
-- =========================================================

-- 予期しない自転車タイプ（古いデータ）
WITH old_bike_types AS (
  SELECT unnest(ARRAY[
    'キッズ130以上',
    'キッズ130以下',
    'クロスバイク L',
    '電動A L',
    '電動B'
  ]) as bike_type
)
SELECT 
  ob.bike_type as "古い自転車タイプ",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM stock 
      WHERE stock.bike_type = ob.bike_type
    ) THEN '⚠️ stockで使用中'
    ELSE '✅ stockで未使用（削除可能）'
  END as "状態",
  COALESCE(
    (SELECT COUNT(*) FROM stock WHERE stock.bike_type = ob.bike_type),
    0
  ) as "stockでの使用件数"
FROM old_bike_types ob
ORDER BY ob.bike_type;

-- =========================================================
-- 2. 古い自転車タイプの詳細確認
-- =========================================================

-- stockテーブルで使用されている古い自転車タイプの詳細
SELECT 
  s.date as "日付",
  s.bike_type as "自転車タイプ",
  s.base_quantity as "基本在庫数",
  s.reserved as "予約済み",
  s.available as "利用可能数"
FROM stock s
WHERE s.bike_type IN (
  'キッズ130以上',
  'キッズ130以下',
  'クロスバイク L',
  '電動A L',
  '電動B'
)
ORDER BY s.bike_type, s.date
LIMIT 50;

-- =========================================================
-- 3. 古い自転車タイプをbike_masterから削除
-- =========================================================
-- ⚠️ 注意: このクエリを実行する前に、上記の確認クエリで
-- stockテーブルで使用されていないことを確認してください

-- stockテーブルで使用されていない古い自転車タイプを削除
-- 安全のため、まずはSELECTで確認してからDELETEを実行してください

-- 削除対象の確認（stockで未使用のもの）
SELECT 
  bm.bike_type as "削除対象",
  'bike_masterから削除されます' as "アクション"
FROM bike_master bm
WHERE bm.bike_type IN (
  'キッズ130以上',
  'キッズ130以下',
  'クロスバイク L',
  '電動A L',
  '電動B'
)
AND NOT EXISTS (
  SELECT 1 FROM stock 
  WHERE stock.bike_type = bm.bike_type
)
ORDER BY bm.bike_type;

-- 実際に削除する場合は、以下のコメントを外して実行してください
-- ⚠️ 実行前に必ずバックアップを取ってください
/*
DELETE FROM bike_master
WHERE bike_type IN (
  'キッズ130以上',
  'キッズ130以下',
  'クロスバイク L',
  '電動A L',
  '電動B'
)
AND NOT EXISTS (
  SELECT 1 FROM stock 
  WHERE stock.bike_type = bike_master.bike_type
);
*/

-- =========================================================
-- 4. 削除後の確認
-- =========================================================

-- 削除後に、期待される自転車タイプのみが残っているか確認
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
  COUNT(*) FILTER (WHERE bm.bike_type IS NOT NULL) as "期待されるタイプ数",
  COUNT(*) FILTER (WHERE bm.bike_type IS NULL) as "不足しているタイプ数",
  (SELECT COUNT(*) FROM bike_master) as "bike_masterの総件数"
FROM expected_bikes eb
LEFT JOIN bike_master bm ON eb.bike_type = bm.bike_type;


