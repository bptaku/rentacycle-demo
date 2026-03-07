-- =========================================================
-- bike_masterテーブルの構造とデータを確認するSQL
-- Supabase Dashboard → SQL Editor で実行してください
-- =========================================================

-- =========================================================
-- 1. テーブルの存在確認と構造確認
-- =========================================================

-- テーブルが存在するか確認
SELECT 
  table_name as "テーブル名",
  table_type as "テーブルタイプ"
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'bike_master';

-- テーブルのコメントを確認（存在する場合）
SELECT 
  obj_description('public.bike_master'::regclass, 'pg_class') as "テーブルコメント";

-- テーブルのカラム情報を取得（詳細版）
SELECT 
  column_name as "カラム名",
  data_type as "データ型",
  character_maximum_length as "最大文字数",
  is_nullable as "NULL許可",
  column_default as "デフォルト値",
  col_description('public.bike_master'::regclass, ordinal_position) as "コメント"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bike_master'
ORDER BY ordinal_position;

-- 主キーや制約を確認
SELECT
  tc.constraint_name as "制約名",
  tc.constraint_type as "制約タイプ",
  kcu.column_name as "カラム名"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'bike_master';

-- インデックスを確認
SELECT
  indexname as "インデックス名",
  indexdef as "定義"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'bike_master';

-- =========================================================
-- 2. テーブルのデータを確認
-- =========================================================

-- まず、すべてのデータを取得（存在するカラムのみ）
SELECT * FROM bike_master ORDER BY bike_type LIMIT 10;

-- データ件数を確認
SELECT COUNT(*) as "総件数" FROM bike_master;

-- すべての自転車タイプを取得
SELECT bike_type as "自転車タイプ"
FROM bike_master 
ORDER BY bike_type;

-- categoryカラムが存在する場合の集計（エラーが出る場合はスキップ）
-- SELECT 
--   category as "カテゴリ",
--   COUNT(*) as "件数",
--   STRING_AGG(bike_type, ', ' ORDER BY bike_type) as "自転車タイプ一覧"
-- FROM bike_master
-- GROUP BY category
-- ORDER BY category;

-- =========================================================
-- 3. stockテーブルとの関連を確認
-- =========================================================

-- stockテーブルで使用されている自転車タイプを確認
SELECT DISTINCT bike_type as "使用中の自転車タイプ"
FROM stock 
WHERE bike_type IS NOT NULL
ORDER BY bike_type;

-- bike_masterに存在するが、stockで使用されていない自転車タイプ
SELECT 
  bike_type as "未使用の自転車タイプ"
FROM bike_master
WHERE bike_type NOT IN (
  SELECT DISTINCT bike_type 
  FROM stock 
  WHERE bike_type IS NOT NULL
)
ORDER BY bike_type;

-- stockで使用されているが、bike_masterに存在しない自転車タイプ
SELECT DISTINCT 
  stock.bike_type as "bike_masterに存在しない自転車タイプ",
  COUNT(*) as "stockでの使用回数"
FROM stock
WHERE stock.bike_type NOT IN (
  SELECT bike_type FROM bike_master
)
GROUP BY stock.bike_type
ORDER BY stock.bike_type;

-- =========================================================
-- 4. テーブルの使用状況を確認（実際のAPIでの使用例）
-- =========================================================

-- availability APIで使用されているか確認（JOINの例）
-- これは /api/availability で実際に使用されているクエリと同じ構造
-- 注意: labelやcategoryカラムが存在しない場合は、bike_typeのみを表示
SELECT 
  s.date as "日付",
  s.bike_type as "自転車タイプ",
  s.base_quantity as "基本在庫数",
  s.available as "利用可能数"
FROM stock s
LEFT JOIN bike_master bm ON s.bike_type = bm.bike_type
WHERE s.date = (SELECT MIN(date) FROM stock)
ORDER BY s.bike_type
LIMIT 30;

-- JOINできない（bike_masterに存在しない）stockレコードを確認
SELECT 
  s.date,
  s.bike_type,
  s.available,
  'bike_masterに存在しません' as status
FROM stock s
LEFT JOIN bike_master bm ON s.bike_type = bm.bike_type
WHERE bm.bike_type IS NULL
  AND s.date = (SELECT MIN(date) FROM stock)
ORDER BY s.bike_type
LIMIT 20;

-- =========================================================
-- 5. テーブルの整合性チェック
-- =========================================================

-- 新しい自転車タイプ構成とbike_masterの比較
-- 期待される自転車タイプ
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

-- bike_masterに存在するが、期待されるリストにない自転車タイプ
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
  bm.bike_type as "予期しない自転車タイプ",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM stock 
      WHERE stock.bike_type = bm.bike_type
    ) THEN '⚠️ stockで使用中（削除不可）'
    ELSE '✅ stockで未使用（削除可能）'
  END as "状態",
  COALESCE(
    (SELECT COUNT(*) FROM stock WHERE stock.bike_type = bm.bike_type),
    0
  ) as "stockでの使用件数"
FROM bike_master bm
WHERE bm.bike_type NOT IN (SELECT bike_type FROM expected_bikes)
ORDER BY bm.bike_type;

