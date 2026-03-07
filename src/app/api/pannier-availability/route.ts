import { supabaseServer } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const MAX_PANNIER = 10;

/** addonsByBike 形式からパニア個数を計算（片側=1、左右セット=2） */
function countPannierFromAddons(addons: Record<string, Array<Record<string, number>> | undefined> | null): number {
  if (!addons || typeof addons !== "object") return 0;
  let n = 0;
  for (const addonSets of Object.values(addons)) {
    if (!Array.isArray(addonSets)) continue;
    for (const set of addonSets) {
      if (!set || typeof set !== "object") continue;
      n += ((set["A-PANNIER-SET"] ?? 0) * 2) + (set["A-PANNIER-SINGLE"] ?? 0);
    }
  }
  return n;
}

function parseDate(str: string): Date | null {
  if (!str || str.length < 10) return null;
  const [y, m, d] = str.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * GET /api/pannier-availability?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * 指定期間の「各日ごと」に既存予約のパニア合計を集計し、
 * 全日の残り枠の最小値＝この予約で追加可能なパニア数を返す（1日あたり最大10個）。
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date") || start_date;

    if (!start_date) {
      return NextResponse.json(
        { status: "error", message: "start_date required", maxPannierCanAdd: MAX_PANNIER },
        { status: 400 }
      );
    }

    const startDate = parseDate(start_date);
    const endDateStr = end_date ?? start_date;
    const endDate = parseDate(endDateStr);
    if (!startDate || !endDate || endDate < startDate) {
      return NextResponse.json(
        { status: "error", message: "invalid date range", maxPannierCanAdd: MAX_PANNIER },
        { status: 400 }
      );
    }

    const days: string[] = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (cursor <= end) {
      days.push(formatDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const supabase = supabaseServer;

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("start_date, end_date, addons")
      .neq("status", "canceled")
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (error) {
      console.error("[pannier-availability]", error.message);
      return NextResponse.json(
        { status: "error", message: error.message, maxPannierCanAdd: MAX_PANNIER },
        { status: 500 }
      );
    }

    const pannierByDay: Record<string, number> = {};
    for (const day of days) {
      pannierByDay[day] = 0;
    }

    for (const r of reservations || []) {
      const rStartDate = r.start_date ? parseDate(String(r.start_date)) : null;
      const rEndDate = r.end_date ? parseDate(String(r.end_date)) : rStartDate;
      if (!rStartDate || !rEndDate) continue;
      const rStart = formatDate(rStartDate);
      const rEnd = formatDate(rEndDate);
      const count = countPannierFromAddons(r.addons as Record<string, Array<Record<string, number>> | undefined> | null);
      for (const day of days) {
        if (day >= rStart && day <= rEnd) {
          pannierByDay[day] = (pannierByDay[day] ?? 0) + count;
        }
      }
    }

    let maxCanAdd = MAX_PANNIER;
    for (const day of days) {
      const existing = pannierByDay[day] ?? 0;
      maxCanAdd = Math.min(maxCanAdd, Math.max(0, MAX_PANNIER - existing));
    }

    return NextResponse.json({
      status: "ok",
      maxPannierCanAdd: maxCanAdd,
    });
  } catch (e) {
    console.error("[pannier-availability]", e);
    return NextResponse.json(
      { status: "error", message: String(e), maxPannierCanAdd: MAX_PANNIER },
      { status: 500 }
    );
  }
}
