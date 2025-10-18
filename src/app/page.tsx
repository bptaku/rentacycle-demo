"use client";
import { useMemo, useState, useEffect } from "react";
// redeploy test 2025-10-18

// test redeploy 2025-10-18-b


/* =========================================================
   定義
   ========================================================= */
const OPEN_TIME = "08:00";
const CLOSE_TIME = "18:30";
const CLOSED_DAY = 3; // 水曜

const BIKE_TYPES = [
  { id: "クロスバイク S", label: "クロスバイク S（150〜165cm）" },
  { id: "クロスバイク M", label: "クロスバイク M（165〜175cm）" },
  { id: "クロスバイク L", label: "クロスバイク L（175〜185cm）" },
  { id: "電動A", label: "電動A" },
  { id: "電動B", label: "電動B（クロス型／チャイルドシート付）" },
  { id: "キッズ", label: "キッズ（12歳まで）" },
] as const;
type BikeType = (typeof BIKE_TYPES)[number]["id"];

const PRICE = {
  クロス: { "3h": 1300, "6h": 2500, "1d": 3500, "2d": 6500, addDay: 2700, extra1h: 500 },
  電動A: { "3h": 2000, "6h": 3500, "1d": 4500, "2d": 8500, addDay: 3600, extra1h: 800 },
  電動B: { "3h": 2800, "6h": 4500, "1d": 5500, "2d": 11000, addDay: 4500, extra1h: 1000 },
  キッズ: { "3h": 500, "6h": 500, "1d": 500, "2d": 1000, addDay: 500, extra1h: 500 },
};

const ADDONS = [
  { id: "A-HOLDER", name: "スマホホルダー", price: 500 },
  { id: "A-BATTERY", name: "予備バッテリー", price: 1000 },
  { id: "A-CHILDSEAT", name: "チャイルドシート", price: 1000 },
  { id: "A-CARRIER", name: "リアキャリア", price: 1500 },
];

/* =========================================================
   ヘルパー関数
   ========================================================= */
