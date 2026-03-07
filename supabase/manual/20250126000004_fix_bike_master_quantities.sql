-- =========================================================
-- bike_masterテーブルのbase_quantityを正しい値に修正するSQL
-- Supabase Dashboard → SQL Editor で実行してください
-- =========================================================

-- =========================================================
-- 修正が必要な自転車タイプのbase_quantityを更新
-- =========================================================

-- キッズ20インチ: 10台 → 1台
UPDATE bike_master
SET base_quantity = 1, updated_at = NOW()
WHERE bike_type = 'キッズ20インチ';

-- キッズ24インチ: 10台 → 4台
UPDATE bike_master
SET base_quantity = 4, updated_at = NOW()
WHERE bike_type = 'キッズ24インチ';

-- クロスバイク XL: 10台 → 7台
UPDATE bike_master
SET base_quantity = 7, updated_at = NOW()
WHERE bike_type = 'クロスバイク XL';

-- 電動B M: 10台 → 4台
UPDATE bike_master
SET base_quantity = 4, updated_at = NOW()
WHERE bike_type = '電動B M';

-- =========================================================
-- 更新後の確認
-- =========================================================

-- すべてのデータを確認
SELECT 
  bike_type as "自転車タイプ",
  base_quantity as "基本在庫数",
  updated_at as "更新日時"
FROM bike_master 
ORDER BY bike_type;

-- 期待される値との比較
WITH expected_values AS (
  SELECT 'キッズ20インチ' as bike_type, 1 as expected_qty
  UNION ALL SELECT 'キッズ24インチ', 4
  UNION ALL SELECT 'キッズ26インチ', 2
  UNION ALL SELECT 'クロスバイク XS', 5
  UNION ALL SELECT 'クロスバイク S', 6
  UNION ALL SELECT 'クロスバイク M', 5
  UNION ALL SELECT 'クロスバイク XL', 7
  UNION ALL SELECT 'ロードバイク M', 1
  UNION ALL SELECT 'ロードバイク L', 2
  UNION ALL SELECT '電動A S', 4
  UNION ALL SELECT '電動A M', 17
  UNION ALL SELECT '電動B M', 4
  UNION ALL SELECT '電動B チャイルドシート', 3
  UNION ALL SELECT '電動C M', 2
  UNION ALL SELECT '電動C L', 0
)
SELECT 
  bm.bike_type as "自転車タイプ",
  bm.base_quantity as "現在の値",
  ev.expected_qty as "期待される値",
  CASE 
    WHEN bm.base_quantity = ev.expected_qty THEN '✅ 正しい'
    ELSE '❌ 修正が必要'
  END as "状態"
FROM bike_master bm
JOIN expected_values ev ON bm.bike_type = ev.bike_type
ORDER BY bm.bike_type;


