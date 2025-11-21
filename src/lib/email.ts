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

const BIKE_TYPE_LABELS: Record<string, string> = {
  "クロスバイク S": "クロスバイク S（150〜165cm）",
  "クロスバイク M": "クロスバイク M（165〜175cm）",
  "クロスバイク L": "クロスバイク L（175〜185cm）",
  "電動A S": "電動A S（150〜165cm）",
  "電動A M": "電動A M（165〜175cm）",
  "電動A L": "電動A L（175〜185cm）",
  電動B: "電動B（チャイルドシート付）",
  "キッズ130以下": "キッズ（130cm以下）",
  "キッズ130以上": "キッズ（130cm以上）",
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
    console.warn("RESEND_API_KEY is not set. Skipping email sending.");
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);

  const planName = PLAN_LABELS[data.plan] || data.plan;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
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

    const emailId = (response as { data?: { id?: string | null } | null })?.data?.id ?? null;

    return { success: true, id: emailId };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to send email" };
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
