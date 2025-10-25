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

    return Response.json({ status: "success", data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return Response.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
