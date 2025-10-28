"use client";
import { useMemo, useState, useEffect } from "react";
import AvailabilityChecker from "@/components/AvailabilityChecker";

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
  { id: "電動A S", label: "電動A S（150〜165cm）" },
  { id: "電動A M", label: "電動A M（165〜175cm）" },
  { id: "電動A L", label: "電動A L（175〜185cm）" },
  { id: "電動B", label: "電動B（チャイルドシート付）" },
  { id: "キッズ130以下", label: "キッズ（130cm以下）" },
  { id: "キッズ130以上", label: "キッズ（130cm以上）" },
] as const;
type BikeType = (typeof BIKE_TYPES)[number]["id"];

const PRICE = {
  クロス: { "3h": 1300, "6h": 2500, "1d": 3500, "2d_plus": 6500, addDay: 2700 },
  電動A: { "3h": 2000, "6h": 3500, "1d": 4500, "2d_plus": 8500, addDay: 3600 },
  電動B: { "3h": 2800, "6h": 4500, "1d": 5500, "2d_plus": 11000, addDay: 4500 },
  キッズ: { "3h": 500, "6h": 500, "1d": 500, "2d_plus": 1000, addDay: 500 },
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

function calcReturnDate(date: string, plan: string, days: number) {
  if (!date) return null;
  const d = new Date(date);
  if (plan === "3h" || plan === "6h" || plan === "1d") d.setDate(d.getDate());
  else if (plan === "2d_plus") d.setDate(d.getDate() + (days - 1));
  return d;
}

function priceKeyOf(type: string) {
  if (type.startsWith("クロスバイク")) return "クロス";
  if (type.startsWith("電動A")) return "電動A";
  if (type === "電動B") return "電動B";
  if (type.startsWith("キッズ")) return "キッズ";
  return "クロス";
}

/* =========================================================
   メインコンポーネント
   ========================================================= */
export default function RentacyclePageV5() {
  const [plan, setPlan] = useState<"3h" | "6h" | "1d" | "2d_plus" | "">("");
  const [days, setDays] = useState(2);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [pickupTime, setPickupTime] = useState("08:00");
const endTime = useMemo(() => {
  if (plan === "3h") return addHours(startTime, 3);
  if (plan === "6h") return addHours(startTime, 6);
  return "";
}, [plan, startTime]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState<Record<BikeType, number>>(
    Object.fromEntries(BIKE_TYPES.map((t) => [t.id, 0])) as Record<BikeType, number>
  );

  type AddonsByBike = Partial<Record<BikeType, Array<Partial<Record<string, number>>>>>;
  const [addonsByBike, setAddonsByBike] = useState<AddonsByBike>({});
  // 🧩 台数を安全に更新する関数（0未満・上限超過防止）
  const setQtySafe = (bikeId: string, value: number) => {
    // 利用可能な上限を取得（remaining優先、fallbackにinventory）
    const maxAvailable = remaining?.[bikeId] ?? inventory[bikeId] ?? 0;

    // 上限・下限を制限
    const safeValue = Math.max(0, Math.min(value, maxAvailable));

    // 安全に状態更新
    setQty((prev) => ({ ...prev, [bikeId]: safeValue }));
  };

  /* === 初期在庫取得 === */
  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await fetch("/api/availability");
        const json = await res.json();
        if (json.status === "ok" && Array.isArray(json.data)) {
          const map: Record<string, number> = {};
          json.data.forEach((r: { bike_type: string; available: number }) => {
            map[r.bike_type] = r.available;
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

  /* === オプション配列の自動調整 === */
  useEffect(() => {
    const updated: AddonsByBike = { ...addonsByBike };
    for (const type of BIKE_TYPES.map((t) => t.id)) {
      const n = qty[type] || 0;
      const current = updated[type] || [];
      if (current.length < n) {
        for (let i = current.length; i < n; i++) current.push({});
      }
      if (current.length > n) current.length = n;
      updated[type] = current;
    }
    setAddonsByBike(updated);
  }, [qty]);

  const weekday = getWeekday(date);
  const returnDate = calcReturnDate(date, plan, days);
  const returnWeekday = returnDate ? returnDate.getDay() : -1;
  const isClosed = weekday === CLOSED_DAY;
  const isReturnClosed = returnWeekday === CLOSED_DAY;

  const totalBikes = useMemo(() => Object.values(qty).reduce((a, b) => a + (b || 0), 0), [qty]);
  const adultCount = useMemo(
    () => Object.entries(qty).filter(([t]) => !t.includes("キッズ")).reduce((a, [, n]) => a + (n || 0), 0),
    [qty]
  );

  const { subtotal, addons, totalPrice, discount, discountLabel } = useMemo(() => {
    if (!plan) return { subtotal: 0, addons: 0, totalPrice: 0, discount: 0, discountLabel: "" };

    let subtotal = 0;
    for (const t of BIKE_TYPES.map((x) => x.id)) {
      const n = qty[t] || 0;
      if (!n) continue;
      const key = priceKeyOf(t);
      const table = PRICE[key];
      let price = 0;
      if (plan === "3h" || plan === "6h" || plan === "1d" || plan === "2d_plus") price = table[plan];
      else if (days > 2) price = table["2d_plus"] + table["addDay"] * (days - 2);
      subtotal += price * n;
    }

    let addons = 0;
    for (const t of BIKE_TYPES.map((x) => x.id)) {
      const perType = addonsByBike[t] || [];
      for (const perBike of perType) {
        for (const a of ADDONS) addons += a.price * (perBike[a.id] ?? 0);
      }
    }

    const eligible = adultCount >= 3 && (plan === "1d" || plan === "2d_plus");
    const discount = eligible ? Math.floor((subtotal + addons) * 0.1) : 0;
    const discounted = subtotal + addons - discount;

    return {
      subtotal,
      addons,
      totalPrice: discounted,
      discount,
      discountLabel: eligible ? "グループ割 10%OFF 適用" : "",
    };
  }, [plan, days, qty, addonsByBike, adultCount]);

  const isBookingDisabled = isClosed || isReturnClosed || !plan || totalBikes === 0;

  /* =========================================================
     UI
     ========================================================= */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">レンタサイクル予約（v5.0完全同期版）</h1>
      <p className="text-gray-600 text-sm">
        営業時間：{OPEN_TIME}〜{CLOSE_TIME} ／ 定休日：水曜日
      </p>

            {/* ① 貸出プラン */}
      <section className="border rounded p-4">
        <h2 className="font-semibold mb-2">① 貸出プラン</h2>
        <div className="flex flex-wrap gap-3">
          {["3h", "6h", "1d", "2d_plus"].map((id) => (
            <label key={id} className="flex items-center gap-2">
              <input
                type="radio"
                name="plan"
                checked={plan === id}
                onChange={() => setPlan(id as any)}
              />
              {{
                "3h": "3時間プラン",
                "6h": "6時間プラン",
                "1d": "1日プラン",
                "2d_plus": "2日以上プラン",
              }[id]}
            </label>
          ))}
        </div>
      </section>

      {/* ② 日時を選択 */}
      {plan && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">② 日時を選択</h2>

          {(plan === "3h" || plan === "6h") && (
            <div className="space-y-3">
              <label className="block text-sm mb-1">貸出日</label>
              <input
                type="date"
                className="border rounded p-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {isClosed && <p className="text-red-600 text-sm">※水曜日は貸出できません</p>}
              <label className="block text-sm mb-1">開始時間</label>
              <select
                className="border rounded p-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {generateTimeSlots(plan).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600">返却予定：{endTime}（18:30まで）</p>
            </div>
          )}

          {(plan === "1d" || plan === "2d_plus") && (
            <div className="space-y-3">
              <label className="block text-sm mb-1">貸出開始日</label>
              <input
                type="date"
                className="border rounded p-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {isClosed && <p className="text-red-600 text-sm">※貸出日が水曜のため不可</p>}
              {isReturnClosed && <p className="text-red-600 text-sm">※返却日が水曜のため不可</p>}
              {plan === "2d_plus" && (
                <div className="flex items-center gap-2">
                  <span>日数：</span>
                  <input
                    type="number"
                    min={2}
                    value={days}
                    className="border rounded p-2 w-24"
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </div>
              )}
              <label className="block text-sm mb-1 mt-2">来店予定時間（目安）</label>
              <select
                className="border rounded p-2"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              >
                {generateBusinessSlots().map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {returnDate && (
                <p className="text-sm text-gray-600">
                  返却予定日：{returnDate.toLocaleDateString()}（
                  {["日", "月", "火", "水", "木", "金", "土"][returnWeekday]}）
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ③ 車種・サイズ・台数 */}
      {!loading && plan && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">③ 車種・サイズ・台数</h2>
          {BIKE_TYPES.map(({ id, label }) => (
            <div key={id} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 border-b py-2">
              <div className="w-60">{label}</div>
              <AvailabilityChecker
                bikeType={id}
                startDate={date}
                endDate={returnDate ? returnDate.toISOString().split("T")[0] : null}
                requestQty={qty[id] || 0}
                onStatusChange={(status) =>
                  setRemaining((prev) => ({ ...(prev || {}), [id]: status.remaining ?? 0 }))
                }
              />
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

      {/* ④ オプション */}
      {plan && totalBikes > 0 && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-2">④ オプション</h2>

          {BIKE_TYPES.map(({ id, label }) => {
            const count = qty[id] || 0;
            if (!count) return null;

            const perType = addonsByBike[id] || [];

            return (
              <div key={id} className="border rounded p-3 mb-4 bg-gray-50">
                <h3 className="font-medium mb-2">{label}</h3>

                {Array.from({ length: count }).map((_, i) => (
                  <div
                    key={i}
                    className="border rounded p-2 mb-2 bg-white shadow-sm"
                  >
                    <p className="font-semibold text-sm mb-1">
                      {label} #{i + 1}
                    </p>

                    {ADDONS.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 ml-2">
                        <label className="w-44 text-sm">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={Boolean(perType[i]?.[a.id])}
                            onChange={(e) => {
                              const updated = { ...perType[i], [a.id]: e.target.checked ? 1 : 0 };
                              const newList = [...perType];
                              newList[i] = updated;
                              setAddonsByBike((p) => ({
                                ...p,
                                [id]: newList,
                              }));
                            }}
                          />
                          {a.name}（+¥{a.price}）
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      )}
{/* ⑤ 合計金額・予約ボタン */}
      <section className="border rounded p-4 bg-gray-50">
        <h2 className="font-semibold mb-2">⑤ 合計金額</h2>
        <div className="mb-4">
          <p>基本料金：¥{subtotal.toLocaleString()}</p>
          <p>オプション：¥{addons.toLocaleString()}</p>
          {discountLabel && <p className="text-green-700">{discountLabel}</p>}
          <hr className="my-2" />
          <p className="text-xl font-bold text-gray-900">
            合計：¥{totalPrice.toLocaleString()}
          </p>
        </div>

        <button
          disabled={isBookingDisabled}
          className={`w-full rounded px-4 py-2 text-white ${
            isBookingDisabled ? "bg-gray-400" : "bg-blue-600"
          }`}
          onClick={async () => {
            const end_date = returnDate ? returnDate.toISOString().split("T")[0] : null;

            // 🧩 在庫確認
            for (const t of Object.keys(qty)) {
              const q = qty[t as BikeType];
              if (q > 0) {
                const res = await fetch("/api/check-availability", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ bike_type: t, start_date: date, end_date, request_qty: q, plan }),
                });
                const check = await res.json();
                if (!check.ok || check.available === false) {
                  alert(`${t} の在庫が足りません。別の日または台数を変更してください。`);
                  return;
                }
              }
            }

            // 🧩 予約送信
            const payload = {
              plan,
              start_date: date,
              end_date,
              start_time: (plan === "3h" || plan === "6h") ? startTime : null,
              pickup_time: (plan === "1d" || plan === "2d_plus") ? pickupTime : null,
              bikes: qty,
              addonsByBike,
              subtotal,
              addons_price: addons,
              discount,
              total_price: totalPrice,
              name: "テスト太郎",
              email: "test@example.com",
              paid: false,
            };

            const save = await fetch("/api/reserve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const result = await save.json();

            if (result.success) alert("✅ 予約を保存しました！（SupabaseにINSERT済み）");
            else alert("❌ 保存エラー: " + result.message);
          }}
        >
          予約内容を確認
        </button>
      </section>
    </div>
  );
}