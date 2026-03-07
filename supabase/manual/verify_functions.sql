-- =========================================================
-- トリガー用関数・RPC の定義取得（Supabase のみにあるものを把握する用）
-- =========================================================
-- 使い方:
-- 1. Supabase Dashboard → SQL Editor で実行
-- 2. 結果を Cursor に貼り付けると、リポジトリに記録したりマイグレーション化できる
-- =========================================================

-- 【A】reservations に張られているトリガーと、そのトリガーが呼ぶ関数名
SELECT
  t.trigger_name AS "トリガー名",
  t.event_manipulation AS "イベント",
  t.action_timing AS "タイミング",
  t.action_statement AS "呼び出し関数"
FROM information_schema.triggers t
WHERE t.event_object_schema = 'public'
  AND t.event_object_table = 'reservations'
ORDER BY t.trigger_name;


-- 【B】関数 restore_stock_after_cancel_v5_0 の定義（リポジトリにあるもの・確認用）
SELECT pg_get_functiondef(oid) AS "定義"
FROM pg_proc
WHERE proname = 'restore_stock_after_cancel_v5_0';


-- 【C】関数 decrease_stock_* 系（予約INSERT時に在庫を減らす側・リポジトリにない想定）
-- 名前は Supabase 次第なので、reservations の INSERT トリガーから参照している関数名を【A】で確認し、その名前で検索
SELECT proname AS "関数名"
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND (proname LIKE '%decrease%stock%' OR proname LIKE '%reservation%')
ORDER BY proname;


-- 【D】上で見つかった「予約INSERT時在庫減算」関数の定義を取得する場合
-- （【A】の action_statement に出てくる関数名に置き換えて実行）
-- 例: trg_decrease_stock_after_reservation_v5_0 が EXECUTE FUNCTION xxx() なら、xxx を下の 'decrease_stock_after_reservation_v5_0' に合わせる
SELECT pg_get_functiondef(oid) AS "定義"
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname = 'decrease_stock_after_reservation_v5_0';


-- 【E】RPC check_availability_with_period_v5_0 の定義（在庫確認APIが呼んでいるもの）
SELECT pg_get_functiondef(oid) AS "定義"
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname = 'check_availability_with_period_v5_0';
