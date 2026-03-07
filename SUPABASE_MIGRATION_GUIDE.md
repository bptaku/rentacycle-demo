# Supabaseデータベース更新ガイド

## 📋 概要

自転車タイプの変更に合わせて、Supabaseのデータベースを更新する必要があります。

## ✅ 適用状況（既存Supabase）

- **2026-03-06**: `supabase/migrations/20250306000000_road_s_and_electric_c_rename.sql` を **SQL Editor で実行済み**
  - ロードバイク S 追加
  - 電動C のリネーム（旧 電動C M → 電動C S、旧 電動C L → 電動C M）
  - `reservations.bikes` / `reservations.bike_numbers` のキー移行
- **2026-03-06**: 「常に3ヶ月先まで予約可能」にするための運用SQLを **SQL Editor で手動実行**
  - 対象期間: `current_date` 〜 `current_date + interval '3 months'`
  - `bike_master.base_quantity` をソースに、同期間の `stock.base_quantity` を UPDATE / INSERT（不足行を生成）
  - `trg_update_available` により `available` も自動で整合
- **2026-03-06**: 「常に6ヶ月先まで予約可能」にするための **自動ジョブ** を設定
  - Postgres 関数 `public.sync_stock_next_6_months()` を作成  
    - 今日〜6ヶ月先の `stock` を最新の `bike_master.base_quantity` で UPDATE / INSERT
    - `trg_update_available` により `available` を再計算
  - Supabase の Cron（`cron.schedule` / Dashboard → Integrations → Cron）で、毎日 `select public.sync_stock_next_6_months();` を実行するジョブを作成

## ⚠️ 実行前の注意事項

1. **バックアップを取得**
   - Supabase Dashboard → Database → Backups からバックアップを取得
   - または、重要なデータをエクスポート

2. **テスト環境で実行**
   - 本番環境の前に、テスト環境で実行して動作確認

3. **実行タイミング**
   - 予約が入っていない時間帯に実行することを推奨
   - または、メンテナンスモードを有効にしてから実行

## 🚀 実行方法

### 方法1: Supabase Dashboardから実行（推奨）

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. SQL Editor を開く
4. `supabase/migrations/20250126000000_update_bike_types.sql` の内容をコピー
5. SQL Editorに貼り付け
6. 「Run」ボタンをクリックして実行

### 方法2: Supabase CLIから実行

```bash
# Supabase CLIがインストールされている場合
supabase db push
```

## 📝 マイグレーションの内容

### 1. 古い自転車タイプの移行

- `キッズ130以下` → `キッズ20インチ`
- `キッズ130以上` → `キッズ24インチ`
- `クロスバイク L` → `クロスバイク XL`
- `電動A L` → `電動A M`（統合）
- `電動B` → `電動B M`

### 2. 新しい自転車タイプの追加

以下の新しい自転車タイプの在庫レコードを作成：
- `キッズ26インチ`
- `クロスバイク XS`
- `ロードバイク S`（2025-03-06 追加）
- `ロードバイク M`
- `ロードバイク L`
- `電動B チャイルドシート`
- `電動C S`（旧 電動C M、2025-03-06 リネーム）
- `電動C M`（旧 電動C L、2025-03-06 リネーム）

**別マイグレーション（20250306000000）**: ロードバイク S の追加と電動C のリネーム（M→S, L→M）は `supabase/migrations/20250306000000_road_s_and_electric_c_rename.sql` で実行。

### 3. 初期在庫数の設定

指定されたストック数で初期在庫を設定（最初の日付のみ）

## 🔍 実行後の確認

### 1. stockテーブルの確認

```sql
-- 新しい自転車タイプが正しく作成されているか確認
SELECT DISTINCT bike_type 
FROM stock 
ORDER BY bike_type;

-- 初期在庫数が正しく設定されているか確認
SELECT bike_type, base_quantity, available
FROM stock
WHERE date = (SELECT MIN(date) FROM stock)
ORDER BY bike_type;
```

### 2. reservationsテーブルの確認

```sql
-- 古い自転車タイプが残っていないか確認
SELECT DISTINCT jsonb_object_keys(bikes) as bike_type
FROM reservations
WHERE bikes IS NOT NULL
ORDER BY bike_type;
```

### 3. 予約データの確認

```sql
-- 移行後の予約データを確認
SELECT id, bikes, bike_numbers
FROM reservations
WHERE bikes IS NOT NULL
LIMIT 10;
```

## 🛠️ トラブルシューティング

### 問題1: エラーが発生した場合

**症状**: SQL実行時にエラーが発生

**対処法**:
1. エラーメッセージを確認
2. 該当する部分だけを個別に実行
3. 必要に応じてロールバック

### 問題2: 古い自転車タイプが残っている

**症状**: 移行後も古い自転車タイプのデータが残っている

**対処法**:
```sql
-- 手動で確認・削除
SELECT * FROM stock WHERE bike_type IN ('キッズ130以下', 'キッズ130以上', 'クロスバイク L', '電動A L', '電動B');
```

### 問題3: 在庫数が0になっている

**症状**: 移行後、在庫数が0になっている

**対処法**:
- 管理画面から在庫数を再設定
- または、SQLで直接更新

```sql
-- 例: クロスバイク XSの在庫を5台に設定
UPDATE stock
SET base_quantity = 5, available = 5
WHERE bike_type = 'クロスバイク XS' AND date = '2025-01-26';
```

## 📊 実行後の作業

### 1. 在庫データの確認

管理画面（`/admin/stock`）で在庫数を確認し、必要に応じて調整してください。

### 2. 予約フォームの動作確認

新しい自転車タイプが正しく表示され、予約ができることを確認してください。

### 3. メール送信の確認

予約確認メールで、新しい自転車タイプ名が正しく表示されることを確認してください。

## 🔄 ロールバック（必要に応じて）

もし問題が発生した場合、バックアップから復元してください。

```sql
-- 注意: これは例です。実際のロールバックはバックアップから復元してください

-- 古い自転車タイプに戻す（例）
UPDATE stock SET bike_type = 'キッズ130以下' WHERE bike_type = 'キッズ20インチ';
UPDATE stock SET bike_type = 'キッズ130以上' WHERE bike_type = 'キッズ24インチ';
-- ... など
```

## ✅ 完了チェックリスト

- [ ] バックアップを取得
- [ ] マイグレーションSQLを実行
- [ ] stockテーブルの確認
- [ ] reservationsテーブルの確認
- [ ] 管理画面で在庫数を確認
- [ ] 予約フォームで動作確認
- [ ] メール送信の確認

問題が発生した場合は、バックアップから復元して、問題を解決してから再実行してください。

