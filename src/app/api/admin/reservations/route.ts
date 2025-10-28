import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";


const supabase = supabaseServer;

/**
 * GET /api/admin/reservations
 * ?date=2025-10-27  …指定日の予約（期間跨ぎ対応）
 * &status=confirmed …状態フィルタ（省略時は canceled を除外）
 * &search=山田        …name/email 部分一致
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const status = searchParams.get("status"); // confirmed | canceled | completed
    const search = searchParams.get("search");

    if (!date) {
      return NextResponse.json(
        { status: "error", message: "date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // 期間跨ぎ対応: start_date <= date <= end_date
    let query = supabase
      .from("reservations")
      .select(
        `
        id,
        name,
        email,
        start_date,
        end_date,
        start_time,
        pickup_time,
        plan,
        bikes,
        addons,
        total_price,
        status,
        created_at
      `
      )
      .lte("start_date", date)
      .gte("end_date", date);

    // 状態フィルタ：未指定なら canceled を除外
    if (status) {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "canceled");
    }

    // 名前/メールの部分一致
    if (search && search.trim() !== "") {
      // Supabaseの or/ilike 構文で簡易検索
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // 並び順: pickup_time または start_time の昇順（nullは最後）
    // SQL的に並べたいので RPC を使わず order + nullsFirst/Last を活用
    // Supabaseの order は nullsFirst/nullsLast をサポート
    // まず pickup_time 昇順(nullsLast)、次に start_time 昇順(nullsLast)
    query = query.order("pickup_time", { ascending: true, nullsFirst: false })
                 .order("start_time",  { ascending: true, nullsFirst: false });

    const { data, error } = await query;

    if (error) throw error;

    // レスポンス整形（仕様そのまま返す）
    return NextResponse.json({
      status: "ok",
      date,
      reservations: (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        start_date: r.start_date,
        end_date: r.end_date,
        start_time: r.start_time,
        pickup_time: r.pickup_time,
        plan: r.plan,
        bikes: r.bikes,   // jsonb
        addons: r.addons, // jsonb
        total_price: r.total_price,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (e: any) {
    console.error("[GET /api/admin/reservations] ", e?.message || e);
    return NextResponse.json(
      { status: "error", message: e?.message || "unknown error" },
      { status: 500 }
    );
  }
}
