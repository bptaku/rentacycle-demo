# 管理画面を守る「次のステップ」ガイド

「全然わからない」方向けに、**何を・なぜ・どうやるか**を順番に説明します。

> **今やること**: このガイドに沿って **環境変数だけ** 設定すれば、管理画面は Basic 認証で守られます。`src/middleware.ts` はすでにプロジェクトに追加済みです。

---

## 1. いま何が問題か（おさらい）

- **管理画面**（`/admin/reservations` や `/admin/stock`）に **ログインがなく**、URL を知っていれば誰でもアクセスできる。
- **管理用 API**（`/api/admin/...`）も **誰でも呼べる**。
- その結果、**予約一覧・在庫・売上**を誰でも見たり書き換えたりできる状態＝**セキュリティ的に危険**です。

**ゴール**:  
「管理画面と管理 API には、**正しい人（管理者）だけ**がアクセスできるようにする」ことです。

---

## 2. 守り方の選択肢（4つ）

| 方法 | 難易度 | 何ができるか | 向いている人 |
|------|--------|--------------|--------------|
| **A. Basic 認証** | かんたん | ブラウザで「ユーザー名・パスワード」を1回聞く。管理画面＋APIをまとめて守れる。 | とりあえずすぐ守りたい人 |
| **B. Vercel の保護** | かんたん | Vercel の「Deployment Protection」で**サイト全体**を1つのパスワードで保護できる（`/admin` だけは不可）。詳細は `docs/VERCEL_PASSWORD_PROTECTION.md`。 | 本番 or プレビュー全体をパスワードで守りたい人（Pro/Enterprise） |
| **C. Supabase Auth** | ふつう | ログイン画面を作り、メール/パスワードで「管理者」だけログインできるようにする。 | すでに Supabase を使っているので、同じサービスで完結させたい人 |
| **D. NextAuth** | やや難 | Google ログインなど、外部プロバイダで管理者を認証する。 | ソーシャルログインで管理画面を開きたい人 |

**おすすめの進め方**  
- **まず A（Basic 認証）** で「今すぐ穴を塞ぐ」。  
- 余裕が出たら **C（Supabase Auth）** で「ちゃんとしたログイン画面」に切り替える、という二段階が分かりやすいです。

以下は **A → その後 C をやりたい場合** の流れで書きます。

---

## 3. ステップ1: Basic 認証で「今すぐ」守る（約15分）

### 3.1 やることのイメージ

- ブラウザで `/admin` や `/api/admin/...` にアクセスすると、**まず「ユーザー名」と「パスワード」を聞く**。
- 正しい組み合わせを入力した人だけが、管理画面や API を使えるようにする。
- 実装は **Next.js のミドルウェア** で「`/admin` と `/api/admin` のときだけ Basic 認証を要求する」ようにします。

### 3.2 必要なもの

- **管理者用のユーザー名とパスワード**  
  例: ユーザー名 `admin`、パスワードは **推測されにくい長いランダムな文字列**（20文字以上がおすすめ）。
- これを **環境変数** に入れて、コードには直接書かないようにします。

### 3.3 環境変数を追加する

プロジェクトのルートにある `.env.local` を開き、次の2行を **追加** します（値はあなたが決めたものに変えてください）。

```bash
# 管理画面用 Basic 認証（本番では必ず強いパスワードに）
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASSWORD=ここに推測されにくい長いパスワードを入れる
```

- `ADMIN_BASIC_PASSWORD` は、**本番環境（Vercel など）の環境変数にも同じキーで設定**してください。

### 3.4 ミドルウェアについて（すでに作成済み）

Next.js では、**すべてのリクエストの最初に通る処理**を `middleware.ts` というファイルで書きます。このプロジェクトでは **すでに `src/middleware.ts` が用意されています**。中身は「`/admin` と `/api/admin` のときだけ Basic 認証をチェックする」動きです。

**あなたがやること**: 次の「3.3 環境変数を追加する」だけ済ませれば、すぐに動きます。

**中身のイメージ**（参考）:

1. リクエストの URL が `/admin` または `/api/admin` で始まっていなければ、何もせずそのまま通過させる。
2. そうでなければ、「Authorization」ヘッダーを確認する。
3. Basic 認証の形式（`Basic  base64(ユーザー名:パスワード)`）になっていて、かつ環境変数 `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASSWORD` と一致すれば通過させる。
4. 一致しなければ、**401 Unauthorized** を返し、「WWW-Authenticate: Basic」を付けて、ブラウザにログイン窓を出させる。

この内容を実装した `src/middleware.ts` を、次のステップで具体的なコードとして用意します（このガイドの「4. 実装例」を参照）。

### 3.5 動作確認

