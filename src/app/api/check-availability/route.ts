import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bike_type, start_date, end_date, request_qty } = body;

    // ✅ RPC呼び出し時のキー名をp_付きにする！
    const { data, error } = await supabase.rpc("check_availability_with_period_v3_3", {
      p_bike_type: bike_type,
      p_start_date: start_date,
      p_end_date: end_date,
      p_request_qty: request_qty,
    });

    if (error) throw error;

    const { data, error } = await supabase.rpc("check_availability_with_period_v4_1", {
      p_bike_type: bike_type,
      p_start_date: start_date,
      p_end_date: end_date,
      p_request_qty: request_qty,
    });

    const remaining = stockData?.length
      ? Math.min(...stockData.map((s) => s.total))
      : 0;

    return Response.json({
      available: data === true && remaining >= request_qty,
      remaining,
    });
  } catch (e: any) {
    console.error("Error:", e);
    return Response.json(
      { available: false, remaining: 0, status: "error", error: e.message },
      { status: 500 }
    );
  }
}