function addHours(time: string, hours: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + hours);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function generateTimeSlots(plan: "3h" | "6h") {
  const step = 30;
  const slots: string[] = [];
  let h = 8, m = 0;
  const limit = plan === "3h" ? { h: 15, m: 30 } : { h: 12, m: 30 };
  while (h < limit.h || (h === limit.h && m <= limit.m)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += step;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
}

function generateBusinessSlots() {
  const step = 30;
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots.filter((t) => t <= CLOSE_TIME);
}

function getWeekday(date: string) {
  if (!date) return -1;
  const d = new Date(date);
  return d.getDay();
}

/** 返却日を計算 */
function calcReturnDate(date: string, plan: string, days: number) {
  if (!date) return null;
  const d = new Date(date);
  if (plan === "3h" || plan === "6h") return d;
  if (plan === "1d" || plan === "2d") d.setDate(d.getDate() + 1);
  else if (plan === "multi") d.setDate(d.getDate() + (days - 1));
  return d;
}

function priceKeyOf(type: string) {
  if (type.startsWith("クロスバイク")) return "クロス";
  if (type === "電動A") return "電動A";
  if (type === "電動B") return "電動B";
  if (type === "キッズ") return "キッズ";
  return "クロス";
}

/* =========================================================
   メイン
   ========================================================= */
export default function RentacycleV63() {
  const [plan, setPlan] = useState<"3h" | "6h" | "1d" | "2d" | "multi" | "">("");
  const [days, setDays] = useState(2);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [pickupTime, setPickupTime] = useState("08:00");

  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState<Record<BikeType, number>>(
    Object.fromEntries(BIKE_TYPES.map((t) => [t.id, 0])) as Record<BikeType, number>
  );
  const [addonsByType, setAddons] = useState<Record<BikeType, Partial<Record<string, number>>>>(
    () => ({} as Record<BikeType, Partial<Record<string, number>>>)
  );

  // 初回ロードで在庫を取得
  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/availability");
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          const map: Record<string, number> = {};
          json.data.forEach((r: { bike_type: string; total: number }) => {
            map[r.bike_type] = r.total;
          });
          setInventory(map);
        }
      } catch (e) {
        console.error("在庫取得エラー:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStock();
  }, []);

  // プラン・日付・時間が変わるたびに在庫を再計算
  useEffect(() => {
    async function check() {
      if (!plan || !date) return;
      const payload: any = { plan, start_date: date };
      if (plan === "3h" || plan === "6h") payload.start_time = startTime;
      if (plan === "multi") payload.days = days;

      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) setRemaining(json.remaining);
      else setRemaining(null);
    }
    check();
  }, [plan, date, startTime, days]);

  const weekday = getWeekday(date);
  const returnDate = calcReturnDate(date, plan, days);
  const returnWeekday = returnDate ? returnDate.getDay() : -1;
  const isClosed = weekday === CLOSED_DAY;
  const isReturnClosed = returnWeekday === CLOSED_DAY;

  const timeSlots =
    plan === "3h" ? generateTimeSlots("3h")
      : plan === "6h" ? generateTimeSlots("6h")
      : generateBusinessSlots();

  const endTime =
    plan === "3h" ? addHours(startTime, 3)
      : plan === "6h" ? addHours(startTime, 6)
      : "";

  const adultCount = useMemo(
    () => Object.entries(qty).filter(([t]) => !t.includes("キッズ")).reduce((a, [, n]) => a + (n || 0), 0),
    [qty]
  );
  const totalBikes = useMemo(() => Object.values(qty).reduce((a, b) => a + (b || 0), 0), [qty]);

  const { totalPrice, discountLabel } = useMemo(() => {
    if (!plan) return { totalPrice: 0, discountLabel: "" };
    let subtotal = 0;
    for (const t of BIKE_TYPES.map((x) => x.id)) {
      const n = qty[t] || 0;
      if (!n) continue;
      const key = priceKeyOf(t);
      const table = PRICE[key];
      let price = 0;
      if (plan === "3h" || plan === "6h" || plan === "1d" || plan === "2d") price = table[plan];
      else if (plan === "multi") {
        if (days === 1) price = table["1d"];
        else if (days === 2) price = table["2d"];
        else price = table["2d"] + table["addDay"] * (days - 2);
      }
      subtotal += price * n;
    }

    let addons = 0;
    for (const t of BIKE_TYPES.map((x) => x.id)) {
      for (const a of ADDONS) addons += a.price * (addonsByType[t]?.[a.id] ?? 0);
    }

    const eligible = adultCount >= 3 && (plan === "1d" || plan === "2d" || plan === "multi");
    const discounted = eligible ? Math.floor((subtotal + addons) * 0.9) : subtotal + addons;
    return { totalPrice: discounted, discountLabel: eligible ? "グループ割 10%OFF 適用" : "" };
  }, [plan, days, qty, addonsByType, adultCount]);

  // 残り台数に応じて入力制御
  const setQtySafe = (type: BikeType, n: number) => {
    const cap = remaining?.[type] ?? inventory[type] ?? 0;
    const val = Math.max(0, Math.min(cap, n));
    setQty((p) => ({ ...p, [type]: val }));
  };

  const noStock = remaining && Object.values(remaining).every((v) => v <= 0);
  const isBookingDisabled = !!(isClosed || isReturnClosed || !plan || totalBikes === 0);


  /* =========================================================
     UI
     ========================================================= */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">レンタサイクル予約（Supabase在庫連動）</h1>
      <p className="text-gray-600 text-sm">
        営業時間：{OPEN_TIME}〜{CLOSE_TIME} ／ 定休日：水曜日
      </p>

      {loading && <p className="text-gray-500">在庫を読み込み中...</p>}

      {plan && !loading && (
      {/* ③ 車種・サイズ・台数 */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">③ 車種・サイズ・台数</h2>
        {BIKE_TYPES.map(({ id, label }) => (
          <div key={id} className="flex items-center gap-3">
            <div className="w-60">{label}</div>
            <div className="text-sm text-gray-600">
              残り{remaining?.[id] ?? inventory[id] ?? 0}台
            </div>
            <input
              type="number"
              min={0}
              max={remaining?.[id] ?? inventory[id] ?? 0}
              className="border rounded p-2 w-24"
              value={qty[id]}
              onChange={(e) => setQtySafe(id, Number(e.target.value))}
              disabled={(remaining?.[id] ?? inventory[id] ?? 0) <= 0}
            />
          </div>
        ))}
      </section>
      )}

      <button
        disabled={!!isBookingDisabled}
        className={`mt-3 w-full rounded px-4 py-2 text-white ${
          isBookingDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
        }`}
      >
        予約内容を確認
      </button>
    </div>
  );
}
