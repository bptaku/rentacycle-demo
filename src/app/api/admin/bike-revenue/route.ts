import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

const PRICE_TABLE = {
  クロス: { "6h": 2500, "1d": 3500, "2d_plus": 6500, addDay: 2700 },
  電動A: { "6h": 3500, "1d": 4500, "2d_plus": 8500, addDay: 3600 },
  電動B: { "6h": 4500, "1d": 5500, "2d_plus": 11000, addDay: 4500 },
  キッズ: { "6h": 500, "1d": 500, "2d_plus": 1000, addDay: 500 },
};

function priceKeyOf(bikeType: string) {
  if (bikeType.startsWith("クロスバイク")) return "クロス" as const;
  if (bikeType.startsWith("電動A")) return "電動A" as const;
  if (bikeType === "電動B") return "電動B" as const;
  if (bikeType.startsWith("キッズ")) return "キッズ" as const;
  return "クロス" as const;
}

function calculateBikePrice(bikeType: string, plan: string, startDate: string, endDate: string) {
  const key = priceKeyOf(bikeType);
  const table = PRICE_TABLE[key];

  if (plan === "6h" || plan === "1d") {
    return table[plan as "6h" | "1d"];
  }

  if (plan === "2d_plus") {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    if (days <= 2) {
      return table["2d_plus"];
    }
    return table["2d_plus"] + table.addDay * (days - 2);
  }

  return 0;
}

function parseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabaseServer
      .from("reservations")
      .select("id, plan, start_date, end_date, bikes, bike_numbers, discount")
      .eq("status", "completed");

    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("end_date", endDate);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const revenueByBike: Record<
      string,
      {
        bike_type: string;
        bike_number: string;
        reservation_count: number;
        total_revenue: number;
        reservations: { id: string; date: string; revenue: number }[];
      }
    > = {};

    for (const reservation of data || []) {
      const bikes = parseJson<Record<string, number>>(reservation.bikes, {});
      const bikeNumbers = parseJson<Record<string, string[]>>(reservation.bike_numbers, {});

      const baseSubtotal = Object.entries(bikes).reduce((sum, [bikeType, count]) => {
        if (!count) return sum;
        return (
          sum +
          calculateBikePrice(bikeType, reservation.plan, reservation.start_date, reservation.end_date) * count
        );
      }, 0);

      const discount = Math.min(reservation.discount || 0, baseSubtotal);

      for (const [bikeType, count] of Object.entries(bikes)) {
        if (!count || count <= 0) continue;
        const numbers = bikeNumbers[bikeType] || [];
        if (numbers.length === 0) continue;

        const basePrice = calculateBikePrice(bikeType, reservation.plan, reservation.start_date, reservation.end_date);
        if (basePrice === 0) continue;

        const typeSubtotal = basePrice * count;
        const typeDiscount = baseSubtotal > 0 ? (discount * typeSubtotal) / baseSubtotal : 0;
        const revenuePerBike = count > 0 ? (typeSubtotal - typeDiscount) / count : 0;

        numbers.slice(0, count).forEach((bikeNumber) => {
          const key = `${bikeType}::${bikeNumber}`;
          if (!revenueByBike[key]) {
            revenueByBike[key] = {
              bike_type: bikeType,
              bike_number: bikeNumber,
              reservation_count: 0,
              total_revenue: 0,
              reservations: [],
            };
          }
          revenueByBike[key].reservation_count += 1;
          revenueByBike[key].total_revenue += revenuePerBike;
          revenueByBike[key].reservations.push({
            id: reservation.id,
            date: reservation.start_date,
            revenue: revenuePerBike,
          });
        });
      }
    }

    return NextResponse.json({
      status: "ok",
      data: Object.values(revenueByBike).sort((a, b) => b.total_revenue - a.total_revenue),
    });
  } catch (error: any) {
    console.error("[GET /api/admin/bike-revenue]", error?.message || error);
    return NextResponse.json({ status: "error", message: error?.message || "unknown error" }, { status: 500 });
  }
}
