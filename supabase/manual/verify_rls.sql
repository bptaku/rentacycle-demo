-- =========================================================
-- RLS（Row Level Security）の有効/無効を確認するSQL
-- =========================================================
-- 使い方: Supabase Dashboard → SQL Editor で実行し、
-- 結果を Cursor に貼り付けて記録しておくとよいです。
-- =========================================================

-- 【RLS】public スキーマのテーブルごとの RLS 有効状況
SELECT
  c.relname AS "テーブル名",
  c.relrowsecurity AS "RLS有効"
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;


-- 【ポリシー】RLS が有効なテーブルに対するポリシー一覧（ある場合のみ結果あり）
SELECT
  schemaname AS "スキーマ",
  tablename AS "テーブル名",
  policyname AS "ポリシー名",
  permissive,
  roles,
  cmd,
  qual AS "USING式",
  with_check AS "WITH CHECK式"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
