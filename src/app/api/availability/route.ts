import { supabaseServer } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const date = searchParams.get("date");

  const rangeStart = start_date || date;
  const rangeEnd = end_date || rangeStart;

  if (!rangeStart) {
    return Response.json({ error: "missing_date" }, { status: 400 });
  }

  const { data: stocks, error } = await supabaseServer
    .from("stock")
    .select("date, bike_type, base_quantity, manual_adjustment, reserved, available, bike_master(label, category)")
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("date", { ascending: true })
    .order("bike_type", { ascending: true });

  if (error) {
    console.error("Availability fetch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    status: "ok",
    range: { start: rangeStart, end: rangeEnd },
    data: stocks,
  });
}
