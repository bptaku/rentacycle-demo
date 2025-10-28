import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { bike_type, start_date, end_date, request_qty } = await req.json();

    if (!bike_type || !start_date || !end_date || !request_qty) {
      return Response.json(
        { error: "missing_parameters" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "check_availability_with_period_v5_0",
      {
        p_bike_type: bike_type,
        p_start_date: start_date,
        p_end_date: end_date,
        p_request_qty: request_qty,
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      return Response.json(
        { error: error.message || "rpc_failed" },
        { status: 500 }
      );
    }

    // Supabase RPCがJSONを返すため、そのままレスポンスへ
    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("API Error:", err);
    return Response.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
