import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Supabase から在庫データを取得
    const { data, error } = await supabase.from("stock").select("*");

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return Response.json({ ok: false, message: e.message || String(e) }, { status: 500 });
  }
}

  
type Plan = "3h" | "6h" | "1d" | "2d" | "multi";

/** 予約同士の間だけ確保するバッファ（分） */
const BUFFER_MIN = 60;

/* ========= 時刻ユーティリティ ========= */
function addHours(time: string, hours: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + hours);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setMinutes(d.getMinutes() + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* ========= 日付範囲の終端計算 ========= */
function calcEndDate(startDate: string, plan: Plan, days: number) {
  const d = new Date(startDate);
  if (plan === "3h" || plan === "6h") return startDate; // 同日プラン
  if (plan === "1d" || plan === "2d") return startDate; // 運用に応じて翌日にするならここで +1
  d.setDate(d.getDate() + (days - 1));
  return d.toISOString().split("T")[0];
}

/* ========= メイン ========= */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const plan: Plan = body.plan;
    const start_date: string = body.start_date;
    const start_time: string | null = body.start_time ?? null; // "HH:mm"（3h/6hのとき必須）
    const days: number = body.days ?? (plan === "2d" ? 2 : plan === "1d" ? 1 : 1);

    if (!plan || !start_date) {
      return Response.json({ ok: false, message: "plan と start_date は必須です" }, { status: 400 });
    }
    if ((plan === "3h" || plan === "6h") && !start_time) {
      return Response.json({ ok: false, message: "3h/6h は start_time が必須です" }, { status: 400 });
    }

    const end_date = calcEndDate(start_date, plan, days);

    // リクエスト側（時間系）の終了時刻は「利用時間 + バッファ」
    const requestedEndTime =
      plan === "3h"
        ? addMinutes(addHours(start_time!, 3), BUFFER_MIN)
        : plan === "6h"
        ? addMinutes(addHours(start_time!, 6), BUFFER_MIN)
        : null;

    /* 1) 在庫表 */
    const { data: stockRows, error: stockErr } = await supabase.from("stock").select("*");
    if (stockErr) throw stockErr;

    const stockMap = new Map<string, number>();
    for (const s of stockRows ?? []) stockMap.set(s.bike_type, s.total);

    /* 2) 同期間の予約を広めに取得 */
    const { data: reservations, error: resErr } = await supabase
      .from("reservations")
      .select("plan,start_date,end_date,start_time,bikes")
      .gte("start_date", start_date)
      .lte("end_date", end_date);
    if (resErr) throw resErr;

    /* 3) 既存予約による消費を合算（時間系は +バッファ で交差判定） */
    const consumed = new Map<string, number>();

    for (const r of reservations ?? []) {
      const rPlan: Plan = r.plan;
      const rStartDate = (r.start_date as string) ?? "";
      const rEndDate = ((r.end_date as string) ?? rStartDate) as string;
      const rStartTime = (r.start_time as string | null) ?? null;

      const dateOverlap = rStartDate <= end_date && rEndDate >= start_date;
      let overlap = false;

      if (plan === "3h" || plan === "6h") {
        // リクエストが時間系
        if (rPlan === "3h" || rPlan === "6h") {
          // 相手も時間系：同日かつ時間帯が交差（双方とも +バッファ）
          if (rStartDate === start_date && start_time && rStartTime) {
            const rEndTime =
              rPlan === "3h"
                ? addMinutes(addHours(rStartTime, 3), BUFFER_MIN)
                : addMinutes(addHours(rStartTime, 6), BUFFER_MIN);

            // 半開区間での交差判定：[start_time, requestedEndTime) × [rStartTime, rEndTime)
            overlap = !(requestedEndTime! <= rStartTime || rEndTime <= start_time);
          }
        } else {
          // 相手が日数系：該当日の貸出がそのレンジに含まれていれば在庫消費とみなす
          overlap = dateOverlap && rStartDate <= start_date && start_date <= rEndDate;
        }
      } else {
        // リクエストが日数系：日付重なりだけで在庫消費
        overlap = dateOverlap;
      }

      if (overlap) {
        const bikes = (r.bikes as Record<string, number>) || {};
        for (const [type, n] of Object.entries(bikes)) {
          consumed.set(type, (consumed.get(type) ?? 0) + (n || 0));
        }
      }
    }

    /* 4) 残り台数 = 在庫 - 消費 */
    const remaining: Record<string, number> = {};
    for (const [type, total] of stockMap.entries()) {
      remaining[type] = Math.max(0, total - (consumed.get(type) ?? 0));
    }

    return Response.json({ ok: true, remaining }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return Response.json({ ok: false, message: e.message || String(e) }, { status: 500 });
  }
}
