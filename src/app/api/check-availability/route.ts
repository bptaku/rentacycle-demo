import { supabaseServer } from "@/utils/supabase/server";

/**
 * 在庫確認API v5.0
 * 
 * 📘 機能概要
 * - 車種・日付・台数・プランに基づき、利用可能台数を取得。
 * - request_qty=0 の場合もエラーにせず在庫を返す（在庫UI用）。
 * - Supabase RPC: check_availability_with_period_v5_0 を呼び出す。
 */

export async function POST(req: Request) {
  try {
    const { bike_type, start_date, end_date, request_qty, plan } = await req.json();

    // 🧩 バリデーション（日付・車種は必須。台数は未選択OK）
    if (!bike_type || !start_date || !end_date) {
      return Response.json({ error: "missing_parameters" }, { status: 400 });
    }

    // 🪄 未選択時は 0 扱い（0台でも在庫表示可能に）
    const qty = request_qty ?? 0;

    const supabase = supabaseServer;

    // 🧠 RPC呼び出し
    const { data, error } = await supabase.rpc("check_availability_with_period_v5_0", {
      p_bike_type: bike_type,
      p_start_date: start_date,
      p_end_date: end_date,
      p_request_qty: qty,
    });

    if (error) {
      console.error("[check-availability] RPC Error:", error);
      return Response.json({ error: error.message || "rpc_failed" }, { status: 500 });
    }

    // 🧾 Supabase RPCが { available, remaining } 等を返す前提
    return Response.json(
      {
        status: "ok",
        bike_type,
        start_date,
        end_date,
        request_qty: qty,
        data,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("[check-availability] API Error:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
