# Supabase 設定で把握しておくこと

テーブル・トリガー・RPC 以外で、Cursor や運用で把握しておくとよい設定の一覧です。

---

## 1. Row Level Security（RLS）

- **現在の使い方:** アプリは **API ルート経由で `supabaseServer`（service_role）** のみ使用。**service_role は RLS を通過しない**ため、RLS が有効でもサーバー側の処理は影響を受けません。
- **把握しておくこと:**
  - 各テーブルで RLS が **有効かどうか** だけ把握しておくとよいです。
  - 将来、ブラウザから **anon key で直接** `supabase.from('reservations')` などする場合は、**ポリシー** の追加が必要になります。
- **確認方法:** `supabase/manual/verify_rls.sql` を SQL Editor で実行すると、テーブルごとの RLS 有効/無効とポリシー一覧を確認できます。

### 実機で確認したポリシー（Supabase 実機より）

| スキーマ | テーブル名 | ポリシー名 | 操作 | 内容 |
|----------|------------|------------|------|------|
| public | reservations | allow anon insert | INSERT | anon が予約を 1 件追加可能（WITH CHECK = true） |
| public | reservations | allow anon select | SELECT | anon が全行読み取り可能（USING = true） |
| public | stock | allow anon read stock | SELECT | anon が在庫を読み取りのみ可能 |

- **reservations:** anon で **INSERT** と **SELECT** が可能。UPDATE/DELETE 用ポリシーはなし（anon では更新・削除できない）。
- **stock:** anon では **SELECT のみ**。INSERT/UPDATE/DELETE 用ポリシーはなし。
- **bike_master:** ポリシー一覧には出てこない。RLS が無効なら anon も全操作可能。RLS が有効でポリシーがなければ anon はアクセス不可。

※ 現在のアプリは API ルートで **service_role** のみ使用しているため、上記ポリシーは「クライアントから anon で直接 DB を叩く場合」にのみ効きます。

---

## 2. Storage（ファイル保存）

- **現在の状態:** `reservations.id_document_path` というカラムはありますが、**アプリ内で Supabase Storage のアップロード/ダウンロードは未使用**です。
- **把握しておくこと:**
  - 本人確認書類などを Supabase Storage に保存する機能を **これから作る場合** は、以下が必要です。
    - **バケットの作成**（例: `id-documents`）
    - **Storage ポリシー**（誰がアップロード/閲覧できるか）
    - アップロード後に取得したパスを `id_document_path` に保存する処理
  - 現時点では「カラムだけ用意されている」と理解しておけば十分です。

---

## 3. Auth（認証）

- **現在の状態:** **Supabase Auth は未使用**です。`supabase.auth()` の呼び出しはありません。
- 管理画面などは、Next.js 側で別の認証（例: 環境変数や Vercel の保護）で守る想定です。Supabase 側の Auth 設定は触らなくて大丈夫です。

---

## 4. 環境変数（API キー）

| 変数名 | 用途 | 使う場所 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクト URL | ブラウザ・サーバー |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名キー | 主にサーバー（クライアントで直接 DB を叩いていない） |
| `SUPABASE_SERVICE_ROLE_KEY` | サービスロールキー | **サーバー専用**（全 API ルートで使用） |

※ 本番では **service_role** をクライアントに絶対に出さないこと。

---

## 5. まとめ（Cursor が把握しておくとよいこと）

| 項目 | 状態 | メモ |
|------|------|------|
| **RLS** | ポリシー確認済み（上記） | reservations: anon で INSERT/SELECT。stock: anon で SELECT のみ。service_role はバイパス。 |
| **Storage** | 未使用 | `id_document_path` 用に将来使う場合はバケット＋ポリシーを用意 |
| **Auth** | 未使用 | 変更不要 |
| **キー** | URL + anon + service_role | service_role はサーバーだけ |

必要に応じて `verify_rls.sql` を実行し、RLS の状態を確認・記録しておくと安心です。
