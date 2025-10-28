import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);

  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const date = searchParams.get("date");

  // 単日指定 or 期間指定の判定
  const rangeStart = start_date || date;
  const rangeEnd = end_date || start_date || date;

  if (!rangeStart) {
    return Response.json({ error: "missing_date" }, { status: 400 });
  }

  const { data: stocks, error } = await supabase
    .from("stock")
    .select("date, bike_type, base_quantity, manual_adjustment, reserved, available")
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("date", { ascending: true })
    .order("bike_type", { ascending: true });

  if (error) {
    console.error("Availability fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 必要に応じて bike_master 情報をJOIN
  const { data: bikes } = await supabase
    .from("bike_master")
    .select("bike_type, label, category");

  // bike_master を辞書化
  const bikeDict = Object.fromEntries(
    (bikes || []).map((b) => [b.bike_type, { label: b.label, category: b.category }])
  );

  // 表示用整形
  const merged = (stocks || []).map((s) => ({
    date: s.date,
    bike_type: s.bike_type,
    label: bikeDict[s.bike_type]?.label || s.bike_type,
    category: bikeDict[s.bike_type]?.category || null,
    base: s.base_quantity,
    manual: s.manual_adjustment,
    reserved: s.reserved,
    available: s.available,
  }));

  return Response.json({ status: "ok", range: { start: rangeStart, end: rangeEnd }, data: merged });
}
