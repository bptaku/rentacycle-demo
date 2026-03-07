import { Resend } from "resend";

export interface ReservationEmailData {
  reservationId: string;
  name: string;
  email: string;
  plan: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  pickupTime: string | null;
  bikes: Record<string, number>;
  addonsByBike: Record<string, Array<Record<string, number>>>;
  dropoff: boolean;
  insurancePlan: string;
  insurancePrice: number;
  subtotal: number;
  addonsPrice: number;
  dropoffPrice: number;
  discount: number;
  totalPrice: number;
}

interface CancelNotificationEmailData {
  reservationId: string;
  name: string;
  email: string | null;
  plan: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  pickupTime: string | null;
  totalPrice: number;
  cancelReason: string | null;
}

interface CancelApprovedEmailData {
  reservationId: string;
  name: string;
  email: string | null;
  plan: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  pickupTime: string | null;
  totalPrice: number;
}

const BIKE_TYPE_LABELS: Record<string, string> = {
  // キッズ
  "キッズ20インチ": "キッズ 20インチ（約115cm〜）",
  "キッズ24インチ": "キッズ 24インチ（約130cm〜）",
  "キッズ26インチ": "キッズ 26インチ（約140cm〜）",
  // クロスバイク
  "クロスバイク XS": "クロスバイク XS（150〜163cm）",
  "クロスバイク S": "クロスバイク S（157〜170cm）",
  "クロスバイク M": "クロスバイク M（165〜177cm）",
  "クロスバイク XL": "クロスバイク XL（180〜195cm）",
  // ロードバイク
  "ロードバイク S": "ロードバイク S（165〜172cm）",
  "ロードバイク M": "ロードバイク M（170〜180cm）",
  "ロードバイク L": "ロードバイク L（177〜193cm）",
  // 電動A
  "電動A S": "電動A S（146cm〜170cm）",
  "電動A M": "電動A M（153cm〜185cm）",
  // 電動B
  "電動B M": "電動B M（156cm〜180cm）",
  "電動B チャイルドシート": "電動B チャイルドシート付き",
  // 電動C
  "電動C S": "電動C S（162〜172cm）",
  "電動C M": "電動C M（170〜182cm）",
};

const PLAN_LABELS: Record<string, string> = {
  "6h": "6時間プラン",
  "1d": "1日プラン",
  "2d_plus": "2日以上プラン",
};

const INSURANCE_LABELS: Record<string, string> = {
  none: "補償なし",
  A: "Aプラン",
  B: "Bプラン",
  C: "Cプラン",
};

const INSURANCE_DESCRIPTIONS: Record<string, string> = {
  none: "補償は付帯しません",
  A: "1万円までの修理代を保障",
  B: "車両価格の30%まで保障",
  C: "車両価格の50%まで保障",
};

