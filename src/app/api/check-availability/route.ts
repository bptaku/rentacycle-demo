import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { bike_type, start_date, end_date, request_qty, plan } = body;

  const { data, error } = await supabase.rpc("check_availability_with_period_v4_2", {
    p_bike_type: bike_type,
    p_start_date: start_date,
    p_end_date: end_date,
    p_request_qty: request_qty,
    p_plan: plan || "standard",
  });

  if (error) {
    console.error("RPC Error:", error);
    return Response.json({ available: false, remaining: 0, error: error.message }, { status: 500 });
  }

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