1. 開発サーバーを起動（`npm run dev`）。
2. ブラウザで `http://localhost:3000/admin/reservations` を開く。
3. **ユーザー名とパスワードを聞くダイアログ** が出れば OK。
4. 正しいユーザー名・パスワードを入れると、今まで通り管理画面が表示される。
5. 間違ったパスワードだと「認証エラー」で入れないことを確認する。

これで「管理画面と管理 API が、Basic 認証を知っている人だけに開かれる」状態になります。

---

## 4. ステップ2: Basic 認証の実装例（コピペ用）

以下をそのまま `src/middleware.ts` として保存してください。

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin";

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PATH_PREFIX) || pathname.startsWith(ADMIN_API_PREFIX);
}

function checkBasicAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const base64 = authHeader.slice(6);
  let decoded: string;
  try {
    decoded = atob(base64);
  } catch {
    return false;
  }
  const [user, pass] = decoded.split(":", 2);
  const expectedUser = process.env.ADMIN_BASIC_USER;
  const expectedPass = process.env.ADMIN_BASIC_PASSWORD;

  if (!expectedUser || !expectedPass) return false;
  return user === expectedUser && pass === expectedPass;
}

export function middleware(req: NextRequest) {
  if (!isAdminPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (checkBasicAuth(req)) {
    return NextResponse.next();
  }

  return new NextResponse("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="管理画面"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

- **やっていること**:  
  - `matcher` で「`/admin/...` と `/api/admin/...`」だけこのミドルウェアを通す。  
  - そのとき `Authorization: Basic ...` を検証し、OK なら `NextResponse.next()` で通過、NG なら 401 でログイン窓を出させる。

---

## 5. ステップ3: 本番で忘れずにやること

- **Vercel などにデプロイしている場合**  
  - プロジェクトの「Environment Variables」で  
    `ADMIN_BASIC_USER` と `ADMIN_BASIC_PASSWORD` を **本番用に設定** する。  
  - 本番では **必ず強いパスワード** にすること。
- **パスワードの管理**  
  - 共有する場合はパスワードマネージャーなどで渡し、チャットやメールにそのまま書かない。

---

## 6. その先: Supabase Auth で「ログイン画面」にしたい場合（ステップ4以降）

Basic 認証で一旦守ったあと、「ブラウザのポップアップではなく、ちゃんとしたログイン画面（メール＋パスワード）にしたい」場合は、**Supabase Auth** を使う方法があります。

### 6.1 やることの流れ（概要）

1. **Supabase ダッシュボード**で「管理者用」のユーザーを1人作る（メール＋パスワード）。
2. **ログイン用ページ**を1つ作る（例: `/admin/login`）。  
   - フォームでメール・パスワードを送り、Supabase の `signInWithPassword` を呼ぶ。
3. **セッションの持ち方**  
   - ログインに成功したら、Supabase がセッション（Cookie）を付けてくれるので、その後のリクエストで「ログイン済みか」を判定できる。
4. **ミドルウェアを変える**  
   - Basic 認証の代わりに、「`/admin` と `/api/admin` のときは、Supabase のセッションがあるか確認し、なければ `/admin/login` にリダイレクトする」ようにする。
5. **管理 API 側**  
   - 各 API の先頭で「このリクエストに有効な管理者セッションが付いているか」を確認し、なければ 401 を返す。

この段階になったら、  
- Supabase の「Auth」ドキュメント（メール/パスワード認証）  
- Next.js の「Middleware で Cookie を読む」  
を参照しながら、  
- ログイン画面のコンポーネント  
- ミドルウェアの書き換え  
- API でのセッション検証  
を追加していく形になります。  
（ここまでできたら、Basic 認証用の環境変数は外してかまいません。）

---

## 7. まとめ: あなたが「次にやること」のチェックリスト

- [ ] **ステップ1**: やることを理解した（管理画面と API を「正しい人だけ」に制限する）。
- [ ] **ステップ2**: `.env.local` に `ADMIN_BASIC_USER` と `ADMIN_BASIC_PASSWORD` を追加した。
- [ ] **ステップ3**: `src/middleware.ts` を上記の例で作成し、`/admin` と `/api/admin` でログイン窓が出ることを確認した。
- [ ] **ステップ4**: 本番環境にも同じ環境変数を設定し、パスワードを強くした。
- [ ] （任意）**ステップ5**: 余裕が出たら、Supabase Auth でログイン画面に切り替えることを検討する。

ここまでやれば、「次のステップ」のうち **いちばん大事な「管理画面を守る」** 部分は完了です。  
不明なところがあれば、どのステップのどこで詰まっているか（例: 「3.4 のミドルウェアをどこに置くか」）を教えてもらえれば、そこだけさらに細かく説明できます。
