// /src/app/api/admin/stock/route.ts
import { supabaseServer } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const range = searchParams.get("range") || "1d"

    if (!date) {
      return Response.json(
        { status: "error", message: "date is required" },
        { status: 400 }
      )
    }

    // 📆 期間計算
    const start = new Date(date)
    const end = new Date(start)
    if (range === "1week") end.setDate(start.getDate() + 6)

    // 📦 在庫データ取得
    const { data, error } = await supabaseServer
      .from("stock")
      .select("date, bike_type, base_quantity, manual_adjustment, reserved, available, updated_at")
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", end.toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .order("bike_type", { ascending: true })

    if (error) {
      console.error("🔴 Supabase error:", error)
      return Response.json(
        { status: "error", message: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return Response.json(
        { status: "error", message: "no data found" },
        { status: 404 }
      )
    }

    // 🧮 available は DBトリガーで自動更新済み
    return Response.json({
      status: "ok",
      date,
      range,
      count: data.length,
      stocks: data,
    })
  } catch (err: any) {
    console.error("💥 Unexpected error:", err)
    return Response.json(
      { status: "error", message: err?.message || String(err) },
      { status: 500 }
    )
  }
}