export async function sendReservationConfirmationEmail(data: ReservationEmailData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set. Skipping email sending.");
    console.error("環境変数の確認:", {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
    });
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);

  const planName = PLAN_LABELS[data.plan] || data.plan;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (fromEmail === "onboarding@resend.dev") {
    console.warn(
      "⚠️ RESEND_FROM_EMAIL が未設定のため onboarding@resend.dev から送信しています。届かない場合は「原因と対処」をプロジェクトルートの EMAIL_SETUP.md で確認してください。"
    );
  }

  // キャンセル申請リンクのベースURL
  // 本番環境ではNEXT_PUBLIC_BASE_URLを設定、開発環境ではlocalhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const cancelUrl = `${baseUrl}/cancel/${data.reservationId}`;

  const bikeLines = Object.entries(data.bikes)
    .filter(([_, count]) => count > 0)
    .map(
      ([bikeType, count]) =>
        `・${BIKE_TYPE_LABELS[bikeType] || bikeType} × ${count}台`
    );

  const optionLines: string[] = [];
  if (data.dropoff) {
    optionLines.push(`・ドロップオフサービス: ¥${data.dropoffPrice.toLocaleString()}`);
  }
  if (data.insurancePlan && data.insurancePlan !== "none") {
    optionLines.push(
      `・車両補償（${INSURANCE_LABELS[data.insurancePlan] || data.insurancePlan}）: ¥${data.insurancePrice.toLocaleString()}`
    );
  }

  const emailHtml = buildEmailHtml({
    ...data,
    planName,
    bikeLines,
    optionLines,
    cancelUrl,
  });
  const emailText = buildEmailText({
    ...data,
    planName,
    bikeLines,
    optionLines,
    cancelUrl,
  });

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `【レンタサイクル】ご予約ありがとうございます（予約番号: ${
        data.reservationId.split("-")[0]
      }）`,
      html: emailHtml,
      text: emailText,
    });

    const resendError = (response as { error?: { message?: string; name?: string; statusCode?: number } | null })?.error;
    if (resendError) {
      console.error(`📧 メール送信エラー（Resend API）:`, {
        reservationId: data.reservationId,
        email: data.email,
        fromEmail,
        error: resendError.message || resendError,
        statusCode: resendError.statusCode,
      });
      return {
        success: false,
        error: resendError.message || "Failed to send email",
      };
    }

    const emailId = (response as { data?: { id?: string | null } | null })?.data?.id ?? null;

    // 詳細なログ出力（Vercelで確認できるように）
    console.log(`📧 メール送信成功:`, {
      reservationId: data.reservationId,
      email: data.email,
      fromEmail,
      emailId,
      baseUrl,
    });

    return { success: true, id: emailId };
  } catch (error: any) {
    // 詳細なエラーログ出力
    console.error(`📧 メール送信エラー:`, {
      reservationId: data.reservationId,
      email: data.email,
      fromEmail,
      error: error?.message || error,
      errorStack: error?.stack,
    });
    return { success: false, error: error?.message || "Failed to send email" };
  }
}

export async function sendReservationCreatedNotificationEmailToShop(
  data: ReservationEmailData
) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_SHOP_EMAIL;

  if (!apiKey || !toEmail) {
    console.error(
      "❌ RESEND_API_KEY or RESEND_SHOP_EMAIL is not set. Skipping reservation created notification email."
    );
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  if (fromEmail === "onboarding@resend.dev") {
    console.warn(
      "⚠️ RESEND_FROM_EMAIL が未設定です。お店への通知メールもドメイン未検証の場合は届かないことがあります。"
    );
  }
  const planName = PLAN_LABELS[data.plan] || data.plan;

  const reservationIdShort = data.reservationId
    ? String(data.reservationId).slice(0, 8)
    : data.reservationId;

  const bikeLines = Object.entries(data.bikes)
    .filter(([, count]) => count > 0)
    .map(
      ([bikeType, count]) =>
        `・${BIKE_TYPE_LABELS[bikeType] || bikeType} × ${count}台`
    );

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `【管理用】新しい予約が入りました（予約番号: ${reservationIdShort}）`,
      text: [
        "新しい予約が確定しました。",
        "",
        `予約番号: ${reservationIdShort}`,
        `お名前: ${data.name}`,
        `お客様メールアドレス: ${data.email}`,
        "",
        `プラン: ${planName}`,
        `貸出日: ${data.startDate}${
          data.startTime
            ? ` ${data.startTime} 開始`
            : data.pickupTime
            ? ` ${data.pickupTime} 来店予定`
            : ""
        }`,
        `返却日: ${data.endDate}`,
        "",
        "【自転車】",
        ...(bikeLines.length > 0 ? bikeLines : ["自転車の予約はありません"]),
        "",
        `合計金額: ¥${data.totalPrice.toLocaleString()}`,
      ].join("\n"),
    });

    const resendError = (response as { error?: { message?: string; name?: string; statusCode?: number } | null })?.error;
    if (resendError) {
      console.error("📧 予約作成通知メール送信エラー（Resend API）", {
        reservationId: data.reservationId,
        toEmail,
        error: resendError.message || resendError,
        statusCode: resendError.statusCode,
      });
      return { success: false, error: resendError.message || "Failed to send reservation created notification email" };
    }

    const emailId = (response as { data?: { id?: string | null } | null })?.data?.id ?? null;
    console.log("📧 予約作成通知メール送信成功", {
      reservationId: data.reservationId,
      toEmail,
      emailId,
    });

    return { success: true, id: emailId };
  } catch (error: any) {
    console.error("📧 予約作成通知メール送信エラー", {
      reservationId: data.reservationId,
      toEmail,
      error: error?.message || error,
      errorStack: error?.stack,
    });
    return { success: false, error: error?.message || "Failed to send reservation created notification email" };
  }
}

