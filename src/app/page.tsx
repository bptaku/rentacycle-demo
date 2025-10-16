"use client";
import { useMemo, useState } from "react";

// test redeploy

export default function Page() {
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

const INVENTORY: Record<BikeType, number> = {
  "クロスバイク S": 5,
  "クロスバイク M": 8,
  "クロスバイク L": 5,
  "電動A": 6,
  "電動B": 4,
  "キッズ": 6,
};

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

  const [qty, setQty] = useState<Record<BikeType, number>>(
    Object.fromEntries(BIKE_TYPES.map((t) => [t.id, 0])) as Record<BikeType, number>
  );
  const [addonsByType, setAddons] = useState<Record<BikeType, Partial<Record<string, number>>>>(
    () => ({} as Record<BikeType, Partial<Record<string, number>>>)
  );  

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

  const setQtySafe = (type: BikeType, n: number) => {
    const val = Math.max(0, Math.min(INVENTORY[type], n));
    setQty((p) => ({ ...p, [type]: val }));
  };
  const setAddonQty = (type: BikeType, id: string, n: number) => {
    const max = qty[type] || 0;
    const val = Math.max(0, Math.min(max, n));
    setAddons((p) => ({ ...p, [type]: { ...(p[type] || {}), [id]: val } }));
  };

  const isBookingDisabled = isClosed || isReturnClosed || !plan || totalBikes === 0;

  /* =========================================================
     UI
     ========================================================= */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">レンタサイクル予約（V6.3 定休日制御版）</h1>
      <p className="text-gray-600 text-sm">
        営業時間：{OPEN_TIME}〜{CLOSE_TIME} ／ 定休日：水曜日
      </p>

      {/* プラン */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">① 貸出プラン</h2>
        <div className="flex flex-wrap gap-3">
          {["3h","6h","1d","2d","multi"].map((id) => (
            <label key={id} className="flex items-center gap-2">
              <input type="radio" name="plan" checked={plan === id} onChange={() => setPlan(id as any)} />
              {{
                "3h": "3時間",
                "6h": "6時間",
                "1d": "1日",
                "2d": "1泊2日",
                "multi": "2泊3日以上",
              }[id]}
            </label>
          ))}
        </div>
      </section>

      {/* 日時 */}
      {plan && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">② 日時を選択</h2>

          {(plan === "3h" || plan === "6h") && (
            <div className="space-y-3">
              <label className="block text-sm mb-1">貸出日</label>
              <input type="date" className="border rounded p-2" value={date} onChange={(e) => setDate(e.target.value)} />
              {isClosed && <p className="text-red-600 text-sm">※水曜日は貸出できません</p>}
              <label className="block text-sm mb-1">開始時間</label>
              <select className="border rounded p-2" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                {generateTimeSlots(plan).map((t) => <option key={t}>{t}</option>)}
              </select>
              <p className="text-sm text-gray-600">返却予定：{endTime}（18:30まで）</p>
            </div>
          )}

          {(plan === "1d" || plan === "2d" || plan === "multi") && (
            <div className="space-y-3">
              <label className="block text-sm mb-1">貸出開始日</label>
              <input type="date" className="border rounded p-2" value={date} onChange={(e) => setDate(e.target.value)} />
              {isClosed && <p className="text-red-600 text-sm">※貸出日が水曜のため不可</p>}
              {isReturnClosed && <p className="text-red-600 text-sm">※返却日が水曜のため不可</p>}
              {plan === "multi" && (
                <div className="flex items-center gap-2">
                  <span>日数：</span>
                  <input type="number" min={2} value={days} className="border rounded p-2 w-24" onChange={(e) => setDays(Number(e.target.value))} />
                </div>
              )}
              <label className="block text-sm mb-1 mt-2">来店予定時間（目安）</label>
              <select className="border rounded p-2" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
                {generateBusinessSlots().map((t) => <option key={t}>{t}</option>)}
              </select>
              {returnDate && (
                <p className="text-sm text-gray-600">
                  返却予定日：{returnDate.toLocaleDateString()}（{["日","月","火","水","木","金","土"][returnWeekday]}）
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* 台数 */}
      {plan && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">③ 車種・サイズ・台数</h2>
          {BIKE_TYPES.map(({ id, label }) => (
            <div key={id} className="flex items-center gap-3">
              <div className="w-60">{label}</div>
              <div className="text-sm text-gray-600">残り{INVENTORY[id]}台</div>
              <input
                type="number"
                min={0}
                max={INVENTORY[id]}
                className="border rounded p-2 w-24"
                value={qty[id]}
                onChange={(e) => setQtySafe(id, Number(e.target.value))}
              />
            </div>
          ))}
        </section>
      )}

      {/* オプション */}
      {plan && totalBikes > 0 && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">④ オプション</h2>
          {BIKE_TYPES.map(({ id, label }) => {
            const n = qty[id] || 0;
            if (!n) return null;
            return (
              <div key={id} className="border rounded p-3 mb-2">
                <div className="font-medium mb-1">{label}（{n}台）</div>
                {ADDONS.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <label className="w-44">{a.name}（+¥{a.price}）</label>
                    <input
                      type="number"
                      min={0}
                      max={n}
                      className="border rounded p-2 w-24"
                      value={addonsByType[id]?.[a.id] ?? 0}
                      onChange={(e) => setAddonQty(id, a.id, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      )}

      {/* 合計 */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">⑤ 合計金額</h2>
        <p className="text-2xl font-bold">¥{totalPrice.toLocaleString()}</p>
        {discountLabel && <p className="text-green-700 text-sm mt-1">※ {discountLabel}</p>}
        <button
          disabled={isBookingDisabled}
          className={`mt-3 w-full rounded px-4 py-2 text-white ${
            isBookingDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
          onClick={async () => {
            // 返却日（Date → "YYYY-MM-DD"）
            const end_date = returnDate ? returnDate.toISOString().split("T")[0] : null;
          
            // 例として仮の氏名/メール（あとでフォーム項目を足しましょう）
            const name = "テスト太郎";
            const email = "test@example.com";
          
            const reservation = {
              plan,
              start_date: date, // "YYYY-MM-DD"
              end_date,         // "YYYY-MM-DD" or null
          
              // 3h/6hのときだけ保存（それ以外はnull）
              start_time: (plan === "3h" || plan === "6h") ? startTime : null,
          
              // 1日以上のときだけ保存（それ以外はnull）
              pickup_time: (plan === "1d" || plan === "2d" || plan === "multi") ? pickupTime : null,
          
              bikes: qty,
              addons: addonsByType,
              total_price: totalPrice,
          
              // 仮の予約者情報（あとでフォーム化）
              name: "テスト太郎",
              email: "test@example.com",
              paid: false,
            };
          
            const res = await fetch("/api/reserve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reservation),
            });
          
            const result = await res.json();
            if (result.success) {
              alert("予約を保存しました！（SupabaseにINSERT済み）");
            } else {
              alert("保存エラー: " + result.message);
            }
          }}         
        >
          予約内容を確認
        </button>
      </section>
    </div>
  );
}
