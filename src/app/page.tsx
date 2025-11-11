"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import {
  CalendarDays,
  Clock,
  MapPin,
  Shield,
  Bike as BikeIcon,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

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

const BIKE_GROUPS = [
  {
    id: "cross",
    title: "クロスバイク",
    description: "軽快に走れるスタンダードモデル。身長に合わせてサイズをお選びください。",
    types: ["クロスバイク S", "クロスバイク M", "クロスバイク L"],
  },
  {
    id: "electricA",
    title: "電動アシスト A",
    description: "坂道やロングライドも楽な電動アシスト車です。",
    types: ["電動A S", "電動A M", "電動A L"],
  },
  {
    id: "electricB",
    title: "電動アシスト B",
    description: "チャイルドシート付きでお子さま同乗におすすめ。",
    types: ["電動B"],
  },
  {
    id: "kids",
    title: "キッズバイク",
    description: "お子さまの身長に合わせてサイズをお選びください。",
    types: ["キッズ130以下", "キッズ130以上"],
  },
] satisfies Array<{ id: string; title: string; description: string; types: BikeType[] }>;

const PRICE = {
  クロス: { "6h": 2500, "1d": 3500, "2d_plus": 6500, addDay: 2700 },
  電動A: { "6h": 3500, "1d": 4500, "2d_plus": 8500, addDay: 3600 },
  電動B: { "6h": 4500, "1d": 5500, "2d_plus": 11000, addDay: 4500 },
  キッズ: { "6h": 500, "1d": 500, "2d_plus": 1000, addDay: 500 },
};

const ADDONS = [
  { id: "A-HOLDER", name: "スマホホルダー", price: 500 },
  { id: "A-BATTERY", name: "予備バッテリー", price: 1000 },
  { id: "A-CHILDSEAT", name: "チャイルドシート", price: 1000 },
  { id: "A-CARRIER", name: "リアキャリア", price: 1500 },
];

const DROPOFF_PRICE = 3000;

const INSURANCE_PLANS = [
  { id: "none", name: "補償なし", price: 0, description: "補償は付帯しません" },
  { id: "A", name: "Aプラン", price: 500, description: "1万円までの修理代を保障" },
  { id: "B", name: "Bプラン", price: 1000, description: "車両価格の30%まで保障" },
  { id: "C", name: "Cプラン", price: 2000, description: "車両価格の50%まで保障" },
] as const;
const PLAN_DETAILS: Array<{
  id: "6h" | "1d" | "2d_plus";
  title: string;
  subtitle: string;
  note?: string;
}> = [
  {
    id: "6h",
    title: "6時間プラン",
    subtitle: "半日で向島・しまなみ海道を満喫したい方に",
    note: "ご出発は 8:00 / 8:30 / 9:00 からお選びいただけます",
  },
  {
    id: "1d",
    title: "1日プラン",
    subtitle: "朝から夕方まで自由にサイクリング",
  },
  {
    id: "2d_plus",
    title: "2日以上プラン",
    subtitle: "泊まりがけ・ロングライドにおすすめ",
    note: "2日目以降は1日ごとに追加料金が発生します",
  },
];
const PLAN_LABELS: Record<"6h" | "1d" | "2d_plus", string> = {
  "6h": "6時間プラン",
  "1d": "1日プラン",
  "2d_plus": "2日以上プラン",
};
const INSURANCE_PLAN_LABELS: Record<InsurancePlanId, string> = INSURANCE_PLANS.reduce(
  (acc, plan) => ({ ...acc, [plan.id]: plan.name }),
  {} as Record<InsurancePlanId, string>
);
type InsurancePlanId = (typeof INSURANCE_PLANS)[number]["id"];

const BIKE_TYPE_STYLES: Record<BikeType, {
  headerBg: string;
  headerLabel: string;
  headerText: string;
  border: string;
  ring: string;
  iconBg: string;
  iconColor: string;
  inputBorder: string;
  accentText: string;
}> = {
  "クロスバイク S": {
    headerBg: "bg-sky-50",
    headerLabel: "text-sky-600",
    headerText: "text-sky-900",
    border: "border-sky-100",
    ring: "ring-sky-100",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    inputBorder: "border-sky-200",
    accentText: "text-sky-600",
  },
  "クロスバイク M": {
    headerBg: "bg-sky-50",
    headerLabel: "text-sky-600",
    headerText: "text-sky-900",
    border: "border-sky-100",
    ring: "ring-sky-100",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    inputBorder: "border-sky-200",
    accentText: "text-sky-600",
  },
  "クロスバイク L": {
    headerBg: "bg-sky-50",
    headerLabel: "text-sky-600",
    headerText: "text-sky-900",
    border: "border-sky-100",
    ring: "ring-sky-100",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    inputBorder: "border-sky-200",
    accentText: "text-sky-600",
  },
  "電動A S": {
    headerBg: "bg-emerald-50",
    headerLabel: "text-emerald-600",
    headerText: "text-emerald-900",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    inputBorder: "border-emerald-200",
    accentText: "text-emerald-600",
  },
  "電動A M": {
    headerBg: "bg-emerald-50",
    headerLabel: "text-emerald-600",
    headerText: "text-emerald-900",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    inputBorder: "border-emerald-200",
    accentText: "text-emerald-600",
  },
  "電動A L": {
    headerBg: "bg-emerald-50",
    headerLabel: "text-emerald-600",
    headerText: "text-emerald-900",
    border: "border-emerald-100",
    ring: "ring-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    inputBorder: "border-emerald-200",
    accentText: "text-emerald-600",
  },
  電動B: {
    headerBg: "bg-violet-50",
    headerLabel: "text-violet-600",
    headerText: "text-violet-900",
    border: "border-violet-100",
    ring: "ring-violet-100",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    inputBorder: "border-violet-200",
    accentText: "text-violet-600",
  },
  "キッズ130以下": {
    headerBg: "bg-amber-50",
    headerLabel: "text-amber-600",
    headerText: "text-amber-900",
    border: "border-amber-100",
    ring: "ring-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    inputBorder: "border-amber-200",
    accentText: "text-amber-600",
  },
  "キッズ130以上": {
    headerBg: "bg-amber-50",
    headerLabel: "text-amber-600",
    headerText: "text-amber-900",
    border: "border-amber-100",
    ring: "ring-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    inputBorder: "border-amber-200",
    accentText: "text-amber-600",
  },
};