export async function sendCancelRequestNotificationEmail(
  data: CancelNotificationEmailData
) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_SHOP_EMAIL;

  if (!apiKey || !toEmail) {
    console.error("❌ RESEND_API_KEY or RESEND_SHOP_EMAIL is not set. Skipping cancel notification email.");
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const planName = PLAN_LABELS[data.plan] || data.plan;
  const reservationIdShort = data.reservationId
    ? String(data.reservationId).slice(0, 8)
    : data.reservationId;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `【管理用】キャンセル申請が届きました（予約番号: ${reservationIdShort}）`,
      text: [
        "以下の予約でキャンセル申請が行われました。",
        "",
        `予約番号: ${reservationIdShort}`,
        `お名前: ${data.name}`,
        `メールアドレス: ${data.email ?? "-"}`,
        "",
        `プラン: ${planName}`,
        `貸出日: ${data.startDate}${data.startTime ? ` ${data.startTime}` : data.pickupTime ? ` ${data.pickupTime} 来店予定` : ""}`,
        `返却日: ${data.endDate}`,
        `合計金額: ¥${data.totalPrice.toLocaleString()}`,
        "",
        "【キャンセル理由】",
        data.cancelReason ? data.cancelReason : "（未入力）",
        "",
        "管理画面の予約一覧から「キャンセル申請を承認」ボタンを押すとキャンセルが確定し、在庫が自動的に復元されます。",
      ].join("\n"),
    });

    const resendError = (response as { error?: { message?: string; name?: string; statusCode?: number } | null })?.error;
    if (resendError) {
      console.error("📧 キャンセル申請通知メール送信エラー（Resend API）", {
        reservationId: data.reservationId,
        toEmail,
        error: resendError.message || resendError,
        statusCode: resendError.statusCode,
      });
      return { success: false, error: resendError.message || "Failed to send cancel notification email" };
    }

    const emailId = (response as { data?: { id?: string | null } | null })?.data?.id ?? null;
    console.log("📧 キャンセル申請通知メール送信成功", {
      reservationId: data.reservationId,
      toEmail,
      emailId,
    });

    return { success: true, id: emailId };
  } catch (error: any) {
    console.error("📧 キャンセル申請通知メール送信エラー", {
      reservationId: data.reservationId,
      toEmail,
      error: error?.message || error,
      errorStack: error?.stack,
    });
    return { success: false, error: error?.message || "Failed to send cancel notification email" };
  }
}

export async function sendCancelApprovedEmailToCustomer(
  data: CancelApprovedEmailData
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !data.email) {
    console.error("❌ RESEND_API_KEY is not set or reservation has no email. Skipping cancel-approved email.");
    return { success: false, error: "Email service not configured or missing customer email" };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const planName = PLAN_LABELS[data.plan] || data.plan;
  const reservationIdShort = data.reservationId
    ? String(data.reservationId).slice(0, 8)
    : data.reservationId;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `【レンタサイクル】キャンセルが確定しました（予約番号: ${reservationIdShort}）`,
      text: [
        `${data.name} 様`,
        "",
        "この度はキャンセルのお手続きをいただきありがとうございます。",
        "以下のご予約のキャンセルが確定しましたのでお知らせいたします。",
        "",
        `予約番号: ${reservationIdShort}`,
        `プラン: ${planName}`,
        `貸出日: ${data.startDate}${data.startTime ? ` ${data.startTime}` : data.pickupTime ? ` ${data.pickupTime} 来店予定` : ""}`,
        `返却日: ${data.endDate}`,
        `合計金額: ¥${data.totalPrice.toLocaleString()}`,
        "",
        "またのご利用を心よりお待ちしております。",
        "",
        "---",
        "このメールは自動送信されています。",
        "本メールに心当たりがない場合は、お手数ですが削除してください。",
      ].join("\n"),
    });

    const resendError = (response as { error?: { message?: string; name?: string; statusCode?: number } | null })?.error;
    if (resendError) {
      console.error("📧 キャンセル確定メール送信エラー（Resend API）", {
        reservationId: data.reservationId,
        email: data.email,
        error: resendError.message || resendError,
        statusCode: resendError.statusCode,
      });
      return { success: false, error: resendError.message || "Failed to send cancel-approved email" };
    }

    const emailId = (response as { data?: { id?: string | null } | null })?.data?.id ?? null;
    console.log("📧 キャンセル確定メール送信成功", {
      reservationId: data.reservationId,
      email: data.email,
      emailId,
    });

    return { success: true, id: emailId };
  } catch (error: any) {
    console.error("📧 キャンセル確定メール送信エラー", {
      reservationId: data.reservationId,
      email: data.email,
      error: error?.message || error,
      errorStack: error?.stack,
    });
    return { success: false, error: error?.message || "Failed to send cancel-approved email" };
  }
}

