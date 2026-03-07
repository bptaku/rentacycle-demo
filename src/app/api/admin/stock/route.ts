// /src/app/api/admin/stock/route.ts
import { supabaseServer } from "@/utils/supabase/server";

// 自転車タイプのソート順序を定義（サイズが小さい順）
const BIKE_TYPE_ORDER: Record<string, number> = {
  // キッズ（インチが小さい順）
  'キッズ20インチ': 1,
  'キッズ24インチ': 2,
  'キッズ26インチ': 3,
  // クロスバイク（サイズが小さい順）
  'クロスバイク XS': 10,
  'クロスバイク S': 11,
  'クロスバイク M': 12,
  'クロスバイク XL': 13,
  // ロードバイク（サイズが小さい順）
  'ロードバイク S': 19,
  'ロードバイク M': 20,
  'ロードバイク L': 21,
  // 電動A（サイズが小さい順）
  '電動A S': 30,
  '電動A M': 31,
  // 電動B（サイズが小さい順）
  '電動B M': 40,
  '電動B チャイルドシート': 41,
  // 電動C（サイズが小さい順）
  '電動C S': 50,
  '電動C M': 51,
};

// 自転車タイプをソートする関数
function sortBikeTypes(a: any, b: any): number {
  const orderA = BIKE_TYPE_ORDER[a.bike_type] ?? 999;
  const orderB = BIKE_TYPE_ORDER[b.bike_type] ?? 999;
  
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  
  // 同じカテゴリ内で順序が定義されていない場合は、文字列順
  return a.bike_type.localeCompare(b.bike_type, 'ja');
}

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

    // 📊 サイズ順にソート（日付ごとにグループ化してソート）
    const sortedData = data.sort((a, b) => {
      // まず日付でソート
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      // 同じ日付内で自転車タイプをサイズ順にソート
      return sortBikeTypes(a, b)
    })

    // 🧮 available は DBトリガーで自動更新済み
    return Response.json({
      status: "ok",
      date,
      range,
      count: sortedData.length,
      stocks: sortedData,
    })
  } catch (err: any) {
    console.error("💥 Unexpected error:", err)
    return Response.json(
      { status: "error", message: err?.message || String(err) },
      { status: 500 }
    )
  }
}
