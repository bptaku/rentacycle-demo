// src/app/api/check-availability/route.ts
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const { bike_type, start_date, end_date, request_qty } = await req.json();

  // ★ 返却日を含むRPC
  const { data, error } = await supabase.rpc("check_availability_with_period_v4_1", {
    p_bike_type: bike_type,
    p_start_date: start_date,
    p_end_date: end_date,
    p_request_qty: request_qty,
  });

  if (error) {
    return Response.json({ available: false, remaining: 0, status: "error", error: error.message }, { status: 500 });
  }

  // ★ 残数も返却日を含めて最小値を計算
  const { data: stockData, error: stockErr } = await supabase
    .from("stock")
    .select("total")
    .eq("bike_type", bike_type)
    .gte("date", start_date)
    .lte("date", end_date); // 返却日を含む

  if (stockErr) {
    return Response.json({ available: false, remaining: 0, status: "error", error: stockErr.message }, { status: 500 });
  }

  const remaining = stockData?.length ? Math.min(...stockData.map((s: any) => s.total)) : 0;

  return Response.json({
    available: data === true && remaining >= request_qty, // 等号を含める
    remaining,
  });
}
