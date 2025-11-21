# デプロイメントガイド

このドキュメントでは、テスト環境から本番環境への移行手順と、その後のアップデート方法について説明します。

## 📋 目次

1. [環境変数の設定](#環境変数の設定)
2. [テスト環境から本番環境への移行](#テスト環境から本番環境への移行)
3. [本番環境へのデプロイ](#本番環境へのデプロイ)
4. [その後のアップデート手順](#その後のアップデート手順)

---

## 環境変数の設定

このプロジェクトでは、以下の環境変数が必要です：

### 必要な環境変数

| 変数名 | 用途 | 公開範囲 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | 公開（ブラウザ側） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseの匿名キー | 公開（ブラウザ側） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseのサービスロールキー | 非公開（サーバー側のみ） |

### 環境変数の取得方法

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. Settings → API から以下を取得：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`（注意：このキーは非常に強力です）

---

## テスト環境から本番環境への移行

### ステップ1: 本番用Supabaseプロジェクトの作成

1. Supabaseで新しいプロジェクトを作成（本番環境用）
   - プロジェクト名: `rentacycle-production`など
   - リージョン: ユーザーに最も近い場所（日本なら`ap-northeast-1`）

2. 本番プロジェクトの環境変数をメモ
   - URL
   - anon key
   - service_role key

### ステップ2: データベースマイグレーションの適用

テスト環境で使っているマイグレーションファイルを本番環境に適用します：

```bash
# Supabase CLIを使用してマイグレーションを適用
npx supabase db push --project-ref <本番プロジェクトの参照ID>
```

または、Supabase Dashboardから手動で適用：

1. Supabase Dashboard → SQL Editor
2. `supabase/migrations/` フォルダ内のすべてのSQLファイルを時系列順に実行
   - `20250123000000_add_bike_numbers.sql`
   - `20250123000001_remove_adjust_stock_trigger.sql`
   - `20250123000002_fix_restore_stock_trigger.sql`
   - `20250123000003_add_dropoff.sql`
   - `20250124000000_add_insurance_plan.sql`
   - `20251022045447_remote_schema.sql`

### ステップ3: テストデータの移行（必要に応じて）

本番環境に必要な初期データがある場合：

1. テスト環境からデータをエクスポート
2. 本番環境にインポート
   - 注意：機密情報や個人情報は移行しないでください

### ステップ4: 環境変数の設定（ローカル環境）

ローカル開発用に `.env.local` ファイルを作成：

```bash
# .env.local（本番環境用の値）
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

**⚠️ 重要**: `.env.local` は `.gitignore` に含まれているため、Gitにはコミットされません。

---

## 本番環境へのデプロイ

### 方法1: Vercel（推奨）

Next.jsアプリケーションのデプロイにはVercelが最も簡単です。

#### ステップ1: Vercelアカウントの作成

1. [Vercel](https://vercel.com)にサインアップ（GitHubアカウントで連携可能）

#### ステップ2: プロジェクトのインポート

1. Vercel Dashboard → "Add New..." → "Project"
2. GitHubリポジトリを選択（このプロジェクトがGitHubにプッシュされている必要があります）
3. プロジェクトをインポート

#### ステップ3: 環境変数の設定（Vercel）

1. プロジェクト設定 → "Environment Variables"
2. 以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-production-service-role-key
```

3. 環境を選択：
   - **Production**: 本番環境用
   - **Preview**: PR用のプレビュー環境
   - **Development**: 開発環境用

4. "Save" をクリック

#### ステップ4: デプロイ

1. "Deploy" ボタンをクリック
2. デプロイが完了すると、本番URLが発行されます
   - 例: `https://rentacycle-demo.vercel.app`

#### ステップ5: カスタムドメインの設定（オプション）

1. Vercel Dashboard → Settings → Domains
2. カスタムドメインを追加
3. DNS設定を更新

### 方法2: その他のホスティングサービス

#### Netlify, Railway, Render など

基本的な流れは同じです：

1. プロジェクトをビルド: `npm run build`
2. 環境変数を設定
3. デプロイ

---

## その後のアップデート手順

### 通常のアップデートフロー

#### 1. ローカルで開発・テスト

```bash
# 開発サーバーを起動
npm run dev

# テストを実行（テストがある場合）
npm test
```

#### 2. コードの変更をコミット

```bash
# 変更をステージング
git add .

# コミット
git commit -m "機能追加: 〇〇を実装"

# リモートにプッシュ
git push origin main
```

#### 3. データベーススキーマの変更がある場合

新しいマイグレーションファイルを作成：

```bash
# Supabase CLIでマイグレーションファイルを生成
npx supabase migration new <マイグレーション名>
```

例：
```bash
npx supabase migration new add_new_feature
```

作成されたファイルにSQLを記述：

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
ALTER TABLE reservations ADD COLUMN new_column TEXT;
```

#### 4. テスト環境でマイグレーションを適用

```bash
# テスト環境のSupabaseプロジェクトに適用
npx supabase db push --project-ref <テストプロジェクトの参照ID>
```

#### 5. テスト環境で動作確認

1. テスト環境のURLでアプリケーションを確認
2. 新機能をテスト
3. バグがないか確認

#### 6. 本番環境へのデプロイ

##### A. 自動デプロイ（Vercelの場合）

`main` ブランチにプッシュすると、自動的にデプロイされます：

```bash
git push origin main
```

Vercelが自動的に：
- ビルドを実行
- 環境変数を適用
- デプロイを完了

##### B. データベースマイグレーションを本番に適用

**⚠️ 重要**: データベースの変更は慎重に行ってください。

```bash
# 本番環境にマイグレーションを適用
npx supabase db push --project-ref <本番プロジェクトの参照ID>
```

または、Supabase Dashboardから手動で：

1. Supabase Dashboard → SQL Editor
2. 新しいマイグレーションファイルの内容を実行
3. 動作確認

#### 7. 本番環境で動作確認

1. 本番URLでアプリケーションを確認
2. 新機能が正しく動作するか確認
3. パフォーマンスを確認

### アップデート時のベストプラクティス

#### ✅ 推奨事項

1. **バックアップを取る**: 本番データベースの変更前にバックアップを取得
2. **段階的なデプロイ**: 大きな変更は小さく分けてデプロイ
3. **ロールバック計画**: 問題が発生した場合のロールバック方法を事前に計画
4. **メンテナンスモード**: 大規模な変更時はメンテナンスモードを検討
5. **監視**: デプロイ後にエラーログやパフォーマンスを監視

#### ❌ 避けるべきこと

1. **金曜日の夜にデプロイ**: 週末に問題が発生する可能性
2. **テストなしのデプロイ**: 必ずテスト環境で確認
3. **本番環境での直接編集**: コードやデータベースを本番で直接編集しない
4. **環境変数の公開**: `.env.local` をGitにコミットしない

### 緊急時のロールバック

#### Vercelの場合

1. Vercel Dashboard → Deployments
2. 前のバージョンを選択
3. "Promote to Production" をクリック

#### データベースのロールバック

1. マイグレーションファイルの逆の操作を行うSQLを実行
2. または、事前に取得したバックアップから復元

---

## 環境の整理

### 開発フロー

```
開発 → テスト環境 → 本番環境
 ↓         ↓          ↓
ローカル  Supabase   Supabase
         (テスト)    (本番)
```

### 環境変数の管理

| 環境 | 設定場所 | 用途 |
|------|---------|------|
| ローカル開発 | `.env.local` | 開発時のテスト |
| テスト環境 | Vercel (Preview環境) | PRのレビュー |
| 本番環境 | Vercel (Production環境) | 実際のユーザー向け |

---

## トラブルシューティング

### よくある問題

#### 1. 環境変数が反映されない

- Vercelで環境変数を追加した後、再デプロイが必要です
- `.env.local` を変更した場合、開発サーバーを再起動してください

#### 2. マイグレーションエラー

- マイグレーションファイルの順序を確認
- SQLの構文エラーを確認
- Supabase Dashboardのログを確認

#### 3. ビルドエラー

- `npm run build` をローカルで実行してエラーを確認
- TypeScriptの型エラーを確認
- 依存関係が最新か確認: `npm install`

---

## 次のステップ

- [Next.js デプロイメントドキュメント](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase マイグレーションガイド](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Vercel ドキュメント](https://vercel.com/docs)

