# Supabase テーブル構造ドキュメント

このドキュメントは、Supabase Table Editor の現状をまとめたものです。

## 📊 テーブル一覧

### 1. `reservations` - 予約テーブル

予約情報を管理するメインテーブル。（※ Supabase 実機で確認済み）

| 順序 | カラム名 | 型 | NULL可 | デフォルト | 説明 |
|-----|---------|-----|--------|-----------|------|
| 1 | `id` | UUID | NO | `gen_random_uuid()` | 主キー |
| 2 | `created_at` | TIMESTAMPTZ | NO | `now()` | 作成日時 |
| 3 | `plan` | TEXT | NO | - | プラン名 |
| 4 | `start_date` | DATE | NO | - | レンタル開始日 |
| 5 | `end_date` | DATE | YES | - | レンタル終了日 |
| 6 | `start_time` | TEXT | YES | - | 開始時刻 |
| 7 | `pickup_time` | TEXT | YES | - | ピックアップ時刻 |
| 8 | `bikes` | JSONB | NO | - | 予約自転車（車種: 台数） |
| 9 | `addons` | JSONB | YES | - | オプション（車種ごと） |
| 10 | `total_price` | INTEGER | NO | - | 合計金額 |
| 11 | `name` | TEXT | YES | - | 予約者名 |
| 12 | `email` | TEXT | YES | - | メールアドレス |
| 13 | `paid` | BOOLEAN | NO | `false` | 支払い済みフラグ |
| 14 | `subtotal` | INTEGER | YES | `0` | 小計 |
| 15 | `addons_price` | INTEGER | YES | `0` | オプション料金 |
| 16 | `discount` | INTEGER | YES | `0` | 割引額 |
| 17 | `status` | TEXT | YES | `'confirmed'` | 予約ステータス |
| 18 | `bike_numbers` | JSONB | YES | `'{}'::jsonb` | 自転車番号（車種ごと） |
| 19 | `dropoff` | BOOLEAN | YES | `false` | ドロップオフ利用 |
| 20 | `insurance_plan` | TEXT | YES | `'none'` | 車両補償プラン |
| 21 | `insurance_price` | INTEGER | YES | `0` | 車両補償料金（円） |
| 22 | `dropoff_price` | INTEGER | YES | `0` | ドロップオフ料金（円） |
| 23 | `id_document_path` | TEXT | YES | - | 本人確認書類パス |
| 24 | `cancel_requested` | BOOLEAN | YES | `false` | キャンセル申請フラグ |
| 25 | `cancel_requested_at` | TIMESTAMPTZ | YES | - | キャンセル申請日時 |
| 26 | `cancel_reason` | TEXT | YES | - | キャンセル申請理由 |

**ステータス値（アプリで使用）:**  
`confirmed` / `reserved` / `in_use` / `dropoff_in_progress` / `completed` / `canceled` / `deleted`

**インデックス:**
- `reservations_pkey` - 主キー `(id)`
- `idx_reservations_cancel_requested` - キャンセル申請一覧用（部分インデックス: `cancel_requested = true`）

**トリガー:**
- `trg_decrease_stock_after_reservation_v5_0` - 予約 INSERT 時に在庫を減算
- `trg_restore_stock_after_cancel_v5_0` - キャンセル UPDATE 時に在庫を復元

**適用済み:** キャンセル申請用カラムは `20250125000000_add_cancel_request.sql` を SQL Editor で実行済み。

---

### 2. `stock` - 在庫テーブル

日付・車種ごとの在庫情報を管理。（※ Supabase 実機で確認済み）

| カラム名 | 型 | NULL可 | デフォルト | 説明 |
|---------|-----|--------|-----------|------|
| `bike_type` | TEXT | NO | - | 自転車タイプ（複合主キー） |
| `date` | DATE | NO | - | 日付（複合主キー） |
| `manual_adjustment` | INTEGER | YES | `0` | 手動調整数 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | 更新日時 |
| `base_quantity` | INTEGER | YES | `0` | 基本在庫数 |
| `reserved` | INTEGER | YES | `0` | 予約済み数 |
| `available` | INTEGER | YES | `0` | 利用可能数 |
| `id` | BIGINT | NO | - | サロゲートID |

