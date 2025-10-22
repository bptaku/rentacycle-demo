// src/app/api/check-availability/route.ts
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { bike_type, start_date, end_date, request_qty } = body;

  // RPC呼び出し
  const { data, error } = await supabase.rpc("check_availability_with_period_v3_3", {
    bike_type,
    start_date,
    end_date,
    request_qty,
  });

  if (error) {
    console.error("RPC Error:", error);
    return Response.json(
      { available: false, remaining: 0, status: "error", error: error.message },
      { status: 500 }
    );
  }

  // stockテーブルから残り台数を取得
  const { data: stockData } = await supabase
    .from("stock")
    .select("total")
    .eq("bike_type", bike_type)
    .gte("date", start_date)
    .lte("date", end_date);

  const remaining = stockData?.length
    ? Math.min(...stockData.map((s) => s.total))
    : 0;

  // 状態を明示
  const available = data === true && remaining >= request_qty;
  const status =
    remaining === 0
      ? "unavailable" // すべて貸出中
      : available
      ? "available"
      : "limited"; // 台数不足だが在庫ありなど

  return Response.json({
    available,
    remaining,
    status,
    details: { rpcResult: data, start_date, end_date, request_qty },
  });
}
