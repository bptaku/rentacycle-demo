import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();
  const { bike_type, start_date, end_date, request_qty } = body;

  // ✅ 関数は位置引数（配列）で呼ぶ
  const { data, error } = await supabase.rpc(
    "check_availability_with_period_v3_3",
    [bike_type, start_date, end_date, request_qty]
  );

  if (error) {
    console.error("RPC Error:", error);
    return Response.json({
      available: false,
      remaining: 0,
      status: "error",
      error: error.message,
    });
  }

  // ✅ 在庫テーブルから残数を取得
  const { data: stockData } = await supabase
    .from("stock")
    .select("total")
    .eq("bike_type", bike_type)
    .gte("date", start_date)
    .lte("date", end_date);

  const remaining = stockData?.length
    ? Math.min(...stockData.map((s) => s.total))
    : 0;

  return Response.json({
    available: data === true && remaining >= request_qty,
    remaining,
  });
}