**主キー:** `stock_pkey` は `(bike_type, date)` の複合一意。  
**インデックス:** `idx_stock_id` が `(id)` にあり。

**計算式:**
```
available = base_quantity - manual_adjustment - reserved
```

**自転車タイプ一覧:**
- キッズ: `キッズ20インチ`, `キッズ24インチ`, `キッズ26インチ`
- クロスバイク: `クロスバイク XS`, `クロスバイク S`, `クロスバイク M`, `クロスバイク XL`
- ロードバイク: `ロードバイク S`, `ロードバイク M`, `ロードバイク L`
- 電動A: `電動A S`, `電動A M`
- 電動B: `電動B M`, `電動B チャイルドシート`
- 電動C: `電動C S`, `電動C M`

**外部キー:**  
- `bike_type` → `bike_master.bike_type`（JOIN可能）

---

### 3. `bike_master` - 自転車マスターテーブル

自転車タイプのマスターデータ。（※ Supabase 実機で確認済み・3カラムのみ）

| カラム名 | 型 | NULL可 | デフォルト | 説明 |
|---------|-----|--------|-----------|------|
| `bike_type` | TEXT | NO | - | 自転車タイプ（主キー） |
| `base_quantity` | INTEGER | NO | - | 基本在庫数 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | 更新日時 |

**注意:** `label` / `category` はこのDBにはありません。コードで `bike_master(label, category)` を参照している場合は、該当カラムを追加するか SELECT から外してください。

---

## 🔄 テーブル間の関係

```
reservations (bikes: JSONB)
    ↓ (予約時に在庫を減算)
stock (reserved, available)
    ↓ (JOIN可能)
bike_master (bike_type)
```

## 📝 マイグレーション履歴

| 日付 | マイグレーション | 内容 |
|------|----------------|------|
| 2025-01-23 | `add_bike_numbers` | `bike_numbers` カラム追加 |
| 2025-01-23 | `remove_adjust_stock_trigger` | 古いトリガー削除 |
| 2025-01-23 | `fix_restore_stock_trigger` | 在庫復元トリガー修正 |
| 2025-01-23 | `add_dropoff` | `dropoff`, `dropoff_price` 追加 |
| 2025-01-24 | `add_insurance_plan` | `insurance_plan`, `insurance_price` 追加 |
| 2025-01-25 | `add_cancel_request` | キャンセル申請関連カラム追加（**SQL Editor で手動適用済み**） |
| 2025-01-26 | `update_bike_types` | 自転車タイプの移行・追加 |
| 2025-03-06 | `road_s_and_electric_c_rename` | ロードバイク S 追加・電動C リネーム（M→S, L→M）・予約JSONキー移行（**SQL Editor で手動適用済み（2026-03-06）**） |

## ⚠️ 注意事項

1. **`bike_master` テーブル**
   - 存在しない可能性があります
   - コードでは `LEFT JOIN` で安全に結合してください

2. **`stock` テーブルの `available`**
   - トリガーで自動計算されます
   - 手動で更新しないでください

3. **`reservations` テーブルの `status`**
   - `canceled` または `deleted` に変更されると、在庫が自動復元されます

4. **JSONB カラム**
   - `bikes`: `{"クロスバイク S": 2, "電動A M": 1}`
   - `addons`: `{"クロスバイク S": [{"A-PANNIER-SET": 1}]}`
   - `bike_numbers`: `{"クロスバイク S": ["12", "34"]}`

5. **トリガー・RPC**  
   詳細は [TRIGGERS_AND_FUNCTIONS.md](./TRIGGERS_AND_FUNCTIONS.md) を参照。予約INSERT時の在庫減算トリガーと在庫確認RPCは Supabase 側にのみ定義がある。

6. **RLS・Storage・Auth など**  
   テーブル以外の設定（RLS の有無、Storage の利用有無、Auth 未使用など）は [SETTINGS_AND_POLICIES.md](./SETTINGS_AND_POLICIES.md) を参照。RLS の確認には `manual/verify_rls.sql` を実行する。
