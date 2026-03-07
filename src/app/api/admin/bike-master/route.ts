import { supabaseServer } from "@/utils/supabase/server";

type BikeMasterRow = {
  bike_type: string;
  base_quantity: number;
  updated_at: string | null;
};

// 管理画面の表示順（サイズが小さい順）
const BIKE_TYPE_ORDER: Record<string, number> = {
  // キッズ
  キッズ20インチ: 1,
  キッズ24インチ: 2,
  キッズ26インチ: 3,
  // クロス
  "クロスバイク XS": 10,
  "クロスバイク S": 11,
  "クロスバイク M": 12,
  "クロスバイク XL": 13,
  // ロード
  "ロードバイク S": 19,
  "ロードバイク M": 20,
  "ロードバイク L": 21,
  // 電動
  "電動A S": 30,
  "電動A M": 31,
  "電動B M": 40,
  "電動B チャイルドシート": 41,
  "電動C S": 50,
  "電動C M": 51,
};

function sortBikeMaster(a: BikeMasterRow, b: BikeMasterRow): number {
  const oa = BIKE_TYPE_ORDER[a.bike_type] ?? 999;
  const ob = BIKE_TYPE_ORDER[b.bike_type] ?? 999;
  if (oa !== ob) return oa - ob;
  return a.bike_type.localeCompare(b.bike_type, "ja");
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from("bike_master")
    .select("bike_type, base_quantity, updated_at");

  if (error) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }

  const rows = (data || []) as BikeMasterRow[];
  rows.sort(sortBikeMaster);

  return Response.json({ status: "ok", rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const bike_type = body?.bike_type as string | undefined;
  const base_quantity = body?.base_quantity as number | undefined;
  const propagate_start_date = body?.propagate_start_date as string | undefined; // YYYY-MM-DD

  if (!bike_type || typeof base_quantity !== "number" || !Number.isFinite(base_quantity)) {
    return Response.json({ status: "error", message: "invalid_parameters" }, { status: 400 });
  }

  const normalized = Math.max(0, Math.trunc(base_quantity));
  const nowIso = new Date().toISOString();

  // 1) bike_master を更新（updated_at も更新）
  const { error: bmError } = await supabaseServer
    .from("bike_master")
    .update({ base_quantity: normalized, updated_at: nowIso })
    .eq("bike_type", bike_type);

  if (bmError) {
    return Response.json({ status: "error", message: bmError.message }, { status: 500 });
  }

  // 2) 予約判定は stock を参照するため、選択日以降の stock.base_quantity も同期
  //    ※ stock.available の再計算はDB側（既存の仕組み）に委ねる前提
  const startDate = propagate_start_date || new Date().toISOString().slice(0, 10);
  const { error: stockError } = await supabaseServer
    .from("stock")
    .update({ base_quantity: normalized, updated_at: nowIso })
    .eq("bike_type", bike_type)
    .gte("date", startDate);

  if (stockError) {
    return Response.json(
      { status: "error", message: `bike_master updated, but stock sync failed: ${stockError.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    status: "ok",
    bike_type,
    base_quantity: normalized,
    propagate_start_date: startDate,
    updated_at: nowIso,
  });
}

