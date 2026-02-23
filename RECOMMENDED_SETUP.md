# 推奨セットアップガイド（月67件の予約規模向け）

## 📊 あなたの事業規模

- **繁忙期の月**: 200台（自転車の貸出数）
- **予約数**: 約67件/月
- **年間予想**: 約500〜800件

→ **小規模事業** → **Vercel Hobby（無料プラン）で十分**

---

## ✅ 推奨構成

### 構成図

```
┌─────────────────────────────────────┐
│  既存サイト（Xサーバー）              │
│  https://yourdomain.com              │
│  - トップページ                      │
│  - 会社情報                          │
│  - アクセス                          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  予約システム（Vercel - 無料）       │
│  https://reserve.yourdomain.com     │
│  - 予約フォーム                      │
│  - 在庫確認                          │
│  - 管理画面                          │
└─────────────────────────────────────┘
```

### コスト

| 項目 | 料金 |
|------|------|
| **Xサーバー（既存）** | 現在のまま（変更なし） |
| **Vercel（予約システム）** | **0円/月（無料）** |
| **Supabase（データベース）** | 無料プランで十分（月500MBまで） |
| **Resend（メール送信）** | 無料プランで十分（月3,000通まで） |
| **合計** | **0円/月** |

---

## 🚀 セットアップ手順

### ステップ1: Vercelアカウント作成（5分）

1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでサインアップ（推奨）
3. アカウント作成完了

### ステップ2: プロジェクトをデプロイ（10分）

1. Vercel Dashboard → "Add New..." → "Project"
2. GitHubリポジトリを選択（このプロジェクトをプッシュ）
3. プロジェクト設定：
   - Framework Preset: Next.js
   - Root Directory: `./`（そのまま）
   - Build Command: `npm run build`（自動検出）
   - Output Directory: `.next`（自動検出）
4. 環境変数を設定（後述）
5. "Deploy" をクリック

### ステップ3: 環境変数の設定

Vercel Dashboard → プロジェクト → Settings → Environment Variables で以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL = noreply@resend.dev
NEXT_PUBLIC_BASE_URL = https://reserve.yourdomain.com
```

**重要**: 各環境変数のスコープを「Production」「Preview」「Development」すべてに設定

### ステップ4: Xサーバーでサブドメイン設定（10分）

#### 4-1. サブドメインの追加

1. Xサーバーのサーバーパネルにログイン
2. 「ドメイン設定」→「サブドメイン設定」
3. サブドメイン名を入力（例: `reserve`）
4. ドメインを選択
5. 「確認画面へ進む」→「追加する」

#### 4-2. DNS設定の変更

1. 「DNSレコード設定」に移動
2. サブドメイン `reserve` のDNSレコードを確認
3. Vercel Dashboard → プロジェクト → Settings → Domains
4. カスタムドメイン `reserve.yourdomain.com` を追加
5. Vercelが表示するDNS設定をコピー

**Vercelが表示する設定例:**
```
A レコード:
  @ → 76.76.21.21

CNAME レコード:
  www → cname.vercel-dns.com
```

6. XサーバーのDNS設定で、`reserve` サブドメインのAレコードをVercelのIPに変更
   - または、CNAMEレコードを追加（Vercelが指定する値）

#### 4-3. DNS反映の確認

DNS設定の反映には数分〜24時間かかることがあります。確認方法：

```bash
# コマンドラインで確認
nslookup reserve.yourdomain.com

# または、オンラインツールで確認
# https://dnschecker.org/
```

### ステップ5: SSL証明書の自動設定（自動）

Vercelが自動的にSSL証明書（HTTPS）を設定します。数分で完了します。

### ステップ6: 動作確認（5分）

1. `https://reserve.yourdomain.com` にアクセス
2. 予約フォームが表示されることを確認
3. テスト予約を作成して動作確認
4. メールが届くことを確認

---

## 📋 チェックリスト

### デプロイ前

- [ ] GitHubにコードをプッシュ済み
- [ ] Supabaseプロジェクトを作成済み
- [ ] Resendアカウントを作成済み
- [ ] 環境変数の値を準備済み

### デプロイ後

- [ ] Vercelでデプロイ成功
- [ ] 環境変数が正しく設定されている
- [ ] サブドメインのDNS設定が完了
- [ ] `https://reserve.yourdomain.com` にアクセスできる
- [ ] SSL証明書が有効（鍵マークが表示される）
- [ ] 予約フォームが表示される
- [ ] テスト予約が作成できる
- [ ] 確認メールが届く

---

## 🔧 トラブルシューティング

### 問題1: DNS設定が反映されない

**症状**: `reserve.yourdomain.com` にアクセスできない

**解決方法**:
1. DNS設定の反映を待つ（最大24時間）
2. DNS設定が正しいか確認
3. Xサーバーのサポートに問い合わせ

### 問題2: 環境変数が反映されない

**症状**: エラーが発生する、データベースに接続できない

**解決方法**:
1. Vercel Dashboardで環境変数を確認
2. 環境変数のスコープを確認（Productionに設定されているか）
3. 再デプロイを実行

### 問題3: メールが届かない

**解決方法**:
- `VERCEL_EMAIL_TROUBLESHOOTING.md` を参照

---

## 💡 運用のヒント

### 月67件の予約規模での運用

1. **Vercelの無料プランで十分**
   - 制限に達する心配はありません
   - 将来的に予約数が増えても、まずは無料プランで様子を見てOK

2. **Supabaseの無料プランで十分**
   - 月500MBのデータベース容量
   - 予約データは1件あたり数KB程度なので、数千件まで対応可能

3. **Resendの無料プランで十分**
   - 月3,000通まで送信可能
   - 予約確認メール + キャンセルメール = 1予約あたり1〜2通
   - 月67件 × 2通 = 134通/月 → 余裕あり

### 将来的に予約数が増えた場合

- **月200件以上になったら**: Vercel Proプラン（月3,000円）を検討
- **月500件以上になったら**: Supabase Proプラン（月$25）を検討
- **現時点では無料プランで十分**

---

## 📞 サポート

問題が発生した場合：

1. Vercelのログを確認: Dashboard → Logs
2. Supabaseのログを確認: Dashboard → Logs
3. このドキュメントのトラブルシューティングを確認

---

## 🎉 完了

これで、既存のXサーバーのサイトをそのまま使いながら、最新の予約システムを無料で運用できます！

**総コスト: 0円/月**（既存のXサーバー費用のみ）