type TemplateParams = ReservationEmailData & {
  planName: string;
  bikeLines: string[];
  optionLines: string[];
  cancelUrl: string;
};

function buildEmailHtml(params: TemplateParams) {
  const {
    reservationId,
    name,
    planName,
    startDate,
    endDate,
    startTime,
    pickupTime,
    bikeLines,
    optionLines,
    subtotal,
    addonsPrice,
    dropoffPrice,
    insurancePrice,
    discount,
    totalPrice,
    cancelUrl,
  } = params;

  // 予約番号を短い形式に（最初の8文字）
  const reservationIdShort = reservationId ? String(reservationId).slice(0, 8) : reservationId;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
      }
      .wrapper {
        max-width: 640px;
        margin: 0 auto;
        padding: 24px;
      }
      .card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
      .header {
        background: linear-gradient(120deg, #2563eb, #1d4ed8);
        color: white;
        padding: 24px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        letter-spacing: 0.03em;
      }
      .section {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
      }
      .section:last-child {
        border-bottom: none;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #111827;
      }
      .reservation-id {
        font-family: "Fira Code", monospace;
        background: #fef3c7;
        color: #92400e;
        padding: 8px 12px;
        display: inline-block;
        border-radius: 6px;
        letter-spacing: 0.05em;
      }
      .list {
        background: #f9fafb;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        line-height: 1.8;
      }
      .price-row,
      .total-row {
        display: flex;
        justify-content: space-between;
        margin: 6px 0;
        font-size: 15px;
      }
      .total-row {
        margin-top: 12px;
        border-top: 2px solid #2563eb;
        padding-top: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #1d4ed8;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        margin-top: 24px;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <h1>ご予約ありがとうございます</h1>
        </div>
        <div class="section">
          <div class="section-title">ご予約者様</div>
          <p>${name} 様</p>
          <p>この度はレンタサイクルをご予約いただき、誠にありがとうございます。</p>
        </div>
        <div class="section">
          <div class="section-title">予約番号</div>
          <div class="reservation-id">${reservationIdShort}</div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 6px;">
            予約の確認やお問い合わせの際に必要となります。
          </p>
        </div>
        <div class="section">
          <div class="section-title">プラン</div>
          <p>${planName}</p>
        </div>
        <div class="section">
          <div class="section-title">貸出日時</div>
          <p>
            ${startDate}
            ${startTime ? ` ${startTime} 開始` : pickupTime ? ` ${pickupTime} 来店予定` : ""}
          </p>
          <p>返却日: ${endDate}</p>
        </div>
        <div class="section">
          <div class="section-title">ご予約内容</div>
          <div class="list">
            ${bikeLines.length > 0 ? bikeLines.join("<br />") : "自転車のご予約はありません"}
            ${optionLines.length > 0 ? `<br /><br /><strong>オプション</strong><br />${optionLines.join("<br />")}` : ""}
          </div>
        </div>
        <div class="section">
          <div class="section-title">料金内訳</div>
          <div class="list">
            <div class="price-row"><span>基本料金</span><span>¥${subtotal.toLocaleString()}</span></div>
            ${addonsPrice > 0 ? `<div class="price-row"><span>オプション</span><span>¥${addonsPrice.toLocaleString()}</span></div>` : ""}
            ${dropoffPrice > 0 ? `<div class="price-row"><span>ドロップオフ</span><span>¥${dropoffPrice.toLocaleString()}</span></div>` : ""}
            ${insurancePrice > 0 ? `<div class="price-row"><span>車両補償</span><span>¥${insurancePrice.toLocaleString()}</span></div>` : ""}
            ${discount > 0 ? `<div class="price-row" style="color:#10b981;"><span>割引</span><span>-¥${discount.toLocaleString()}</span></div>` : ""}
            <div class="total-row"><span>合計</span><span>¥${totalPrice.toLocaleString()}</span></div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">ご来店について</div>
          <p>ご予約いただいた日時に、お店までお越しください。</p>
          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        </div>
        <div class="section">
          <div class="section-title">キャンセルをご希望の場合</div>
          <p>予約のキャンセルをご希望の場合は、以下のリンクからキャンセル申請をお願いいたします。</p>
          <p style="margin-top: 12px;">
            <a href="${cancelUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              キャンセル申請はこちら
            </a>
          </p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
            ※ キャンセル申請後、お店で承認が必要です。承認され次第、確認メールをお送りします。
          </p>
        </div>
      </div>
      <div class="footer">
        <p>このメールは自動送信されています。</p>
        <p>本メールに心当たりがない場合は、お手数ですが削除してください。</p>
      </div>
    </div>
  </body>
</html>`;
}

function buildEmailText(params: TemplateParams) {
  const {
    reservationId,
    name,
    planName,
    startDate,
    endDate,
    startTime,
    pickupTime,
    bikeLines,
    optionLines,
    subtotal,
    addonsPrice,
    dropoffPrice,
    insurancePrice,
    discount,
    totalPrice,
    cancelUrl,
  } = params;

  // 予約番号を短い形式に（最初の8文字）
  const reservationIdShort = reservationId ? String(reservationId).slice(0, 8) : reservationId;

  const lines: string[] = [];
  lines.push("ご予約ありがとうございます");
  lines.push("");
  lines.push(`${name} 様`);
  lines.push("");
  lines.push("この度はレンタサイクルをご予約いただき、誠にありがとうございます。");
  lines.push("以下の内容で予約を承りました。");
  lines.push("");
  lines.push("【予約番号}");
  lines.push(reservationIdShort);
  lines.push("");
  lines.push("【プラン】");
  lines.push(planName);
  lines.push("");
  lines.push("【貸出日時】");
  lines.push(
    `${startDate}${startTime ? ` ${startTime} 開始` : pickupTime ? ` ${pickupTime} 来店予定` : ""}`
  );
  lines.push(`返却日: ${endDate}`);
  lines.push("");
  lines.push("【ご予約内容】");
  lines.push(...(bikeLines.length > 0 ? bikeLines : ["自転車のご予約はありません"]));
  if (optionLines.length > 0) {
    lines.push("");
    lines.push("【オプション】");
    lines.push(...optionLines);
  }
  lines.push("");
  lines.push("【料金内訳】");
  lines.push(`基本料金: ¥${subtotal.toLocaleString()}`);
  if (addonsPrice > 0) lines.push(`オプション: ¥${addonsPrice.toLocaleString()}`);
  if (dropoffPrice > 0) lines.push(`ドロップオフ: ¥${dropoffPrice.toLocaleString()}`);
  if (insurancePrice > 0) lines.push(`車両補償: ¥${insurancePrice.toLocaleString()}`);
  if (discount > 0) lines.push(`割引: -¥${discount.toLocaleString()}`);
  lines.push(`合計: ¥${totalPrice.toLocaleString()}`);
  lines.push("");
  lines.push("【ご来店について】");
  lines.push("ご予約いただいた日時に、お店までお越しください。");
  lines.push("ご不明な点がございましたら、お気軽にお問い合わせください。");
  lines.push("");
  lines.push("【キャンセルをご希望の場合】");
  lines.push("予約のキャンセルをご希望の場合は、以下のURLからキャンセル申請をお願いいたします。");
  lines.push(cancelUrl);
  lines.push("");
  lines.push("※ キャンセル申請後、お店で承認が必要です。承認され次第、確認メールをお送りします。");
  lines.push("");
  lines.push("---");
  lines.push("このメールは自動送信されています。");
  lines.push("本メールに心当たりがない場合は、お手数ですが削除してください。");

  return lines.join("\n");
}
