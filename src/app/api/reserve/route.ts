import { supabaseServer } from "@/utils/supabase/server";
import { sendReservationConfirmationEmail } from "@/lib/email";
import { NextResponse } from "next/server";

function createDateFromInput(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function enumerateDates(start: string, end: string): string[] {
  const startDate = createDateFromInput(start);
  const endDate = createDateFromInput(end);
  if (!startDate || !endDate) return [];
  const days: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  while (cursor <= endDate) {
    days.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * 🚲 /api/reserve
 * v5.0 — 予約登録 + 在庫同期 + 予約メール送信
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      plan,
      start_date,
      end_date,
      start_time,
      pickup_time,
      bikes,
      addonsByBike,
      dropoff = false,
      insurance_plan = "none",
      insurance_price = 0,
      subtotal,
      addons_price,
      dropoff_price = 0,
      discount,
      total_price,
      name,
      email,
      paid = false,
    } = body;

    if (!plan || !start_date || !end_date || !bikes || Object.keys(bikes).length === 0) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;

    const effectiveEndDate = end_date || start_date;
    const targetDates = enumerateDates(start_date, effectiveEndDate);

    if (targetDates.length === 0) {
      return Response.json(
        { success: false, message: "日付の形式が正しくありません" },
        { status: 400 }
      );
    }

    const bikeEntries = Object.entries<number>(bikes);
    const bikeTypesToCheck = bikeEntries.filter(([, qty]) => qty && qty > 0).map(([bikeType]) => bikeType);

    if (bikeTypesToCheck.length === 0) {
      return Response.json(
        { success: false, message: "予約する車種の台数を入力してください" },
        { status: 400 }
      );
    }

    const { data: stockRows, error: stockError } = await supabase
      .from("stock")
      .select("date, bike_type, available")
      .gte("date", targetDates[0])
      .lte("date", targetDates[targetDates.length - 1])
      .in("bike_type", bikeTypesToCheck);

    if (stockError) {
      console.error("Stock fetch error:", stockError);
      return Response.json(
        { success: false, message: "在庫情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    const availabilityMap = new Map<string, number>();
    stockRows?.forEach((row) => {
      const key = `${row.date}:${row.bike_type}`;
      const available = typeof row.available === "number" ? row.available : 0;
      availabilityMap.set(key, available);
    });

    for (const [bikeType, qty] of bikeEntries) {
      if (!qty || qty <= 0) continue;
      for (const dateKey of targetDates) {
        const available = availabilityMap.get(`${dateKey}:${bikeType}`) ?? 0;
        if (available < qty) {
          return Response.json(
            {
              success: false,
              message: `${dateKey} の ${bikeType} は残り ${available} 台のため、${qty} 台を確保できません`,
            },
            { status: 409 }
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          plan,
          start_date,
          end_date,
          start_time,
          pickup_time,
          bikes,
          addons: addonsByBike || {},
          dropoff: dropoff || false,
          dropoff_price: dropoff_price || 0,
          insurance_plan: insurance_plan || "none",
          insurance_price: insurance_price || 0,
          subtotal,
          addons_price,
          discount,
          total_price,
          name,
          email,
          paid,
          status: "reserved",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Reserve insert error:", error);
      return Response.json(
        { success: false, message: error.message || "Insert failed" },
        { status: 500 }
      );
    }

    const reservation = data?.[0];

    // メール送信（非同期で実行、失敗しても予約は成功）
    if (reservation && email) {
      sendReservationConfirmationEmail({
        reservationId: reservation.id,
        name: name || "お客様",
        email,
        plan,
        startDate: start_date,
        endDate: end_date,
        startTime: start_time ?? null,
        pickupTime: pickup_time ?? null,
        bikes,
        addonsByBike: addonsByBike || {},
        dropoff: dropoff || false,
        insurancePlan: insurance_plan || "none",
        insurancePrice: insurance_price || 0,
        subtotal: subtotal || 0,
        addonsPrice: addons_price || 0,
        dropoffPrice: dropoff_price || 0,
        discount: discount || 0,
        totalPrice: total_price || 0,
      })
        .then((result) => {
          if (result.success) {
            console.log(`✅ 予約確認メール送信成功: ${reservation.id} → ${email}`);
          } else {
            console.error(`❌ 予約確認メール送信失敗: ${reservation.id} → ${email}`, result.error);
          }
        })
        .catch((emailError) => {
          console.error(`❌ 予約確認メール送信エラー: ${reservation.id} → ${email}`, emailError);
        });
    } else if (!email) {
      console.warn(`⚠️ メールアドレスが未入力のため、予約確認メールを送信できません: ${reservation?.id}`);
    }

    return NextResponse.json({ status: "ok", message: "予約が確定しました", data }, { status: 200 });
  } catch (err: any) {
    console.error("Reserve API Error:", err);
    return Response.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