const DEFAULT_BIKE_STYLE = {
  headerBg: "bg-slate-50",
  headerLabel: "text-slate-500",
  headerText: "text-slate-900",
  border: "border-slate-200",
  ring: "ring-slate-200",
  iconBg: "bg-slate-100",
  iconColor: "text-slate-500",
  inputBorder: "border-slate-200",
  accentText: "text-slate-600",
};

/* =========================================================
   祝日 / 三連休判定
   ========================================================= */
const holidaySetCache = new Map<number, Set<string>>();

async function getHolidaySet(year: number): Promise<Set<string>> {
  if (holidaySetCache.has(year)) {
    return holidaySetCache.get(year)!;
  }

  try {
    const res = await fetch(`/api/holidays?year=${year}`);
    if (!res.ok) {
      throw new Error("failed to fetch holidays");
    }
    const json = await res.json();
    const set = new Set<string>((json.holidays || []).map((h: { date: string }) => h.date));
    holidaySetCache.set(year, set);
    return set;
  } catch (error) {
    console.warn("Failed to fetch holidays:", error);
    const set = new Set<string>();
    holidaySetCache.set(year, set);
    return set;
  }
}

function isBusySeason(date: string): boolean {
  if (!date) return false;
  const month = new Date(date).getMonth() + 1;
  return (month >= 3 && month <= 5) || (month >= 9 && month <= 11);
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function createDateFromInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function isHolidayOrWeekendDay(date: Date): Promise<boolean> {
  const key = formatDateKey(date);
  const holidaySet = await getHolidaySet(date.getFullYear());
  if (holidaySet.has(key)) return true;
  return isWeekend(date);
}

async function countConsecutiveHolidayLikeDays(date: Date): Promise<number> {
  if (Number.isNaN(date.getTime())) return 0;
  if (!(await isHolidayOrWeekendDay(date))) return 0;

  let count = 1;

  const prev = new Date(date);
  while (true) {
    prev.setDate(prev.getDate() - 1);
    if (!(await isHolidayOrWeekendDay(prev))) break;
    count += 1;
  }

  const next = new Date(date);
  while (true) {
    next.setDate(next.getDate() + 1);
    if (!(await isHolidayOrWeekendDay(next))) break;
    count += 1;
  }

  return count;
}

async function isBusySeasonHolidaySequence(dateStr: string): Promise<boolean> {
  if (!dateStr) return false;
  if (!isBusySeason(dateStr)) return false;

  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;

  const stretch = await countConsecutiveHolidayLikeDays(target);
  return stretch >= 3;
}

function addHours(time: string, hours: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + hours);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function generateSixHourStartTimes() {
  return ["08:00", "08:30", "09:00"];
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
  const parsed = createDateFromInput(date);
  return parsed ? parsed.getDay() : -1;
}

function calcReturnDate(date: string, plan: string, days: number) {
  if (!date) return null;
  const base = createDateFromInput(date);
  if (!base) return null;
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (plan === "6h" || plan === "1d") {
    return d;
  }
  if (plan === "2d_plus") {
    d.setDate(d.getDate() + (days - 1));
  }
  return d;
}

function priceKeyOf(type: string) {
  if (type.startsWith("クロスバイク")) return "クロス";
  if (type.startsWith("電動A")) return "電動A";
  if (type === "電動B") return "電動B";
  if (type.startsWith("キッズ")) return "キッズ";
  return "クロス";
}

type ReservationSummary = {
  reservationId: string;
  reservationIdShort: string;
  planId: "6h" | "1d" | "2d_plus";
  planLabel: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  pickupTime: string | null;
  customerName: string;
  customerEmail: string;
  bikes: Array<{ label: string; count: number }>;
  addons: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  addonsPrice: number;
  dropoff: boolean;
  dropoffPrice: number;
  insurancePlan: InsurancePlanId;
  insurancePrice: number;
  discount: number;
  discountLabel: string;
  totalPrice: number;
};

export default function RentacyclePageV5() {
  const [plan, setPlan] = useState<"6h" | "1d" | "2d_plus" | "">("");
  const [days, setDays] = useState(2);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [pickupTime, setPickupTime] = useState("08:00");
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropoff, setDropoff] = useState(false);
  const [insurancePlan, setInsurancePlan] = useState<InsurancePlanId>("none");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isThreeDayWeekendBlocked, setIsThreeDayWeekendBlocked] = useState(false);
  const [reservationResult, setReservationResult] = useState<ReservationSummary | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [qty, setQty] = useState<Record<BikeType, number>>(
    Object.fromEntries(BIKE_TYPES.map((t) => [t.id, 0])) as Record<BikeType, number>
  );

  type AddonsByBike = Partial<Record<BikeType, Array<Partial<Record<string, number>>>>>;
  const [addonsByBike, setAddonsByBike] = useState<AddonsByBike>({});

  const setQtySafe = (bikeId: string, value: number) => {
    const numeric = Number.isFinite(value) ? value : 0;
    const safeValue = Math.max(0, Math.floor(numeric));
    setQty((prev) => ({ ...prev, [bikeId]: safeValue }));
  };

  const handleStatusChange = useCallback(
    (
      bikeId: string,
      status: { remaining?: number | null; loading?: boolean; error?: string | null }
    ) => {
      setRemaining((prev) => {
        if (status.remaining == null) {
          const fallback = inventory[bikeId];
          if (fallback == null) {
            if (!prev || !(bikeId in prev)) return prev;
            const next = { ...prev };
            delete next[bikeId];
            return Object.keys(next).length ? next : null;
          }

          if (prev?.[bikeId] === fallback) return prev;
          return { ...(prev || {}), [bikeId]: fallback };
        }

        if (prev?.[bikeId] === status.remaining) return prev;
        return { ...(prev || {}), [bikeId]: status.remaining };
      });
    },
    [inventory]
  );

  useEffect(() => {
    setRemaining(null);
  }, [plan, date, days]);

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

  useEffect(() => {
    const updated: AddonsByBike = { ...addonsByBike };
    for (const type of BIKE_TYPES.map((t) => t.id)) {
      const count = qty[type] || 0;
      const current = updated[type] || [];
      if (current.length < count) {
        for (let i = current.length; i < count; i++) current.push({});
      } else if (current.length > count) {
        current.length = count;
      }
      updated[type] = current;
    }
    setAddonsByBike(updated);
  }, [qty]);

  useEffect(() => {
    if (plan !== "6h" || !date) {
      setIsThreeDayWeekendBlocked(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const blocked = await isBusySeasonHolidaySequence(date);
      if (!cancelled) {
        setIsThreeDayWeekendBlocked(blocked);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan, date]);

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
  const isEmailValid = useMemo(() => {
    if (!customerEmail.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim());
  }, [customerEmail]);

  const rentalDays = useMemo(() => {
    if (!plan || !date) return 0;
    if (plan === "6h" || plan === "1d") return 1;
    if (plan === "2d_plus") return days;
    return 0;
  }, [plan, date, days]);

  const { subtotal, addons, dropoffPrice, insurancePrice, totalPrice, discount, discountLabel } = useMemo(() => {
    if (!plan) {
      return {
        subtotal: 0,
        addons: 0,
        dropoffPrice: 0,
        insurancePrice: 0,
        totalPrice: 0,
        discount: 0,
        discountLabel: "",
      };
    }

    let subtotal = 0;
    for (const type of BIKE_TYPES.map((t) => t.id)) {
      const count = qty[type] || 0;
      if (!count) continue;
      const key = priceKeyOf(type);
      const table = PRICE[key as keyof typeof PRICE];
      let price = 0;
      if (plan === "6h" || plan === "1d" || plan === "2d_plus") {
        price = table[plan as "6h" | "1d" | "2d_plus"];
      }
      if (plan === "2d_plus" && rentalDays > 2) {
        price = table["2d_plus"] + table.addDay * (rentalDays - 2);
      }
      subtotal += price * count;
    }

    let addonsTotal = 0;
    for (const type of BIKE_TYPES.map((t) => t.id)) {
      const addonSets = addonsByBike[type] || [];
      addonSets.forEach((set) => {
        for (const addon of ADDONS) {
          addonsTotal += addon.price * (set[addon.id] ?? 0);
        }
      });
    }

    const dropoffPrice = dropoff ? DROPOFF_PRICE * totalBikes : 0;

    const selectedInsurance = INSURANCE_PLANS.find((p) => p.id === insurancePlan);
    const insurancePrice =
      selectedInsurance && insurancePlan !== "none" && totalBikes > 0
        ? selectedInsurance.price * rentalDays * totalBikes
        : 0;

    const baseTotal = subtotal + addonsTotal + dropoffPrice + insurancePrice;
    const eligible = adultCount >= 3 && (plan === "1d" || plan === "2d_plus");
    const discount = eligible ? Math.floor(baseTotal * 0.1) : 0;
    const discounted = baseTotal - discount;

    return {
      subtotal,
      addons: addonsTotal,
      dropoffPrice,
      insurancePrice,
      totalPrice: discounted,
      discount,
      discountLabel: eligible ? "グループ割 10%OFF 適用" : "",
    };
  }, [plan, qty, addonsByBike, dropoff, insurancePlan, totalBikes, rentalDays, adultCount]);

  const isBookingDisabled =
    isClosed ||
    isReturnClosed ||
    !plan ||
    totalBikes === 0 ||
    (plan === "6h" && isThreeDayWeekendBlocked) ||
    !customerName.trim() ||
    !isEmailValid;

  const closureMessage = useMemo(() => {
    if (!plan || !date) return "";
    if (plan === "6h" || plan === "1d") {
      if (isClosed || isReturnClosed) {
        return "定休日（水曜）は予約できません。";
      }
      return "";
    }
    if (isClosed && isReturnClosed) {
      return "貸出日と返却日が定休日（水曜）に当たるためご利用いただけません";
    }
    if (isClosed) {
      return "貸出日が定休日（水曜）に当たるためご利用いただけません";
    }
    if (isReturnClosed) {
      return "返却日が定休日（水曜）に当たるためご利用いただけません";
    }
    return "";
  }, [plan, date, isClosed, isReturnClosed]);

  const handleDateChange = useCallback(
    (value: string) => {
      if (!value) {
        setDate("");
        return;
      }
      const selected = new Date(value);
      if (Number.isNaN(selected.getTime())) {
        setDate(value);
        return;
      }
      if ((plan === "6h" || plan === "1d") && selected.getDay() === CLOSED_DAY) {
        return;
      }
      setDate(value);
    },
    [plan]
  );

  useEffect(() => {
    setDate("");
  }, [plan]);

  const formView = (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header className="px-1 py-6 sm:py-8">
          <div className="space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="h-px w-8 bg-slate-300" /> 木曽サイクル
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-[2.5rem]">レンタサイクル予約フォーム</h1>
            <p className="text-sm text-slate-500 sm:text-base">
              ご利用日時・車種・オプションを選択し、予約内容をご確認ください。
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                <Clock className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">営業時間</p>
                <p className="text-sm font-semibold text-slate-900">
                  {OPEN_TIME} 〜 {CLOSE_TIME}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">定休日</p>
                <p className="text-sm font-semibold text-slate-900">水曜日</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ドロップオフ</p>
                <p className="text-sm font-semibold text-slate-900">今治で返却可能（繁忙期除く）</p>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 01</span>
            <h2 className="text-xl font-semibold text-slate-900">プランを選ぶ</h2>
            <p className="text-sm text-slate-500">ご利用予定の時間帯・日数にあわせてプランをお選びください。</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLAN_DETAILS.map((planOption) => {
              const isActive = plan === planOption.id;
              return (
                <label
                  key={planOption.id}
                  className={`relative flex h-full cursor-pointer flex-col gap-2 rounded-2xl border px-5 py-4 transition hover:border-blue-300 hover:shadow-sm ${
                    isActive ? "border-blue-500 bg-blue-50/80 shadow-sm" : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    className="hidden"
                    checked={isActive}
                    onChange={() => setPlan(planOption.id)}
                  />
                  <span className="text-sm font-semibold text-slate-900">{planOption.title}</span>
                  <span className="text-xs text-slate-500">{planOption.subtitle}</span>
                  {planOption.note && <span className="text-xs text-blue-600">{planOption.note}</span>}
                  <span
                    className={`mt-auto inline-flex items-center gap-1 text-xs font-medium ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    選択する <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {plan && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 02</span>
              <h2 className="text-xl font-semibold text-slate-900">日時を選ぶ</h2>
              <p className="text-sm text-slate-500">
                出発日と来店時間を選ぶと、空き状況が自動的に更新されます。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> 貸出日
                </span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                {plan === "2d_plus" && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="text-slate-500">ご利用日数</span>
                    <input
                      type="number"
                      min={2}
                      value={days}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
                      onChange={(e) => setDays(Math.max(2, Number(e.target.value) || 2))}
                    />
                  </div>
                )}
                {plan === "6h" && isThreeDayWeekendBlocked && (
                  <p className="text-xs text-red-500">※繁忙期の三連休は6時間プランの予約ができません</p>
                )}
                {returnDate && plan !== "6h" && (
                  <p className="text-xs text-slate-500">返却予定日：{returnDate.toLocaleDateString()}（{"日月火水木金土"[returnWeekday]}）</p>
                )}
                {plan === "6h" && (
                  <p className="text-xs text-slate-500">返却予定：{addHours(startTime, 6)}（最終返却 {CLOSE_TIME}）</p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> 来店時間
                </span>
                {plan === "6h" ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {generateSixHourStartTimes().map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    {generateBusinessSlots().map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-500">
                  {plan === "6h" ? "出発時間を選ぶと、返却時間が自動で計算されます。" : "ご来店予定時間は目安で構いません。"}
                </p>
              </div>
            </div>
            {closureMessage && (
              <p className="text-xs text-red-500">{closureMessage}</p>
            )}
          </section>
        )}

        {(() => {
          return !loading && plan && date && !closureMessage;
        })() && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 03</span>
              <h2 className="text-xl font-semibold text-slate-900">車種と台数を選ぶ</h2>
              <p className="text-sm text-slate-500">空き状況を確認しながら、ご希望の台数を入力してください。</p>
            </div>
            <div className="space-y-6">
              {BIKE_GROUPS.map((group) => {
                const groupTypes = group.types
                  .map((typeId) => BIKE_TYPES.find((t) => t.id === typeId))
                  .filter((t): t is (typeof BIKE_TYPES)[number] => Boolean(t));

                if (groupTypes.length === 0) {
                  return null;
                }

                const primaryType = groupTypes[0].id as BikeType;
                const priceKey = priceKeyOf(primaryType) as keyof typeof PRICE;
                const priceTable = PRICE[priceKey];

                return (
                  <div key={group.id} className="space-y-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                        <p className="text-xs text-slate-500">{group.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">料金の目安</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        6時間：<span className="font-semibold text-slate-800">¥{priceTable["6h"].toLocaleString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        1日：<span className="font-semibold text-slate-800">¥{priceTable["1d"].toLocaleString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        2日以上：<span className="font-semibold text-slate-800">¥{priceTable["2d_plus"].toLocaleString()}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">追加1日ごとに +¥{priceTable.addDay.toLocaleString()}</span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {groupTypes.map((bike) => {
                        const available = remaining?.[bike.id] ?? inventory[bike.id] ?? 0;
                        const planned = qty[bike.id] || 0;
                        const projected = available - planned;
                        const shortage = projected < 0;
                        const projectedDisplay = Math.max(projected, 0);
                        const style = BIKE_TYPE_STYLES[bike.id as BikeType] ?? DEFAULT_BIKE_STYLE;

                        return (
                          <section
                            key={bike.id}
                            className={`overflow-hidden rounded-3xl border ${style.border} bg-white shadow-sm ring-1 ${style.ring}`}
                          >
                            <div className={`flex items-center justify-between gap-3 px-5 py-4 ${style.headerBg}`}>
                              <div>
                                <p className={`text-[11px] font-semibold uppercase tracking-wide ${style.headerLabel}`}>車種</p>
                                <h4 className={`text-lg font-semibold ${style.headerText}`}>{bike.label}</h4>
                              </div>
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style.iconBg}`}>
                                <BikeIcon className={`h-5 w-5 ${style.iconColor}`} />
                              </div>
                              <AvailabilityChecker
                                bikeType={bike.id}
                                startDate={date}
                                endDate={returnDate ? formatDateKey(returnDate) : null}
                                requestQty={qty[bike.id] || 0}
                                onStatusChange={(status) => handleStatusChange(bike.id, status)}
                                fallbackRemaining={remaining?.[bike.id] ?? inventory[bike.id] ?? null}
                                className="sr-only"
                              />
                            </div>
                            <div className="space-y-5 p-5">
                              <p className="text-xs text-slate-500">予約後に残る台数を確認しながら台数を調整できます。</p>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">空き台数</span>
                                  <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-semibold ${shortage ? "text-red-500" : style.accentText}`}>{projectedDisplay}</span>
                                    <span className="text-sm text-slate-400">台</span>
                                  </div>
                                  <p className="text-xs text-slate-500">ご予約確定時に残る目安の台数です。</p>
                                </div>
                                <div className={`flex flex-col gap-3 rounded-2xl border ${style.inputBorder} bg-white p-5`}>
                                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">予約したい台数</label>
                                  <input
                                    type="number"
                                    min={0}
                                    data-availability-pause
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-right text-2xl font-semibold text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    value={qty[bike.id]}
                                    onChange={(e) => setQtySafe(bike.id, Number(e.target.value))}
                                    disabled={available <= 0}
                                  />
                                  <p className="text-xs text-slate-500">ご希望の台数をご入力ください。空きが不足するとお知らせします。</p>
                                </div>
                              </div>
                              {shortage && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                                  空き台数が不足しています。台数を調整するか別の日程をご検討ください。
                                </div>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {plan && totalBikes > 0 && (
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 04</span>
              <h2 className="text-xl font-semibold text-slate-900">オプションと補償</h2>
              <p className="text-sm text-slate-500">各自転車ごとに必要なオプションと補償プランをお選びください。</p>
            </div>

            <div className="space-y-4">
              {BIKE_TYPES.map(({ id, label }) => {
                const count = qty[id] || 0;
                if (!count) return null;
                const perType = addonsByBike[id] || [];
                return (
                  <div key={id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <BikeIcon className="h-4 w-4 text-blue-500" />
                      {label}（{count}台）
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="space-y-3 rounded-2xl border border-white bg-white p-3 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500">{label} #{i + 1}</p>
                          <div className="space-y-2">
                            {ADDONS.map((addon) => (
                              <label key={addon.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                <span>{addon.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-400">+¥{addon.price}</span>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(perType[i]?.[addon.id])}
                                    onChange={(e) => {
                                      const updated = { ...perType[i], [addon.id]: e.target.checked ? 1 : 0 };
                                      const newList = [...perType];
                                      newList[i] = updated;
                                      setAddonsByBike((prev) => ({
                                        ...prev,
                                        [id]: newList,
                                      }));
                                    }}
                                  />
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <MapPin className="h-3.5 w-3.5" /> ドロップオフサービス
                </span>
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                  dropoff ? "border-blue-400 bg-white" : "border-transparent bg-white"
                }`}>
                  <input
                    type="checkbox"
                    checked={dropoff}
                    onChange={(e) => setDropoff(e.target.checked)}
                    disabled={isBusySeason(date)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="space-y-2">
                    <p className="font-medium text-slate-900">今治で返却する（1台につき ¥{DROPOFF_PRICE.toLocaleString()}）</p>
                    {dropoff && totalBikes > 0 && (
                      <p className="text-xs text-slate-500">
                        ドロップオフ料金：¥{dropoffPrice.toLocaleString()}（{totalBikes}台 × ¥{DROPOFF_PRICE.toLocaleString()}）
                      </p>
                    )}
                    {isBusySeason(date) ? (
                      <p className="text-xs text-red-500">※繁忙期（3〜5月／9〜11月）はご利用いただけません</p>
                    ) : (
                      <p className="text-xs text-slate-500">台数分の料金が追加されます。返却後は翌日の貸出ができない場合があります。</p>
                    )}
                  </div>
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Shield className="h-3.5 w-3.5" /> 車両補償プラン
                </span>
                <div className="space-y-2">
                  {INSURANCE_PLANS.map((planOption) => (
                    <label
                      key={planOption.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        insurancePlan === planOption.id ? "border-blue-400 bg-white" : "border-transparent bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="insurance"
                        checked={insurancePlan === planOption.id}
                        onChange={() => setInsurancePlan(planOption.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">
                          {planOption.name}
                          {planOption.id !== "none" && (
                            <span className="ml-2 text-xs text-slate-500">¥{planOption.price.toLocaleString()} / 日</span>
                          )}
                        </p>
                        {planOption.description && (
                          <p className="text-xs text-slate-500">{planOption.description}</p>
                        )}
                        {insurancePlan === planOption.id && planOption.id !== "none" && totalBikes > 0 && rentalDays > 0 && (
                          <p className="text-xs text-blue-600">
                            補償料金：¥{(planOption.price * rentalDays * totalBikes).toLocaleString()}（{totalBikes}台 × {rentalDays}日）
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  ※貸出時と異なる重大な破損が確認された場合、補償内容に応じて修理費等を請求いたします。
                </p>
              </div>
            </div>
          </section>
        )}

        {(() => {
          const hasSelections = Object.values(qty).some((count) => (count || 0) > 0);
          return hasSelections && plan && date && !closureMessage;
        })() && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 05</span>
              <h2 className="text-xl font-semibold text-slate-900">料金を確認して予約する</h2>
              <p className="text-sm text-slate-500">選択内容を確認し、予約内容確認ボタンから最終確認へ進みます。</p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">代表者氏名（必須）</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="例：木曽 太郎"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">メールアドレス（必須）</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="例：example@kisoscycle.jp"
                    className={`rounded-xl border px-3 py-2 text-sm focus:outline-none ${
                      customerEmail
                        ? isEmailValid
                          ? "border-emerald-300 focus:border-emerald-400"
                          : "border-red-300 focus:border-red-400"
                        : "border-slate-200 focus:border-blue-400"
                    }`}
                  />
                  {customerEmail && !isEmailValid && (
                    <p className="text-xs text-red-500">メールアドレスの形式をご確認ください。</p>
                  )}
                </div>
                <p className="text-xs text-slate-500">ご予約内容はこのメールアドレスに自動送信されます。お間違いのないようご入力ください。</p>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>基本料金</span>
                  <span className="font-semibold text-slate-900">¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>オプション</span>
                  <span className="font-semibold text-slate-900">¥{addons.toLocaleString()}</span>
                </div>
                {dropoffPrice > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ドロップオフ</span>
                    <span className="font-semibold text-slate-900">¥{dropoffPrice.toLocaleString()}</span>
                  </div>
                )}
                {insurancePrice > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>車両補償</span>
                    <span className="font-semibold text-slate-900">¥{insurancePrice.toLocaleString()}</span>
                  </div>
                )}
                {discountLabel && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>{discountLabel}</span>
                    <span>-¥{discount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-slate-700 sm:flex-row sm:items-center">
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">お支払い予定金額</p>
                <p className="mt-2 text-3xl font-semibold text-blue-900">¥{totalPrice.toLocaleString()}</p>
                <p className="mt-1 text-xs text-blue-600">税込・店頭でお支払いください。</p>
              </div>
              <button
                disabled={isBookingDisabled}
                onClick={() => setShowConfirmModal(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                  isBookingDisabled ? "cursor-not-allowed bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                予約内容を確認
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Review</p>
                <h2 className="text-2xl font-semibold text-slate-900">ご予約内容の最終確認</h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                閉じる
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">プラン</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {plan === "6h" && "6時間プラン"}
                    {plan === "1d" && "1日プラン"}
                    {plan === "2d_plus" && `${days}日プラン`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">貸出日時</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {date}
                    {plan === "6h" && startTime && `（開始 ${startTime}）`}
                    {plan !== "6h" && pickupTime && `（来店 ${pickupTime}）`}
                  </p>
                  {returnDate && <p className="text-xs text-slate-500">返却日：{formatDateKey(returnDate)}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ご連絡先</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{customerName || "未入力"}</p>
                <p className="text-xs text-slate-500">{customerEmail || "メール未入力"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">自転車</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {Object.entries(qty).map(([bikeType, count]) => {
                    if (!count || count === 0) return null;
                    const bikeLabel = BIKE_TYPES.find((b) => b.id === bikeType)?.label || bikeType;
                    return (
                      <div key={bikeType} className="flex items-center justify-between">
                        <span>{bikeLabel}</span>
                        <span className="font-semibold">× {count}台</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {addons > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">オプション</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    {ADDONS.map((addon) => {
                      const totalQty = BIKE_TYPES.reduce((sum, { id }) => {
                        const perType = addonsByBike[id] || [];
                        return (
                          sum +
                          perType.reduce((innerSum, set) => innerSum + (set?.[addon.id] ?? 0), 0)
                        );
                      }, 0);
                      if (!totalQty) return null;
                      return (
                        <div key={addon.id} className="flex items-center justify-between">
                          <span>{addon.name}</span>
                          <span className="font-semibold">
                            × {totalQty}（¥{(addon.price * totalQty).toLocaleString()}）
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {dropoff && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ドロップオフ</p>
                  <p className="mt-1 text-sm text-slate-700">
                    今治返却（¥{DROPOFF_PRICE.toLocaleString()} × {totalBikes}台） = ¥{dropoffPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {insurancePlan !== "none" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">車両補償</p>
                  {(() => {
                    const planInfo = INSURANCE_PLANS.find((p) => p.id === insurancePlan);
                    if (!planInfo) return null;
                    return (
                      <p className="mt-1 text-sm text-slate-700">
                        {planInfo.name}（¥{planInfo.price.toLocaleString()} × {rentalDays}日 × {totalBikes}台） = ¥
                        {insurancePrice.toLocaleString()}
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">料金内訳</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between">
                    <span>基本料金</span>
                    <span className="font-semibold">¥{subtotal.toLocaleString()}</span>
                  </p>
                  {addons > 0 && (
                    <p className="flex items-center justify-between">
                      <span>オプション</span>
                      <span className="font-semibold">¥{addons.toLocaleString()}</span>
                    </p>
                  )}
                  {dropoffPrice > 0 && (
                    <p className="flex items-center justify-between">
                      <span>ドロップオフ</span>
                      <span className="font-semibold">¥{dropoffPrice.toLocaleString()}</span>
                    </p>
                  )}
                  {insurancePrice > 0 && (
                    <p className="flex items-center justify-between">
                      <span>車両補償</span>
                      <span className="font-semibold">¥{insurancePrice.toLocaleString()}</span>
                    </p>
                  )}
                  {discountLabel && (
                    <p className="flex items-center justify-between text-emerald-600">
                      <span>{discountLabel}</span>
                      <span>-¥{discount.toLocaleString()}</span>
                    </p>
                  )}
                  <p className="flex items-center justify-between text-lg font-semibold text-slate-900">
                    <span>お支払い予定金額</span>
                    <span>¥{totalPrice.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50"
              >
                修正する
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  const end_date = returnDate ? formatDateKey(returnDate) : null;

                  try {
                    for (const bikeType of Object.keys(qty)) {
                      const count = qty[bikeType as BikeType];
                      if (count > 0) {
                        const res = await fetch("/api/check-availability", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            bike_type: bikeType,
                            start_date: date,
                            end_date,
                            request_qty: count,
                          }),
                        });
                        const check = await res.json();
                        const result = check.data ?? check;
                        const available =
                          result.available === true || result.available === "true" ? true : false;
                        if (!available) {
                          alert(`${bikeType} の在庫が足りません。別の日または台数を変更してください。`);
                          setIsSubmitting(false);
                          return;
                        }
                      }
                    }

                    const payload = {
                      plan,
                      start_date: date,
                      end_date,
                      start_time: plan === "6h" ? startTime : null,
                      pickup_time: plan !== "6h" ? pickupTime : null,
                      bikes: qty,
                      addonsByBike,
                      total_price: totalPrice,
                      subtotal,
                      addons_price: addons,
                      discount,
                      discount_label: discountLabel,
                      dropoff,
                      dropoff_price: dropoffPrice,
                      insurance_plan: insurancePlan,
                      insurance_price: insurancePrice,
                      name: customerName.trim(),
                      email: customerEmail.trim(),
                    };

                    const res = await fetch("/api/reserve", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });

                    const json = await res.json();
                    if (json.status !== "ok") {
                      throw new Error(json.message || "予約に失敗しました");
                    }

                    if (!plan) {
                      throw new Error("プランが未設定です");
                    }

                    const planId = plan as "6h" | "1d" | "2d_plus";
                    const reservationEndDate = end_date;

                    const reservationIdFull = json.data?.[0]?.id || json.data?.id || json.reservation_id || "";
                    const reservationIdShort = reservationIdFull ? String(reservationIdFull).slice(0, 8) : "";

                    const selectedBikes = Object.entries(qty)
                      .filter(([_, count]) => (count || 0) > 0)
                      .map(([bikeType, count]) => ({
                        label: BIKE_TYPES.find((b) => b.id === bikeType)?.label || bikeType,
                        count: count || 0,
                      }));

                    const selectedAddons = ADDONS.map((addon) => {
                      const quantity = BIKE_TYPES.reduce((sum, { id }) => {
                        const perType = addonsByBike[id] || [];
                        return sum + perType.reduce((inner, set) => inner + (set?.[addon.id] ?? 0), 0);
                      }, 0);
                      return { name: addon.name, quantity, price: addon.price };
                    }).filter((item) => item.quantity > 0);

                    setReservationResult({
                      reservationId: reservationIdFull,
                      reservationIdShort,
                      planId,
                      planLabel: PLAN_LABELS[planId],
                      startDate: date,
                      endDate: reservationEndDate,
                      startTime: planId === "6h" ? startTime : null,
                      pickupTime: planId !== "6h" ? pickupTime : null,
                      customerName: customerName.trim(),
                      customerEmail: customerEmail.trim(),
                      bikes: selectedBikes,
                      addons: selectedAddons,
                      subtotal,
                      addonsPrice: addons,
                      dropoff,
                      dropoffPrice,
                      insurancePlan,
                      insurancePrice,
                      discount,
                      discountLabel,
                      totalPrice,
                    });

                    setQty(Object.fromEntries(BIKE_TYPES.map((t) => [t.id, 0])) as Record<BikeType, number>);
                    setAddonsByBike({});
                    setPlan("");
                    setDropoff(false);
                    setInsurancePlan("none");
                    setDays(2);
                    setDate("");
                    setStartTime("08:00");
                    setPickupTime("08:00");
                    setCustomerName("");
                    setCustomerEmail("");
                    setShowConfirmModal(false);
                  } catch (error: any) {
                    alert(error?.message || "予約に失敗しました");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "予約中..." : "この内容で予約する"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );

  if (!reservationResult) {
    return formView;
  }

  const result = reservationResult;

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> ご予約が完了しました
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">木曽サイクルへのご予約ありがとうございます</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            ご入力いただいた内容で予約を承りました。ご来店当日は受付でご予約番号をお伝えください。
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">予約番号</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.reservationIdShort}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">プラン</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.planLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">代表者</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.customerName}</p>
              <p className="text-xs text-slate-500">{result.customerEmail}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">貸出日</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.startDate}</p>
              {result.startTime && <p className="text-xs text-slate-500">開始時間：{result.startTime}</p>}
              {result.pickupTime && <p className="text-xs text-slate-500">来店予定：{result.pickupTime}</p>}
            </div>
            {result.endDate && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">返却日</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.endDate}</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <BikeIcon className="h-4 w-4" /> ご予約の車両
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {result.bikes.map(({ label, count }) => (
                  <li key={label} className="flex items-center justify-between">
                    <span>{label}</span>
                    <span className="font-semibold">× {count}台</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Shield className="h-4 w-4" /> オプション・補償
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                {result.addons.length > 0 ? (
                  <ul className="space-y-1">
                    {result.addons.map(({ name, quantity }) => (
                      <li key={name} className="flex items-center justify-between">
                        <span>{name}</span>
                        <span className="font-semibold">× {quantity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">オプションの追加はありません。</p>
                )}
                {result.insurancePlan !== "none" ? (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                    車両補償：{INSURANCE_PLAN_LABELS[result.insurancePlan]}（¥
                    {result.insurancePrice.toLocaleString()}）
                  </p>
                ) : (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">車両補償：加入なし</p>
                )}
                {result.dropoff ? (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                    ドロップオフ：今治返却（¥{result.dropoffPrice.toLocaleString()}）
                  </p>
                ) : (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">ドロップオフ：利用なし</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-5 text-left text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">お支払い予定金額</p>
            <p className="mt-2 text-3xl font-semibold">¥{result.totalPrice.toLocaleString()}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-200/80">
              <p>基本料金：¥{result.subtotal.toLocaleString()}</p>
              {result.addonsPrice > 0 && <p>オプション：¥{result.addonsPrice.toLocaleString()}</p>}
              {result.dropoffPrice > 0 && <p>ドロップオフ：¥{result.dropoffPrice.toLocaleString()}</p>}
              {result.insurancePrice > 0 && <p>車両補償：¥{result.insurancePrice.toLocaleString()}</p>}
              {result.discountLabel && (
                <p className="text-emerald-200">{result.discountLabel}（-¥{result.discount.toLocaleString()}）</p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-3 text-sm text-slate-500">
          <p>ご予約内容はご登録のメールアドレスにも送信されています。確認メールが届かない場合は迷惑メールフォルダーもご確認ください。</p>
          <p>変更・キャンセルをご希望の際は、予約完了メール内のキャンセル申請リンクからお手続きをお願いいたします。</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setReservationResult(null)}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            別の予約を入力する
          </button>
        </div>
      </div>
    </div>
  );
}