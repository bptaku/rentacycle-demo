# テスト環境を Vercel にアップしてクライアントにチェックしてもらう

## フォルダ名を `kisocycle-test` に変更した場合

**コードや設定で追加ですることはありません。**

- **Git / GitHub**: リポジトリは「リモートの URL」で識別されるため、**ローカルのフォルダ名**を変えても影響しません。今まで通り `git push` すれば同じリポジトリに反映されます。
- **Vercel**: GitHub の**リポジトリ**と紐付いているため、リポジトリ名や URL が同じなら、フォルダ名変更前と同じようにデプロイできます。
- **package.json**: すでに `"name": "kisocycle-test"` になっているので、npm プロジェクト名も一致しています。

**補足**: GitHub 上でリポジトリ名も `kisocycle-test` にしている場合は、Vercel は従来のリポジトリ URL のままでも（GitHub のリダイレクトで）動作することが多いです。不安な場合は Vercel の Project Settings → Git で接続を確認してください。

---

## 手順：Vercel にアップする（GitHub 経由）

### 1. コードを GitHub に push

```bash
git add .
git commit -m "Deploy test environment for client review"
git push origin main
```

（ブランチ名が `main` でない場合は `master` など、利用しているブランチに読み替えてください。）

### 2. Vercel でプロジェクトを用意

- **すでにこのリポジトリを Vercel にインポートしている場合**  
  → push するだけで自動でデプロイが走ります。次の「3. 環境変数」へ。

- **まだ Vercel にプロジェクトがない場合**
  1. [Vercel](https://vercel.com) にログイン
  2. **Add New… → Project**
  3. **Import Git Repository** で、このプロジェクトの GitHub リポジトリを選択
  4. プロジェクト名はそのまま（例: `kisocycle-test`）で **Deploy** を一度実行（後で環境変数を入れて再デプロイする）

### 3. 環境変数を Vercel に設定

Vercel Dashboard → 対象プロジェクト → **Settings → Environment Variables** で、`.env.local` と同じ**変数名**に、**同じ値**を設定します。

| 変数名 | 備考 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 必須 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必須 |
| `SUPABASE_SERVICE_ROLE_KEY` | 必須 |
| `ADMIN_BASIC_USER` | 必須（管理画面ログイン用） |
| `ADMIN_BASIC_PASSWORD` | 必須（強めのパスワード推奨） |
| `RESEND_API_KEY` | メール送信する場合 |
| `RESEND_FROM_EMAIL` | 同上 |
| `RESEND_SHOP_EMAIL` | 同上 |
| `NEXT_PUBLIC_BASE_URL` | **デプロイ後に設定推奨**（下記） |

**NEXT_PUBLIC_BASE_URL**  
一度デプロイして URL が決まったら、`https://あなたのプロジェクト名.vercel.app` を設定し、**再デプロイ**してください。メールのキャンセルリンクがこの URL を指すようになります。

### 4. デプロイ

- 上記で「Deploy」していない場合は、**Deploy** を実行
- 環境変数を追加・変更した場合は **Redeploy**（Deployments タブから最新のデプロイの ⋮ → Redeploy）

### 5. クライアントに渡すもの

- **URL**: `https://あなたのプロジェクト名.vercel.app`
- **管理画面**: `https://あなたのプロジェクト名.vercel.app/admin`
- **ログイン**: 環境変数で設定した `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` を共有（パスワードは安全な方法で）
- **確認用説明書**: **`docs/CLIENT_CHECK_GUIDE.md`** を共有する（URL・ログイン情報を追記してから PDF やメールで送付するとよい）

クライアントに確認してもらう項目は **`docs/TEST_GUIDE_PRELAUNCH.md`** の Step 2〜5 を参考にしてください。  
（トップ→予約→メールのキャンセルリンク→管理画面での承認まで一通り）

---

## よくある確認

- **ビルドが通るか**: ローカルで `npm run build` が成功していれば、Vercel でも同じコマンドでビルドされます。
- **パスワード保護**: テスト環境を Vercel の「Password Protection」でサイト全体にかける場合は `docs/VERCEL_PASSWORD_PROTECTION.md` を参照（Pro/Enterprise チームが必要）。
