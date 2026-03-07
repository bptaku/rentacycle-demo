# トリガー・RPC 定義（Supabase 実機より取得）

このフォルダは、Supabase の SQL Editor で `verify_functions.sql` を実行して取得した関数定義を保存したものです。  
**マイグレーションではありません。** 参照・再適用用です。

| ファイル | 説明 |
|----------|------|
| `decrease_stock_after_reservation_v5_0.sql` | 予約 INSERT 時に在庫（reserved）を加算するトリガー用関数 |
| `restore_stock_after_cancel_v5_0.sql` | キャンセル UPDATE 時に在庫を復元するトリガー用関数 |
| `check_availability_with_period_v5_0.sql` | 在庫確認 RPC（/api/check-availability が呼ぶ） |

適用する場合は、Supabase Dashboard → SQL Editor で各ファイルの内容を実行してください。
