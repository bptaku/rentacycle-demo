// src/app/api/reserve/route.ts
import { createClient } from "@/utils/supabase/server";

interface NormalizedAddon {
  bike_type: string;
  index: number;
  addons: Record<string, number>;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const body = await req.json();

    const {
      plan,
      bikes,
      addonsByBike,
      subtotal = 0,
      addons_price = 0,
      discount = 0,
      total_price,
      name,
      email,
      start_date,
      end_date,
    } = body;

    // 🧩 デバッグログ（受信内容確認）
    console.log("📦 RESERVE payload =", body);

    const dbgBikeType = Object.keys(bikes ?? {})[0] ?? "(none)";
    const request_qty = bikes?.[dbgBikeType] ?? 0;

    console.log("🔍 RESERVE derived:", {
      bike_type: dbgBikeType,
      start_date,
      end_date,
      request_qty,
      plan,
    });

    // 🧩 RPC在庫チェック（明示引数名で統一）
    const { data: available, error: rpcError } = await supabase.rpc(
      "check_availability_with_period_v4_2",
      {
        p_bike_type: dbgBikeType,
        p_start_date: start_date,
        p_end_date: end_date,
        p_request_qty: request_qty,
        p_plan: plan || "standard",
      }
    );

    console.log("🧩 RPC params =", {
      p_bike_type: dbgBikeType,
      p_start_date: start_date,
      p_end_date: end_date,
      p_request_qty: request_qty,
      p_plan: plan,
    });
    console.log("🧩 RPC result =", { available, rpcError });

    if (rpcError) {
      console.error("❌ RPC Error:", rpcError);
      return Response.json(
        { status: "error", error: rpcError.message },
        { status: 500 }
      );
    }

    if (!available) {
      return Response.json(
        { status: "error", message: "台数が足りません" },
        { status: 400 }
      );
    }

    // 🔹 addonsByBike → 正規化
    let normalizedAddons: NormalizedAddon[] = [];
    if (addonsByBike && typeof addonsByBike === "object") {
      normalizedAddons = Object.entries(addonsByBike).flatMap(
        ([bikeType, list]) =>
          (list as Record<string, number>[]).map((a, idx) => ({
            bike_type: bikeType,
            index: idx + 1,
            addons: a,
          }))
      );
    }

    // 🔹 Supabase挿入データ構築
    const insertData = {
      plan,
      bikes,
      addons: normalizedAddons,
      subtotal,
      addons_price,
      discount,
      total_price,
      name,
      email,
      start_date,
      end_date,
    };

    // 🔹 Supabaseに保存
    const { data, error } = await supabase
      .from("reservations")
      .insert(insertData)
      .select();

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return Response.json(
        { status: "error", error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Reservation saved successfully:", data);

    return Response.json({ status: "success", data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return Response.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
