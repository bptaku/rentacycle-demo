import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

const supabase = supabaseServer;

function parseJsonSafe<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn("Failed to parse JSON value:", error);
      return fallback;
    }
  }
  return value as T;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!date) {
      return NextResponse.json(
        { status: "error", message: "date is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("reservations")
      .select(
        `
        id,
        name,
        email,
        start_date,
        end_date,
        start_time,
        pickup_time,
        plan,
        bikes,
        addons,
        bike_numbers,
        dropoff,
        dropoff_price,
        insurance_plan,
        insurance_price,
        total_price,
        status,
        created_at
      `
      )
      .lte("start_date", date)
      .gte("end_date", date);

    if (status) {
      query = query.eq("status", status);
    } else {
      query = query.neq("status", "canceled");
    }

    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query
      .order("pickup_time", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: "ok",
      date,
      reservations: (data || []).map((r) => {
        const bikes = parseJsonSafe<Record<string, number>>(r.bikes, {});
        const addons = parseJsonSafe<Record<string, Array<Record<string, number>>>>(r.addons, {});
        const bike_numbers = parseJsonSafe<Record<string, string[]>>(r.bike_numbers, {});
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          start_date: r.start_date,
          end_date: r.end_date,
          start_time: r.start_time,
          pickup_time: r.pickup_time,
          plan: r.plan,
          bikes,
          addons,
          bike_numbers,
          dropoff: r.dropoff || false,
          dropoff_price: r.dropoff_price || 0,
          insurance_plan: r.insurance_plan || "none",
          insurance_price: r.insurance_price || 0,
          total_price: r.total_price,
          status: r.status,
          created_at: r.created_at,
        } as const;
      }),
    });
  } catch (error: any) {
    console.error("[GET /api/admin/reservations]", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}
