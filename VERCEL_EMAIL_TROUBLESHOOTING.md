# Vercelでのメール送信トラブルシューティング

## 問題: 予約確認メールが届かない

### 確認すべきポイント

#### 1. Vercelの環境変数設定

Vercel Dashboard → プロジェクト → Settings → Environment Variables で以下が設定されているか確認：

- ✅ `RESEND_API_KEY` - ResendのAPIキー
- ✅ `RESEND_FROM_EMAIL` - 送信元メールアドレス（テストなら `noreply@resend.dev` または `onboarding@resend.dev` 推奨）
- ✅ `NEXT_PUBLIC_BASE_URL` - キャンセル申請リンク用のベースURL（オプション）

**重要: 環境（Production / Preview）を選ぶ**  
`https://あなたのプロジェクト.vercel.app` で開くサイトは **Production** です。環境変数を **Production** に紐付けてください。Preview だけに設定していると本番URLではメールが送られません。

**設定方法:**
1. Vercel Dashboardにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下の環境変数を追加：
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  （Resendで発行したキー）
   RESEND_FROM_EMAIL = noreply@resend.dev
   ```
5. **環境を選択**: **Production**（本番URLで使うなら必須）、必要なら Preview も
6. Saveをクリック
7. **再デプロイが必要**（環境変数を変更した後は再デプロイが必要です）

#### 2. 再デプロイの確認

環境変数を追加・変更した後は、**必ず再デプロイ**してください。設定を変えただけでは、すでにデプロイされている関数には反映されません。

- Vercel Dashboard → Deployments → 最新のデプロイの ⋮（三点メニュー）→ **Redeploy**
- または GitHub に空コミットで push: `git commit --allow-empty -m "Trigger redeploy" && git push origin main`

#### 3. Vercelのログを確認

Vercel Dashboard → プロジェクト → Logs でエラーログを確認：

1. Deployments → 最新のデプロイを選択
2. Functions タブ → `/api/reserve` を選択
3. エラーメッセージを確認

**確認すべきエラー:**
- `RESEND_API_KEY is not set` → 環境変数が設定されていない
- `Unauthorized` → APIキーが無効
- その他のResendエラー

#### 4. Resendダッシュボードで確認

Resend Dashboard → Emails でメール送信履歴を確認：

1. [Resend Dashboard](https://resend.com/emails) にログイン
2. Emails セクションで送信履歴を確認
3. 送信されたメールの状態を確認（成功/失敗）

#### 5. メールが迷惑メールフォルダに入っている可能性

`@resend.dev` からのメールは、迷惑メールフォルダに入ることがあります：

- Gmail: 迷惑メールフォルダを確認
- Outlook: 迷惑メールフォルダを確認
- その他のメールクライアント: 迷惑メール・スパムフォルダを確認

### よくある問題と解決方法

#### 問題1: 環境変数が設定されていない

**症状:**
- Vercelのログに `RESEND_API_KEY is not set` が表示される

**解決方法:**
1. Vercel Dashboardで環境変数を設定
2. 再デプロイ

#### 問題2: APIキーが無効

**症状:**
- Resendダッシュボードで送信失敗が表示される
- Vercelのログに `Unauthorized` エラー

**解決方法:**
1. Resend Dashboard → API Keys でAPIキーを確認
2. 新しいAPIキーを生成
3. Vercelの環境変数を更新
4. 再デプロイ

#### 問題3: 環境変数のスコープが間違っている

**症状:**
- プレビュー環境では動くが本番環境では動かない（またはその逆）

**解決方法:**
1. Vercel Dashboard → Environment Variables
2. 各環境変数のスコープを確認
3. Production環境にも設定されているか確認

### デバッグ方法

#### Vercelのログをリアルタイムで確認

```bash
# Vercel CLIを使用してログを確認
vercel logs --follow
```

#### メール送信をテストする

Vercelの環境でメール送信をテストするには：

1. 予約をテストで作成
2. Vercel Dashboard → Logs で `/api/reserve` のログを確認
3. メール送信の成功/失敗メッセージを確認

### 本番環境での推奨設定

#### 環境変数

```
# 必須
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL = noreply@yourdomain.com

# 推奨（キャンセル申請リンク用）
NEXT_PUBLIC_BASE_URL = https://your-domain.com
```

#### Resendの独自ドメイン設定

本番環境では、`@resend.dev`ではなく独自ドメインを使用することを推奨：

1. Resend Dashboard → Domains
2. 独自ドメインを追加
3. DNS設定を追加
4. 検証完了後、`RESEND_FROM_EMAIL`を更新

### 次のステップ

1. ✅ Vercelの環境変数を確認・設定
2. ✅ 再デプロイ
3. ✅ Vercelのログを確認
4. ✅ Resendダッシュボードで送信履歴を確認
5. ✅ 迷惑メールフォルダを確認

問題が解決しない場合は、VercelのログとResendダッシュボードの情報を確認してください。

