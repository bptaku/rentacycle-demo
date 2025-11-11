import { getHolidays } from "@/lib/holidays";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "invalid_year" }, { status: 400 });
    }

    const holidays = await getHolidays(year);

    return NextResponse.json({
      status: "ok",
      year,
      holidays,
    });
  } catch (error: any) {
    console.error("[GET /api/holidays]", error?.message || error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
