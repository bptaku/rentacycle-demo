# トリガー・関数・RPC 一覧

Supabase 上で動いているトリガーと、アプリから呼んでいる RPC の整理です。  
**実機で取得した定義**は `supabase/manual/definitions/` に保存済みです。

---

## トリガー（reservations テーブル）

| トリガー名 | イベント | タイミング | 呼び出し関数 | 定義（実機） |
|-----------|----------|------------|----------------|------------------|
| `trg_decrease_stock_after_reservation_v5_0` | INSERT | AFTER | `decrease_stock_after_reservation_v5_0()` | [definitions/decrease_stock_after_reservation_v5_0.sql](manual/definitions/decrease_stock_after_reservation_v5_0.sql) |
| `trg_restore_stock_after_cancel_v5_0` | UPDATE | AFTER | `restore_stock_after_cancel_v5_0()` | [definitions/restore_stock_after_cancel_v5_0.sql](manual/definitions/restore_stock_after_cancel_v5_0.sql) |

### 動作の前提

- **INSERT 時:** 新規予約の `bikes`（車種・台数）と `start_date`〜`end_date` に基づき、該当する `stock` の `reserved` を加算。`available` は `base_quantity - manual_adjustment - reserved` で決まる（※ `stock` 側の `trg_update_available` が計算）。
- **UPDATE 時:** `status` が **`reserved` または `in_use`** から `canceled` / `deleted` に変わったとき、その予約分だけ `stock.reserved` を減算。
  - **注意:** 実機の関数では **`dropoff_in_progress` は含まれていません**。migrations の `20250123000002_fix_restore_stock_trigger.sql` には含まれているため、ドロップオフ中にキャンセルした場合に在庫が復元されない可能性があります。必要なら Supabase 側の関数を実機定義に合わせて更新してください。

### その他の関数（未使用・旧版）

- `decrease_stock_after_reservation_v3_3`
- `decrease_stock_after_reservation_v4_1`  
→ 現在のトリガーは v5_0 のみ使用。

---

## トリガー（bike_master テーブル）

| トリガー名 | イベント | タイミング | 呼び出し関数 | 定義（実機） |
|-----------|----------|------------|----------------|------------------|
| `trg_sync_base_quantity_to_stock` | UPDATE（`base_quantity` のみ） | AFTER | `sync_base_quantity_to_stock()` | `AFTER UPDATE OF base_quantity ON public.bike_master` |

### 動作（実機）

- `bike_master` の更新を契機に、`stock` 側の `base_quantity` を同期する。
- 同期対象期間は **`NEW.updated_at::date` から 3ヶ月先まで**（日次でループして upsert）。
  - 既存レコードがあれば `UPDATE stock SET base_quantity = NEW.base_quantity, updated_at = now()`
  - なければ `INSERT stock(date, bike_type, base_quantity, manual_adjustment, reserved, updated_at)`（`manual_adjustment=0`, `reserved=0`）
- `available` は `stock` 側の `trg_update_available`（`update_available()`）で計算される。

### 注意点（運用上重要）

- 同期の起点が `NEW.updated_at::date` なので、**`bike_master` 更新時に `updated_at` を更新しないと、期待どおりに同期が走らない**可能性がある。  
 （アプリ側で `bike_master.updated_at` を更新する運用にしておくのが安全）
- 同期は「未来 3ヶ月」に限定される。3ヶ月より先まで `stock` を事前作成している場合、そちらは自動更新されない。

```sql
-- トリガー定義（発火条件）と、呼び出し関数名を確認
select
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and c.relname = 'bike_master'
  and t.tgname = 'trg_sync_base_quantity_to_stock'
  and not t.tgisinternal;

-- トリガー関数の定義（全文）
select
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_def
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and c.relname = 'bike_master'
  and t.tgname = 'trg_sync_base_quantity_to_stock'
  and not t.tgisinternal;
```

---

## トリガー（stock テーブル）

| トリガー名 | イベント | タイミング | 呼び出し関数 | 定義（実機） |
|-----------|----------|------------|----------------|------------------|
| `trg_update_available` | INSERT / UPDATE | BEFORE | `update_available()` | （実機より確認） |

### 動作

- `stock` の INSERT / UPDATE のたびに、`available` を次の式で更新する。

\[
available = base\_quantity - manual\_adjustment - reserved
\]

- 実機の `update_available()` は `coalesce(..., 0)` を使って null を 0 扱いにしている。
- 予約作成/キャンセル時の `reserved` 更新や、管理画面での `manual_adjustment` 更新に追従して `available` が整合するのは、このトリガーがあるため。

### 実機の関数定義（要約）

- `new.available := coalesce(new.base_quantity, 0) - coalesce(new.manual_adjustment, 0) - coalesce(new.reserved, 0);`
- `updated_at` はこの関数では更新しない（更新元の SQL が更新する前提）。

---

## RPC（アプリから呼び出し）

| RPC 名 | 用途 | 呼び出し元 | 定義（実機） |
|--------|------|------------|------------------|
| `check_availability_with_period_v5_0` | 車種・期間・希望台数で在庫確認 | `POST /api/check-availability` | [definitions/check_availability_with_period_v5_0.sql](manual/definitions/check_availability_with_period_v5_0.sql) |

### シグネチャ

- **引数:** `p_bike_type` (TEXT), `p_start_date` (DATE), `p_end_date` (DATE), `p_request_qty` (INTEGER)
- **戻り値 (JSON):**
  - 正常: `{ "available": boolean, "remaining": number }`  
    - `available`: 希望台数が確保可能か  
    - `remaining`: 期間内の日ごとの `stock.available` の最小値
  - 日付不正: `{ "available": false, "remaining": 0, "error": "invalid_date_range" }`
- **SECURITY DEFINER** で実行される。

---

## Cursor で把握しておくとよいこと

1. **在庫の増減**  
   予約 INSERT → `decrease_stock_after_reservation_v5_0` で `stock.reserved` 増。  
   予約を canceled/deleted に UPDATE → `restore_stock_after_cancel_v5_0` で `stock.reserved` 減。

2. **restore の条件**  
   実機は `OLD.status IN ('reserved','in_use')` のみ。`dropoff_in_progress` も復元したい場合は、Supabase の関数を `definitions/restore_stock_after_cancel_v5_0.sql` をベースに編集し、`('reserved', 'in_use', 'dropoff_in_progress')` に変更してから SQL Editor で実行する。

3. **在庫確認 API**  
   `/api/check-availability` はこの RPC の戻り `available` / `remaining` をそのまま返している。仕様変更時は RPC と API の両方を揃える。

4. **定義の再取得**  
   実機の定義を再取得する場合は `supabase/manual/verify_functions.sql` を SQL Editor で実行する。
