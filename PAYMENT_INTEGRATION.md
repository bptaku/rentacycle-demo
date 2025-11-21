# 決済システム導入ガイド

システム運用開始後数ヶ月での決済システム導入に向けて、準備しておくと良いポイントをまとめました。

## 📋 目次

1. [現在のシステム状況](#現在のシステム状況)
2. [決済システム導入前に準備すること](#決済システム導入前に準備すること)
3. [決済システム選定のポイント](#決済システム選定のポイント)
4. [導入時の実装ポイント](#導入時の実装ポイント)
5. [データベーススキーマの拡張](#データベーススキーマの拡張)
6. [段階的な導入アプローチ](#段階的な導入アプローチ)

---

## 現在のシステム状況

### ✅ 既に実装されている機能

現在のシステムには、決済システム導入に向けて良い基盤が整っています：

1. **料金計算の仕組み**
   - `subtotal`: 基本料金
   - `addons_price`: オプション料金
   - `insurance_price`: 保険料
   - `dropoff_price`: 配達料
   - `discount`: 割引額
   - `total_price`: 合計金額

2. **支払い状態の管理**
   - `paid` フラグが既に予約データに含まれています（現在は `false` 固定）
   - 決済システム導入時にこのフラグを活用できます

3. **予約フロー**
   - 予約作成 → 確認メール送信 の流れが確立されています

### 🔍 確認すべきポイント

- 現在の予約フローでは、決済なしで予約が確定しています
- 決済システム導入時は、**「決済完了後に予約確定」**というフローに変更する必要があります

---

## 決済システム導入前に準備すること

### 1. 運用データの収集

数ヶ月間の運用で以下のデータを収集・分析しましょう：

#### 📊 収集すべきデータ

- **予約の傾向**
  - キャンセル率
  - ノーショー率
  - 予約から利用開始までの期間
  - 人気のプラン・車種

- **料金の傾向**
  - 平均予約金額
  - オプション利用状況
  - 割引の効果

- **顧客の傾向**
  - リピート率
  - 予約完了率（最後まで予約を完了する人の割合）

#### 💡 このデータの活用方法

- **決済タイミングの最適化**
  - キャンセル率が高い場合 → 事前決済でキャンセルを減らす
  - ノーショーが多い場合 → 保証金の導入を検討

- **決済方法の選定**
  - 平均金額に応じた決済手段の最適化
  - クレジットカード、コンビニ決済、銀行振込などのバランス

### 2. キャンセルポリシーの明確化

決済システム導入前に、以下を決めておきましょう：

- **キャンセル料金**
  - 何日前までのキャンセルは無料？
  - キャンセル料は何%？
  - 返金方法は？

- **返金ポリシー**
  - 返金は自動か手動か
  - 返金までの日数
  - 手数料の負担

### 3. 利用規約・特定商取引法の準備

決済システム導入時は、法的な要件も整備が必要です：

- 利用規約の整備
- 特定商取引法に基づく表記
- 個人情報保護方針
- 決済に関する注意事項

---

## 決済システム選定のポイント

### 日本の主要な決済サービス

#### 1. **Stripe（推奨）**
- **特徴**: 国際的なサービス、APIが優秀、ドキュメントが充実
- **手数料**: 3.6% + 40円（国内カード）
- **メリット**: 
  - 開発しやすい
  - セキュリティが高い
  - サブスクリプション対応
- **デメリット**: 
  - 日本語サポートが限定的
  - コンビニ決済には別サービスが必要

#### 2. **PayPal**
- **特徴**: 世界的に有名、簡単に導入可能
- **手数料**: 3.6% + 40円
- **メリット**: 
  - 導入が簡単
  - 多様な決済方法
- **デメリット**: 
  - 日本での普及率は低め

#### 3. **Pay.jp（ペイジェイ）**
- **特徴**: 日本企業、日本語サポート充実
- **手数料**: 3.25% + 40円
- **メリット**: 
  - 日本語サポート
  - 日本のビジネス慣行に合わせやすい
- **デメリット**: 
  - 国際的な知名度は低い

#### 4. **Square**
- **特徴**: 小規模事業者向け
- **手数料**: 3.25% + 40円
- **メリット**: 
  - シンプルな料金体系
  - オフライン決済にも対応
- **デメリット**: 
  - API機能が限定的

### 💡 推奨: Stripe

Next.js + Supabase構成では、**Stripe**が最も開発しやすく、将来の拡張性も高いです。

**理由:**
- Next.jsと相性が良い
- APIが充実している
- Webhook機能で自動化しやすい
- セキュリティが高い（PCI DSS準拠）

---

## 導入時の実装ポイント

### 1. 予約フローの変更

#### 現在のフロー
```
予約情報入力 → 予約確定 → 確認メール送信
```

#### 導入後のフロー
```
予約情報入力 → 決済画面 → 決済完了 → 予約確定 → 確認メール送信
```

### 2. 実装するAPIエンドポイント

#### A. 決済セッション作成
```typescript
// /api/payment/create-session
POST /api/payment/create-session
{
  "reservation_id": "...",
  "amount": 10000,
  "currency": "jpy"
}
```

#### B. 決済完了Webhook
```typescript
// /api/payment/webhook
POST /api/payment/webhook
// Stripeから自動的に呼ばれる
// 決済完了時にpaidフラグをtrueに更新
```

#### C. 決済状態確認
```typescript
// /api/payment/status
GET /api/payment/status?reservation_id=...
```

### 3. データベースの拡張

決済システム導入時に追加すべきカラム：

```sql
-- 決済情報テーブル（新規作成）
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'jpy',
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 予約テーブルに決済関連カラムを追加
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT, -- 'card', 'convenience', 'bank_transfer'
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid'; -- 'unpaid', 'paid', 'refunded', 'failed'

-- インデックス追加
CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
```

### 4. 予約APIの変更

#### `/api/reserve/route.ts` の変更点

**現在:**
- 予約情報を入力すると即座に予約が確定

**変更後:**
- 予約情報を入力 → 一時的に保存（`status: 'pending_payment'`）
- 決済完了後に予約確定（`status: 'reserved'`, `paid: true`）
- 決済が失敗した場合は一定時間後に自動キャンセル

```typescript
// 変更例（簡略版）
export async function POST(req: Request) {
  // ... 既存の検証処理 ...

  // 予約を一時的に保存（決済待ち状態）
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      // ... 既存のフィールド ...
      status: 'pending_payment', // 新規ステータス
      paid: false,
    })
    .select()
    .single();

  // Stripe決済セッションを作成
  const paymentIntent = await createPaymentIntent({
    amount: total_price,
    metadata: { reservation_id: data.id }
  });

  // 決済セッションIDを返す
  return Response.json({
    success: true,
    reservation_id: data.id,
    payment_client_secret: paymentIntent.client_secret,
  });
}
```

---

## データベーススキーマの拡張

### マイグレーションファイルの作成例

決済システム導入時に実行するマイグレーションファイル：

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_payment_system.sql

-- 1. 決済情報テーブル作成
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'jpy' CHECK (currency = 'jpy'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_method TEXT, -- 'card', 'convenience', 'bank_transfer'
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 予約テーブルに決済関連カラム追加
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed'));

-- 3. インデックス追加
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- 4. 既存の予約データの処理
-- 既存の予約は「未払い」として扱う
UPDATE reservations
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;

-- 5. コメント追加
COMMENT ON TABLE payments IS '決済情報テーブル';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe決済インテントID';
COMMENT ON COLUMN payments.status IS '決済状態: pending(処理中), succeeded(成功), failed(失敗), refunded(返金済み), canceled(キャンセル)';
COMMENT ON COLUMN reservations.payment_status IS '支払い状態: unpaid(未払い), paid(支払い済み), refunded(返金済み), failed(失敗)';
```

---

## 段階的な導入アプローチ

### フェーズ1: 準備期間（導入前）

1. **決済サービスアカウント作成**
   - Stripeアカウント作成（テストモードで開始）
   - テスト用APIキーを取得

2. **テスト環境での実装**
   - 決済フローの実装
   - Webhook処理の実装
   - テスト決済での動作確認

3. **UI/UXの設計**
   - 決済画面のデザイン
   - エラーハンドリング
   - ローディング状態の表示

### フェーズ2: 本番導入（段階的）

#### ステップ1: オプトイン方式で開始
- 「事前決済」と「従来どおり後払い」を選択可能にする
- 事前決済を選択した人のみ決済システムを使用

#### ステップ2: 全員に拡大
- 運営データを確認して問題がなければ、全員を事前決済に移行

#### ステップ3: 後払いの廃止
- 一定期間後、後払いオプションを廃止

### フェーズ3: 運用の最適化

1. **自動化**
   - 決済失敗時の自動リトライ
   - 未決済予約の自動キャンセル
   - 返金処理の自動化

2. **分析**
   - 決済成功率の監視
   - 決済方法別の分析
   - キャンセル率の変化を追跡

---

## 実装時の注意点

### ⚠️ セキュリティ

1. **APIキーの管理**
   - 環境変数で管理（`.env.local` に追加）
   - 本番環境のAPIキーは絶対に公開しない

2. **Webhook署名の検証**
   - StripeからのWebhookリクエストの署名を必ず検証
   - 不正なリクエストを防ぐ

3. **PCI DSS準拠**
   - クレジットカード情報は直接扱わない
   - StripeのCheckoutやElementsを使用

### ⚠️ エラーハンドリング

1. **決済失敗時の処理**
   - ユーザーに分かりやすいエラーメッセージ
   - 在庫の自動復元
   - 予約データのクリーンアップ

2. **タイムアウト処理**
   - 決済セッションの有効期限
   - 未完了決済の自動キャンセル

### ⚠️ テスト

1. **テストカードの使用**
   - Stripe提供のテストカードで動作確認
   - 様々なエラーケースをテスト

2. **Webhookのテスト**
   - Stripe CLIを使用してローカルでWebhookをテスト

---

## 決済システム導入時のチェックリスト

### 開発側

- [ ] 決済サービスアカウント作成（テストモード）
- [ ] 環境変数の設定（`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`）
- [ ] データベースマイグレーション作成・適用
- [ ] 決済セッション作成API実装
- [ ] Webhook処理API実装
- [ ] 予約フローの変更
- [ ] 決済画面のUI実装
- [ ] エラーハンドリング実装
- [ ] テストカードでの動作確認
- [ ] Webhook動作確認

### 運用側

- [ ] 利用規約の更新
- [ ] 特定商取引法に基づく表記の準備
- [ ] キャンセル・返金ポリシーの明確化
- [ ] 顧客サポート体制の準備
- [ ] 決済手数料の検討
- [ ] 会計システムとの連携確認

---

## 参考リソース

### Stripe

- [Stripe Japan](https://stripe.com/jp)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Next.js Integration](https://stripe.com/docs/payments/accept-a-payment?platform=nextjs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

### その他

- [特定商取引法](https://www.nochuri.co.jp/law/shitei_sho.html)
- [個人情報保護法](https://www.ppc.go.jp/personalinfo/)

---

## まとめ

決済システム導入は大きな変更ですが、現在のシステムは良い基盤が整っています：

✅ **既に準備されているもの**
- 料金計算の仕組み
- `paid` フラグ
- 予約フロー

🔧 **導入時に追加するもの**
- 決済情報テーブル
- 決済セッション作成API
- Webhook処理API
- 決済画面のUI

📊 **導入前に準備すること**
- 運用データの収集・分析
- キャンセルポリシーの明確化
- 利用規約の整備

数ヶ月の運用データを元に、最適な決済システムと導入タイミングを決めましょう！

