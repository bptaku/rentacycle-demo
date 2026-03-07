# 手動実行用SQL

このフォルダのSQLは **Supabase CLI のマイグレーションでは実行されません**。  
必要に応じて **Supabase Dashboard → SQL Editor** で手動実行してください。

| ファイル | 用途 |
|----------|------|
| `20250126000001_check_bike_master.sql` | bike_master の構造・データ確認 |
| `20250126000002_cleanup_old_bike_types.sql` | 古い自転車タイプの確認・削除 |
| `20250126000003_update_bike_master.sql` | bike_master の更新（名寄せ・追加・削除） |
| `20250126000004_fix_bike_master_quantities.sql` | base_quantity の修正 |
| `verify_schema.sql` | **スキーマ確認用**：Table Editor の現状を確認するSQL（Cursor と照合用） |
| `verify_functions.sql` | **トリガー・RPC確認用**：トリガー用関数と RPC の定義を取得（Cursor で把握する用） |
| `verify_rls.sql` | **RLS確認用**：テーブルごとの RLS 有効/無効とポリシー一覧を取得 |

実行順序はファイル名の番号順を推奨します。実行前にバックアップを取ってください。

### verify_schema.sql の使い方（スキーマ照合）

1. Supabase Dashboard → **SQL Editor** を開く  
2. `verify_schema.sql` を開き、**【1】〜【7】** のブロックを **1ブロックずつ** コピーして実行  
3. 各クエリの **結果（表の内容）** をコピー  
4. Cursor に「【1】の結果」「【2】の結果」…のように貼り付けて伝える  
5. こちらで `TABLE_SCHEMA.md` と照合し、必要なら修正します
