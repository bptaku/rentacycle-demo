-- =========================================================
-- Supabase Table Editor の現状確認用SQL
-- =========================================================
-- 使い方:
-- 1. Supabase Dashboard → SQL Editor を開く
-- 2. 以下のブロックを1つずつコピペして実行
-- 3. 結果をそのまま Cursor に貼り付けて教えてください
-- =========================================================

-- ---------------------------------------------------------
-- 【1】publicスキーマのテーブル一覧
-- 実行して「テーブル名」の結果をコピー
-- ---------------------------------------------------------
SELECT table_name AS "テーブル名"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;


-- ---------------------------------------------------------
-- 【2】reservations のカラム一覧
-- 実行して全行をコピー
-- ---------------------------------------------------------
SELECT
  ordinal_position AS "順序",
  column_name AS "カラム名",
  data_type AS "データ型",
  character_maximum_length AS "最大長",
  is_nullable AS "NULL可",
  column_default AS "デフォルト"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservations'
ORDER BY ordinal_position;


-- ---------------------------------------------------------
-- 【3】stock のカラム一覧
-- 実行して全行をコピー
-- ---------------------------------------------------------
SELECT
  ordinal_position AS "順序",
  column_name AS "カラム名",
  data_type AS "データ型",
  character_maximum_length AS "最大長",
  is_nullable AS "NULL可",
  column_default AS "デフォルト"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'stock'
ORDER BY ordinal_position;


-- ---------------------------------------------------------
-- 【4】bike_master のカラム一覧（テーブルがある場合のみ結果あり）
-- 実行して全行をコピー（0件なら「bike_masterは存在しない」でOK）
-- ---------------------------------------------------------
SELECT
  ordinal_position AS "順序",
  column_name AS "カラム名",
  data_type AS "データ型",
  character_maximum_length AS "最大長",
  is_nullable AS "NULL可",
  column_default AS "デフォルト"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bike_master'
ORDER BY ordinal_position;


-- ---------------------------------------------------------
-- 【5】reservations のインデックス一覧
-- 実行して全行をコピー
-- ---------------------------------------------------------
SELECT
  indexname AS "インデックス名",
  indexdef AS "定義"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reservations'
ORDER BY indexname;


-- ---------------------------------------------------------
-- 【6】reservations のトリガー一覧
-- 実行して全行をコピー
-- ---------------------------------------------------------
SELECT
  trigger_name AS "トリガー名",
  event_manipulation AS "イベント",
  action_timing AS "タイミング"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'reservations'
ORDER BY trigger_name;


-- ---------------------------------------------------------
-- 【7】stock のインデックス一覧
-- 実行して全行をコピー
-- ---------------------------------------------------------
SELECT
  indexname AS "インデックス名",
  indexdef AS "定義"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'stock'
ORDER BY indexname;
