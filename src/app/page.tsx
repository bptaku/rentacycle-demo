"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import LocaleDatePicker from "@/components/LocaleDatePicker";
import {
  CalendarDays,
  Clock,
  MapPin,
  Shield,
  Bike as BikeIcon,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  type ReservationLocale,
  getReservationTranslations,
  getPlanDetails,
  getPlanLabels,
  getBikeGroups,
  getBikeTypeLabels,
  getAddonNames,
  getInsurancePlans,
  interpolate,
  getWeekdayShort,
} from "@/lib/reservation-i18n";
import { getMinBookingDateStr } from "@/lib/booking-date";

/* =========================================================
   定義
   ========================================================= */
const OPEN_TIME = "08:00";
const CLOSE_TIME = "18:30";
const CLOSED_DAY = 3; // 水曜

const BIKE_TYPES = [
  // クロスバイク
  { id: "クロスバイク XS", label: "クロスバイク XS（150〜163cm）" },
  { id: "クロスバイク S", label: "クロスバイク S（157〜170cm）" },
  { id: "クロスバイク M", label: "クロスバイク M（165〜177cm）" },
  { id: "クロスバイク XL", label: "クロスバイク XL（180〜195cm）" },
  // ロードバイク
  { id: "ロードバイク S", label: "ロードバイク S（165〜172cm）" },
  { id: "ロードバイク M", label: "ロードバイク M（170〜180cm）" },
  { id: "ロードバイク L", label: "ロードバイク L（177〜193cm）" },
  // 電動A
  { id: "電動A S", label: "電動A S（146cm〜170cm）" },
  { id: "電動A M", label: "電動A M（153cm〜185cm）" },
  // 電動B
  { id: "電動B M", label: "電動B M（156cm〜180cm）" },
  { id: "電動B チャイルドシート", label: "電動B チャイルドシート付き" },
  // 電動C
  { id: "電動C S", label: "電動C S（162〜172cm）" },
  { id: "電動C M", label: "電動C M（170〜182cm）" },
  // キッズ
  { id: "キッズ20インチ", label: "キッズ 20インチ（約115cm〜）" },
  { id: "キッズ24インチ", label: "キッズ 24インチ（約130cm〜）" },
  { id: "キッズ26インチ", label: "キッズ 26インチ（約140cm〜）" },
] as const;
type BikeType = (typeof BIKE_TYPES)[number]["id"];

const BIKE_GROUPS_BASE = [
  {
    id: "cross",
    types: ["クロスバイク XS", "クロスバイク S", "クロスバイク M", "クロスバイク XL"],
  },
  {
    id: "road",
    types: ["ロードバイク S", "ロードバイク M", "ロードバイク L"],
  },
  {
    id: "electricA",
    types: ["電動A S", "電動A M"],
  },
  {
    id: "electricB",
    types: ["電動B M", "電動B チャイルドシート"],
  },
  {
    id: "electricC",
    types: ["電動C S", "電動C M"],
  },
  {
    id: "kids",
    types: ["キッズ20インチ", "キッズ24インチ", "キッズ26インチ"],
  },
] as const;

/** 車種グループごとの写真一覧（public/bikepic 内・すべて表示） */
const BIKE_GROUP_IMAGES: Record<string, string[]> = {
  kids: [
    "/bikepic/Kids/S__30064663.jpg",
    "/bikepic/Kids/S__30064664.jpg",
    "/bikepic/Kids/S__30064665.jpg",
  ],
  cross: [
    "/bikepic/クロス/S__30064647.jpg",
    "/bikepic/クロス/S__30064648.jpg",
    "/bikepic/クロス/S__30064649.jpg",
    "/bikepic/クロス/S__30064650.jpg",
    "/bikepic/クロス/S__30064651.jpg",
    "/bikepic/クロス/S__30064652.jpg",
    "/bikepic/クロス/S__30064653.jpg",
    "/bikepic/クロス/S__30064667.jpg",
    "/bikepic/クロス/S__30064669.jpg",
    "/bikepic/クロス/S__30064670.jpg",
    "/bikepic/クロス/S__30064673.jpg",
  ],
  road: [
    "/bikepic/Road bike/S__30064660.jpg",
    "/bikepic/Road bike/S__30064661.jpg",
    "/bikepic/Road bike/S__30064674.jpg",
  ],
  electricA: [
    "/bikepic/電動A/S__30064654.jpg",
    "/bikepic/電動A/S__30064655.jpg",
    "/bikepic/電動A/S__30064656.jpg",
    "/bikepic/電動A/S__30064658.jpg",
    "/bikepic/電動A/S__30064659.jpg",
  ],
  electricB: [
    "/bikepic/電動B/S__30064662.jpg",
    "/bikepic/電動B/S__30064666.jpg",
    "/bikepic/電動B/S__30064671.jpg",
  ],
  electricC: ["/bikepic/電動C/S__30064672.jpg"],
};

const PRICE = {
  クロス: { "6h": 2500, "1d": 3500, "2d_plus": 6500, addDay: 2700 },
  ロード: { "6h": 3500, "1d": 4500, "2d_plus": 8500, addDay: 3600 },
  電動A: { "6h": 3500, "1d": 4500, "2d_plus": 8500, addDay: 3600 },
  電動B: { "6h": 4500, "1d": 5500, "2d_plus": 11000, addDay: 4500 },
  電動C: { "6h": 7500, "1d": 8500, "2d_plus": 17000, addDay: 7500 },
  キッズ: { "6h": 500, "1d": 500, "2d_plus": 1000, addDay: 500 },
};

const ADDONS = [
  { id: "A-HOLDER", price: 500 },
  { id: "A-BATTERY", price: 2000 },
  { id: "A-PANNIER-SET", price: 3000 },
  { id: "A-PANNIER-SINGLE", price: 2000 },
];

/** パニアバッグ（左右セット・片側の合計）の予約上限 */
const MAX_PANNIER = 10;

/** 車種ごとに選択可能なオプション（予備バッテリーは電動Aのみ、パニアはクロスXS除く・電動ABCのみ） */
function getAddonsForBikeType(bikeTypeId: string) {
  const isPannierAvailable =
    (bikeTypeId.startsWith("クロスバイク") && bikeTypeId !== "クロスバイク XS") ||
    bikeTypeId.startsWith("電動A") ||
    bikeTypeId.startsWith("電動B") ||
    bikeTypeId.startsWith("電動C");

  return ADDONS.filter((addon) => {
    if (addon.id === "A-BATTERY") {
      return bikeTypeId === "電動A S" || bikeTypeId === "電動A M";
    }
    if (addon.id === "A-PANNIER-SET" || addon.id === "A-PANNIER-SINGLE") {
      return isPannierAvailable;
    }
    return true;
  });
}

/** 現在のパニアバッグ予約数（片側=1、左右セット=2としてカウント、最大10） */
function countPannier(addonsByBike: Record<string, Array<Partial<Record<string, number>>> | undefined>): number {
  let n = 0;
  for (const addonSets of Object.values(addonsByBike || {})) {
    if (!Array.isArray(addonSets)) continue;
    for (const set of addonSets) {
      if (!set) continue;
      n += ((set["A-PANNIER-SET"] ?? 0) * 2) + (set["A-PANNIER-SINGLE"] ?? 0);
    }
  }
  return n;
}

const DROPOFF_PRICE = 3850;

const INSURANCE_PLANS_BASE = [
  { id: "none", price: 0 },
  { id: "A", price: 500 },
  { id: "B", price: 1000 },
  { id: "C", price: 2000 },
] as const;
type InsurancePlanId = (typeof INSURANCE_PLANS_BASE)[number]["id"];

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
  // キッズ
  "キッズ20インチ": {
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
  "キッズ24インチ": {
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
  "キッズ26インチ": {
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
  // クロスバイク
  "クロスバイク XS": {
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
  "クロスバイク S": {
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
  "クロスバイク M": {
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
  "クロスバイク XL": {
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
  // ロードバイク
  "ロードバイク S": {
    headerBg: "bg-red-50",
    headerLabel: "text-red-600",
    headerText: "text-red-900",
    border: "border-red-100",
    ring: "ring-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    inputBorder: "border-red-200",
    accentText: "text-red-600",
  },
  "ロードバイク M": {
    headerBg: "bg-red-50",
    headerLabel: "text-red-600",
    headerText: "text-red-900",
    border: "border-red-100",
    ring: "ring-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    inputBorder: "border-red-200",
    accentText: "text-red-600",
  },
  "ロードバイク L": {
    headerBg: "bg-red-50",
    headerLabel: "text-red-600",
    headerText: "text-red-900",
    border: "border-red-100",
    ring: "ring-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    inputBorder: "border-red-200",
    accentText: "text-red-600",
  },
  // 電動A（青系でB/Cとトーンを揃える）
  "電動A S": {
    headerBg: "bg-blue-50",
    headerLabel: "text-blue-600",
    headerText: "text-blue-900",
    border: "border-blue-100",
    ring: "ring-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    inputBorder: "border-blue-200",
    accentText: "text-blue-600",
  },
  "電動A M": {
    headerBg: "bg-blue-50",
    headerLabel: "text-blue-600",
    headerText: "text-blue-900",
    border: "border-blue-100",
    ring: "ring-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    inputBorder: "border-blue-200",
    accentText: "text-blue-600",
  },
  // 電動B
  "電動B M": {
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
  "電動B チャイルドシート": {
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
  // 電動C
  "電動C S": {
    headerBg: "bg-indigo-50",
    headerLabel: "text-indigo-600",
    headerText: "text-indigo-900",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    inputBorder: "border-indigo-200",
    accentText: "text-indigo-600",
  },
  "電動C M": {
    headerBg: "bg-indigo-50",
    headerLabel: "text-indigo-600",
    headerText: "text-indigo-900",
    border: "border-indigo-100",
    ring: "ring-indigo-100",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    inputBorder: "border-indigo-200",
    accentText: "text-indigo-600",
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
  if (type.startsWith("ロードバイク")) return "ロード";
  if (type.startsWith("電動A")) return "電動A";
  if (type.startsWith("電動B")) return "電動B";
  if (type.startsWith("電動C")) return "電動C";
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

export default function RentacyclePageV5({ locale: localeProp = "ja" }: { locale?: ReservationLocale }) {
  const locale = localeProp;
  const t = getReservationTranslations(locale);
  const planDetails = getPlanDetails(locale);
  const planLabels = getPlanLabels(locale);
  const bikeGroups = getBikeGroups(locale);
  const bikeLabels = getBikeTypeLabels(locale);
  const addonNames = getAddonNames(locale);
  const insurancePlansWithLabels = getInsurancePlans(locale);

  // ネイティブ日付ピッカー（カレンダー）の表示言語を locale に合わせる
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("lang");
    html.setAttribute("lang", locale === "en" ? "en" : "ja");
    return () => {
      if (prev) html.setAttribute("lang", prev);
      else html.removeAttribute("lang");
    };
  }, [locale]);
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

  const [qtyDraft, setQtyDraft] = useState<Record<BikeType, string>>(
    Object.fromEntries(BIKE_TYPES.map((t) => [t.id, "0"])) as Record<BikeType, string>
  );
  const [editingQtyBikeId, setEditingQtyBikeId] = useState<BikeType | null>(null);

  type AddonsByBike = Partial<Record<BikeType, Array<Partial<Record<string, number>>>>>;
  const [addonsByBike, setAddonsByBike] = useState<AddonsByBike>({});
  const [maxPannierAvailable, setMaxPannierAvailable] = useState(MAX_PANNIER);

  const setQtySafe = (bikeId: string, value: number, max?: number) => {
    const numeric = Number.isFinite(value) ? value : 0;
    let safeValue = Math.max(0, Math.floor(numeric));
    if (max != null && Number.isFinite(max)) {
      safeValue = Math.min(safeValue, max);
    }
    setQty((prev) => ({ ...prev, [bikeId]: safeValue }));
  };

  useEffect(() => {
    if (editingQtyBikeId) return;
    setQtyDraft((prev) => {
      const next = { ...prev };
      for (const { id } of BIKE_TYPES) {
        next[id] = String(qty[id] ?? 0);
      }
      return next;
    });
  }, [qty, editingQtyBikeId]);

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

  useEffect(() => {
    if (!plan || !date) {
      setMaxPannierAvailable(MAX_PANNIER);
      return;
    }
    const returnDate = calcReturnDate(date, plan, days);
    const end_date = returnDate ? formatDateKey(returnDate) : date;
    let cancelled = false;
    fetch(`/api/pannier-availability?start_date=${encodeURIComponent(date)}&end_date=${encodeURIComponent(end_date)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.status === "ok" && typeof data.maxPannierCanAdd === "number") {
          setMaxPannierAvailable(data.maxPannierCanAdd);
        } else if (!cancelled) {
          setMaxPannierAvailable(MAX_PANNIER);
        }
      })
      .catch(() => {
        if (!cancelled) setMaxPannierAvailable(MAX_PANNIER);
      });
    return () => {
      cancelled = true;
    };
  }, [plan, date, days]);

  const weekday = getWeekday(date);
  const returnDate = calcReturnDate(date, plan, days);
  const returnWeekday = returnDate ? returnDate.getDay() : -1;
  const isClosed = weekday === CLOSED_DAY;

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

    const selectedInsurance = insurancePlansWithLabels.find((p) => p.id === insurancePlan);
    const insurancePrice =
      selectedInsurance && insurancePlan !== "none" && totalBikes > 0
        ? selectedInsurance.price * rentalDays * totalBikes
        : 0;

    const eligible = adultCount >= 3 && (plan === "1d" || plan === "2d_plus");
    const discount = eligible ? Math.floor(subtotal * 0.1) : 0;
    const totalPriceAfterDiscount = (subtotal - discount) + addonsTotal + dropoffPrice + insurancePrice;

    return {
      subtotal,
      addons: addonsTotal,
      dropoffPrice,
      insurancePrice,
      totalPrice: totalPriceAfterDiscount,
      discount,
      discountLabel: eligible ? t.groupDiscountLabel : "",
    };
  }, [plan, qty, addonsByBike, dropoff, insurancePlan, totalBikes, rentalDays, adultCount, t]);

  const pannierCount = countPannier(addonsByBike);
  const isBookingDisabled =
    isClosed ||
    !plan ||
    totalBikes === 0 ||
    (plan === "6h" && isThreeDayWeekendBlocked) ||
    !customerName.trim() ||
    !isEmailValid ||
    pannierCount > maxPannierAvailable;

  const closureMessage = useMemo(() => {
    if (!plan || !date) return "";
    if (isClosed) {
      return t.closedMessageStart;
    }
    return "";
  }, [plan, date, isClosed, t]);

  const handleDateChange = useCallback(
    (value: string) => {
      if (!value) {
        setDate("");
        return;
      }
      const minBookingDate = getMinBookingDateStr();
      if (value < minBookingDate) {
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="h-px w-8 bg-slate-300" /> {t.shopName}
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-[2.5rem]">{t.title}</h1>
              <p className="text-sm text-slate-500 sm:text-base">
                {t.subtitle}
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              {locale === "ja" ? (
                <Link href="/en" className="text-sm font-medium text-slate-600 hover:text-slate-900 underline">
                  English
                </Link>
              ) : (
                <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 underline">
                  日本語
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                <Clock className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.hoursLabel}</p>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.closedLabel}</p>
                <p className="text-sm font-semibold text-slate-900">{t.closedWeekday}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.dropoffLabel}</p>
                <p className="text-sm font-semibold text-slate-900">{t.dropoffNote}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">STEP 01</span>
            <h2 className="text-xl font-semibold text-slate-900">{t.step1Title}</h2>
            <p className="text-sm text-slate-500">{t.step1Desc}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {planDetails.map((planOption) => {
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
                    {t.selectPlan} <ChevronRight className="h-3.5 w-3.5" />
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
              <h2 className="text-xl font-semibold text-slate-900">{t.step2Title}</h2>
              <p className="text-sm text-slate-500">
                {t.step2Desc}
              </p>
              <p className="text-sm text-slate-500">
                {t.minBookingDateNotice}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" /> {t.pickupDate}
                </span>
                <LocaleDatePicker
                  value={date}
                  onChange={(value) => handleDateChange(value)}
                  locale={locale}
                  min={getMinBookingDateStr()}
                  className="w-full"
                />
                {plan === "2d_plus" && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="text-slate-500">{t.rentalDays}</span>
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
                  <p className="text-xs text-red-500">{t.busyThreeDayNote}</p>
                )}
                {returnDate && plan !== "6h" && (
                  <p className="text-xs text-slate-500">{t.returnDate}：{returnDate.toLocaleDateString()}（{getWeekdayShort(locale, returnWeekday)}）</p>
                )}
                {plan === "6h" && (
                  <p className="text-xs text-slate-500">{t.returnTime}：{addHours(startTime, 6)}（{t.returnBy} {CLOSE_TIME}）</p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Clock className="h-3.5 w-3.5" /> {t.pickupTime}
                </span>
                {plan === "6h" ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    {generateSixHourStartTimes().map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    {generateBusinessSlots().map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-slate-500">
                  {plan === "6h" ? t.pickupTimeNote6h : t.pickupTimeNoteOther}
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
              <h2 className="text-xl font-semibold text-slate-900">{t.step3Title}</h2>
              <p className="text-sm text-slate-500">{t.step3Desc}</p>
            </div>
            <div className="space-y-6">
              {bikeGroups.map((group) => {
                const groupTypes = group.types
                  .map((typeId) => ({ id: typeId, label: bikeLabels[typeId] ?? typeId }))
                  .filter((b) => b.id);

                if (groupTypes.length === 0) {
                  return null;
                }

                const primaryType = groupTypes[0].id as BikeType;
                const priceKey = priceKeyOf(primaryType) as keyof typeof PRICE;
                const priceTable = PRICE[priceKey];

                const groupImages = BIKE_GROUP_IMAGES[group.id] ?? [];
                return (
                  <div key={group.id} className="space-y-5 rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                        <p className="text-xs text-slate-500">{group.description}</p>
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">{t.priceGuide}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        {t.price6h}：<span className="font-semibold text-slate-800">¥{priceTable["6h"].toLocaleString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        {t.price1d}：<span className="font-semibold text-slate-800">¥{priceTable["1d"].toLocaleString()}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        {t.price2d}：<span className="font-semibold text-slate-800">¥{priceTable["2d_plus"].toLocaleString()}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">{t.priceAddDay} +¥{priceTable.addDay.toLocaleString()}</span>
                        </div>
                      </div>
                      {groupImages.length > 0 && (
                        <div className="w-full overflow-x-auto overflow-y-hidden scroll-smooth">
                          {groupImages.length > 3 && (
                            <p className="mb-1 text-[11px] text-slate-400">{t.scrollPhotos}</p>
                          )}
                          <div className="flex gap-3 pb-2" style={{ width: "max-content", minWidth: "100%" }}>
                            {groupImages.map((src, i) => (
                              <div
                                key={src}
                                className="relative h-36 w-48 shrink-0 overflow-hidden rounded-2xl bg-slate-200"
                              >
                                <Image
                                  src={src}
                                  alt={`${group.title}（${i + 1}）`}
                                  fill
                                  className="object-cover"
                                  sizes="192px"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {groupTypes.map((bike) => {
                        const available = remaining?.[bike.id] ?? inventory[bike.id] ?? 0;
                        const planned = qty[bike.id as BikeType] || 0;
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
                                <p className={`text-[11px] font-semibold uppercase tracking-wide ${style.headerLabel}`}>{t.bikeType}</p>
                                <h4 className={`text-lg font-semibold ${style.headerText}`}>{bike.label}</h4>
                              </div>
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style.iconBg}`}>
                                <BikeIcon className={`h-5 w-5 ${style.iconColor}`} />
                              </div>
                              <AvailabilityChecker
                                bikeType={bike.id}
                                startDate={date}
                                endDate={returnDate ? formatDateKey(returnDate) : null}
                                requestQty={qty[bike.id as BikeType] || 0}
                                onStatusChange={(status) => handleStatusChange(bike.id, status)}
                                fallbackRemaining={remaining?.[bike.id as BikeType] ?? inventory[bike.id] ?? null}
                                className="sr-only"
                              />
                            </div>
                            <div className="space-y-5 p-5">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.availableCount}</span>
                                  <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-semibold ${shortage ? "text-red-500" : style.accentText}`}>{projectedDisplay}</span>
                                    <span className="text-sm text-slate-400">{t.unitBikes}</span>
                                  </div>
                                </div>
                                <div className={`flex flex-col gap-3 rounded-2xl border ${style.inputBorder} bg-white p-5`}>
                                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{t.reserveCount}</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    data-availability-pause
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-right text-2xl font-semibold text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    value={
                                      editingQtyBikeId === (bike.id as BikeType)
                                        ? (qtyDraft[bike.id as BikeType] ?? "")
                                        : String(qty[bike.id as BikeType] ?? 0)
                                    }
                                    onFocus={() => {
                                      setEditingQtyBikeId(bike.id as BikeType);
                                      if ((qty[bike.id as BikeType] ?? 0) === 0) {
                                        setQtyDraft((prev) => ({ ...prev, [bike.id as BikeType]: "" }));
                                      }
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === "") {
                                        setQtyDraft((prev) => ({ ...prev, [bike.id as BikeType]: "" }));
                                        return;
                                      }
                                      const half = raw.replace(/[０-９]/g, (c) =>
                                        String.fromCharCode(c.charCodeAt(0) - 0xfee0)
                                      );
                                      const digitsOnly = half.replace(/[^\d]/g, "");
                                      const normalized = digitsOnly.replace(/^0+(?=\d)/, "");
                                      setQtyDraft((prev) => ({ ...prev, [bike.id as BikeType]: normalized }));
                                    }}
                                    onBlur={() => {
                                      let raw = qtyDraft[bike.id as BikeType] ?? "";
                                      raw = raw.replace(/[０-９]/g, (c) =>
                                        String.fromCharCode(c.charCodeAt(0) - 0xfee0)
                                      );
                                      const parsed = raw === "" ? 0 : Number(raw);
                                      const safe = Math.min(
                                        Math.max(0, Number.isFinite(parsed) ? Math.floor(parsed) : 0),
                                        Math.max(0, Math.floor(available))
                                      );
                                      setQtySafe(bike.id, safe, available);
                                      setQtyDraft((prev) => ({ ...prev, [bike.id as BikeType]: String(safe) }));
                                      setEditingQtyBikeId(null);
                                    }}
                                    disabled={available <= 0}
                                  />
                                </div>
                              </div>
                              {shortage && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                                  {t.shortageMessage}
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
              <h2 className="text-xl font-semibold text-slate-900">{t.step4Title}</h2>
              <p className="text-sm text-slate-500">{t.step4Desc}</p>
            </div>

            <div className="space-y-4">
              {(() => {
                const currentPannier = countPannier(addonsByBike);
                const pannierAtLimit = currentPannier >= maxPannierAvailable;
                return (
                  <>
                    {maxPannierAvailable - currentPannier <= 0 ? (
                      <p className="text-xs text-slate-500">{t.pannierLimitNone}</p>
                    ) : (
                      <p className="text-xs text-slate-500">{interpolate(t.pannierLimit, { remaining: String(maxPannierAvailable - currentPannier), current: String(currentPannier) })}</p>
                    )}
                    {BIKE_TYPES.map(({ id }) => {
                      const count = qty[id] || 0;
                      if (!count) return null;
                      const label = bikeLabels[id] ?? id;
                      const perType = addonsByBike[id] || [];
                      return (
                        <div key={id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <BikeIcon className="h-4 w-4 text-blue-500" />
                            {label}（{count}{locale === "en" ? " " : ""}{t.unitBikes}）
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} className="space-y-3 rounded-2xl border border-white bg-white p-3 shadow-sm">
                                <p className="text-xs font-semibold text-slate-500">{label} #{i + 1}</p>
                                <div className="space-y-2">
                                  {getAddonsForBikeType(id).map((addon) => {
                                    const isPannier = addon.id === "A-PANNIER-SET" || addon.id === "A-PANNIER-SINGLE";
                                    const cannotAddMore = isPannier && pannierAtLimit && !perType[i]?.[addon.id];
                                    return (
                                      <label
                                        key={addon.id}
                                        className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 ${cannotAddMore ? "opacity-60" : ""}`}
                                      >
                                        <span>{addonNames[addon.id] ?? addon.id}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-slate-400">+¥{addon.price}</span>
                                          <input
                                            type="checkbox"
                                            checked={Boolean(perType[i]?.[addon.id])}
                                            disabled={cannotAddMore}
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
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <MapPin className="h-3.5 w-3.5" /> {t.dropoffService}
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
                    <p className="font-medium text-slate-900">{interpolate(t.dropoffOption, { price: DROPOFF_PRICE.toLocaleString() })}</p>
                    {dropoff && totalBikes > 0 && (
                      <p className="text-xs text-slate-500">
                        {interpolate(t.dropoffFeeNote, { total: dropoffPrice.toLocaleString(), count: String(totalBikes), per: DROPOFF_PRICE.toLocaleString() })}
                      </p>
                    )}
                    {isBusySeason(date) ? (
                      <p className="text-xs text-amber-700">{t.dropoffBusyNote}</p>
                    ) : (
                      <p className="text-xs text-slate-500">{t.dropoffNormalNote}</p>
                    )}
                  </div>
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Shield className="h-3.5 w-3.5" /> {t.insuranceSection}
                </span>
                <div className="space-y-2">
                  {insurancePlansWithLabels.map((planOption) => (
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
                            <span className="ml-2 text-xs text-slate-500">¥{planOption.price.toLocaleString()} / {locale === "en" ? "day" : "日"}</span>
                          )}
                        </p>
                        {planOption.description && (
                          <p className="text-xs text-slate-500">{planOption.description}</p>
                        )}
                        {insurancePlan === planOption.id && planOption.id !== "none" && totalBikes > 0 && rentalDays > 0 && (
                          <p className="text-xs text-blue-600">
                            {locale === "en" ? "Insurance: " : "補償料金："}¥{(planOption.price * rentalDays * totalBikes).toLocaleString()}（{totalBikes}{locale === "en" ? " bikes" : "台"} × {rentalDays}{locale === "en" ? " days" : "日"}）
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.insuranceNote}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t.insuranceLiability}
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
              <h2 className="text-xl font-semibold text-slate-900">{t.step5Title}</h2>
              <p className="text-sm text-slate-500">{t.step5Desc}</p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.repName}</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.repNamePlaceholder}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.repEmail}</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={t.repEmailPlaceholder}
                    className={`rounded-xl border px-3 py-2 text-sm focus:outline-none ${
                      customerEmail
                        ? isEmailValid
                          ? "border-emerald-300 focus:border-emerald-400"
                          : "border-red-300 focus:border-red-400"
                        : "border-slate-200 focus:border-blue-400"
                    }`}
                  />
                  {customerEmail && !isEmailValid && (
                    <p className="text-xs text-red-500">{t.emailInvalid}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500">{t.emailNote}</p>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t.subtotal}</span>
                  <span className="font-semibold text-slate-900">¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t.options}</span>
                  <span className="font-semibold text-slate-900">¥{addons.toLocaleString()}</span>
                </div>
                {dropoffPrice > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t.dropoff}</span>
                    <span className="font-semibold text-slate-900">¥{dropoffPrice.toLocaleString()}</span>
                  </div>
                )}
                {insurancePrice > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t.insurance}</span>
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

            {pannierCount > maxPannierAvailable && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {interpolate(t.pannierOverflow, { max: String(maxPannierAvailable), current: String(pannierCount) })}
              </p>
            )}
            <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-slate-700 sm:flex-row sm:items-center">
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{t.totalLabel}</p>
                <p className="mt-2 text-3xl font-semibold text-blue-900">¥{totalPrice.toLocaleString()}</p>
                <p className="mt-1 text-xs text-blue-600">{t.totalNote}</p>
              </div>
              <button
                disabled={isBookingDisabled}
                onClick={() => setShowConfirmModal(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                  isBookingDisabled ? "cursor-not-allowed bg-slate-300" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {t.confirmButton}
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
                <h2 className="text-2xl font-semibold text-slate-900">{t.modalTitle}</h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                {t.closeButton}
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.planLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {plan === "6h" && t.plan6hTitle}
                    {plan === "1d" && t.plan1dTitle}
                    {plan === "2d_plus" && `${days}${locale === "en" ? " days" : "日プラン"}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.pickupDateTime}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {date}
                    {plan === "6h" && startTime && `（${locale === "en" ? "Start" : "開始"} ${startTime}）`}
                    {plan !== "6h" && pickupTime && `（${locale === "en" ? "Pick-up" : "来店"} ${pickupTime}）`}
                  </p>
                  {returnDate && <p className="text-xs text-slate-500">{t.returnDateLabel}：{formatDateKey(returnDate)}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.contactLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{customerName || (locale === "en" ? "—" : "未入力")}</p>
                <p className="text-xs text-slate-500">{customerEmail || (locale === "en" ? "Email not entered" : "メール未入力")}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.bikesLabel}</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  {Object.entries(qty).map(([bikeType, count]) => {
                    if (!count || count === 0) return null;
                    const bikeLabel = bikeLabels[bikeType] || bikeType;
                    return (
                      <div key={bikeType} className="flex items-center justify-between">
                        <span>{bikeLabel}</span>
                        <span className="font-semibold">× {count} {t.unitBikes}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {addons > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.options}</p>
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
                          <span>{addonNames[addon.id]}</span>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.dropoffLabelResult}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {locale === "en" ? "Imabari return" : "今治返却"}（¥{DROPOFF_PRICE.toLocaleString()} × {totalBikes}{locale === "en" ? " bikes" : "台"}） = ¥{dropoffPrice.toLocaleString()}
                  </p>
                </div>
              )}

              {insurancePlan !== "none" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.insuranceLabel}</p>
                  {(() => {
                    const planInfo = insurancePlansWithLabels.find((p) => p.id === insurancePlan);
                    if (!planInfo) return null;
                    return (
                      <p className="mt-1 text-sm text-slate-700">
                        {planInfo.name}（¥{planInfo.price.toLocaleString()} × {rentalDays}{locale === "en" ? " days" : "日"} × {totalBikes}{locale === "en" ? " bikes" : "台"}） = ¥
                        {insurancePrice.toLocaleString()}
                      </p>
                    );
                  })()}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.paymentBreakdown}</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-semibold">¥{subtotal.toLocaleString()}</span>
                  </p>
                  {addons > 0 && (
                    <p className="flex items-center justify-between">
                      <span>{t.options}</span>
                      <span className="font-semibold">¥{addons.toLocaleString()}</span>
                    </p>
                  )}
                  {dropoffPrice > 0 && (
                    <p className="flex items-center justify-between">
                      <span>{t.dropoff}</span>
                      <span className="font-semibold">¥{dropoffPrice.toLocaleString()}</span>
                    </p>
                  )}
                  {insurancePrice > 0 && (
                    <p className="flex items-center justify-between">
                      <span>{t.insurance}</span>
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
                    <span>{t.totalLabel}</span>
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
                {t.editButton}
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
                          alert(`${bikeType} ${t.noStockAlert}`);
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
                      locale,
                    };

                    const res = await fetch("/api/reserve", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });

                    const json = await res.json();
                    if (json.status !== "ok") {
                      throw new Error(json.message || t.bookFailed);
                    }

                    if (!plan) {
                      throw new Error(t.planNotSet);
                    }

                    const planId = plan as "6h" | "1d" | "2d_plus";
                    const reservationEndDate = end_date;

                    const reservationIdFull = json.data?.[0]?.id || json.data?.id || json.reservation_id || "";
                    const reservationIdShort = reservationIdFull ? String(reservationIdFull).slice(0, 8) : "";

                    const selectedBikes = Object.entries(qty)
                      .filter(([_, count]) => (count || 0) > 0)
                      .map(([bikeType, count]) => ({
                        label: bikeLabels[bikeType] || bikeType,
                        count: count || 0,
                      }));

                    const selectedAddons = ADDONS.map((addon) => {
                      const quantity = BIKE_TYPES.reduce((sum, { id }) => {
                        const perType = addonsByBike[id] || [];
                      return sum + perType.reduce((inner, set) => inner + (set?.[addon.id] ?? 0), 0);
                    }, 0);
                    return { name: addonNames[addon.id], quantity, price: addon.price };
                    }).filter((item) => item.quantity > 0);

                    setReservationResult({
                      reservationId: reservationIdFull,
                      reservationIdShort,
                      planId,
                      planLabel: planLabels[planId],
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
                    alert(error?.message || t.bookFailed);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? t.submittingButton : t.submitButton}
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
          <CheckCircle2 className="h-4 w-4" /> {t.successBadge}
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{t.successTitle}</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            {t.successMessage}
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.reservationNumber}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.reservationIdShort}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.planLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.planLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.repLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.customerName}</p>
              <p className="text-xs text-slate-500">{result.customerEmail}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.pickupDateLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{result.startDate}</p>
              {result.startTime && <p className="text-xs text-slate-500">{locale === "en" ? "Start" : "開始時間"}：{result.startTime}</p>}
              {result.pickupTime && <p className="text-xs text-slate-500">{locale === "en" ? "Pick-up" : "来店予定"}：{result.pickupTime}</p>}
            </div>
            {result.endDate && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.returnDateLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{result.endDate}</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <BikeIcon className="h-4 w-4" /> {t.bookedBikes}
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                {result.bikes.map(({ label, count }) => (
                  <li key={label} className="flex items-center justify-between">
                    <span>{label}</span>
                    <span className="font-semibold">× {count} {t.unitBikes}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Shield className="h-4 w-4" /> {t.optionsAndInsurance}
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
                  <p className="text-xs text-slate-500">{t.noOptions}</p>
                )}
                {result.insurancePlan !== "none" ? (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                    {t.insuranceLabel}：{insurancePlansWithLabels.find((p) => p.id === result.insurancePlan)?.name}（¥
                    {result.insurancePrice.toLocaleString()}）
                  </p>
                ) : (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">{t.insuranceLabel}：{t.insuranceNone}</p>
                )}
                {result.dropoff ? (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                    {t.dropoffLabelResult}：{locale === "en" ? "Imabari return" : "今治返却"}（¥{result.dropoffPrice.toLocaleString()}）
                  </p>
                ) : (
                  <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-500">{t.dropoffLabelResult}：{t.dropoffNo}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-5 text-left text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">{t.paymentLabel}</p>
            <p className="mt-2 text-3xl font-semibold">¥{result.totalPrice.toLocaleString()}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-200/80">
              <p>{t.subtotal}：¥{result.subtotal.toLocaleString()}</p>
              {result.addonsPrice > 0 && <p>{t.options}：¥{result.addonsPrice.toLocaleString()}</p>}
              {result.dropoffPrice > 0 && <p>{t.dropoff}：¥{result.dropoffPrice.toLocaleString()}</p>}
              {result.insurancePrice > 0 && <p>{t.insurance}：¥{result.insurancePrice.toLocaleString()}</p>}
              {result.discountLabel && (
                <p className="text-emerald-200">{result.discountLabel}（-¥{result.discount.toLocaleString()}）</p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-3 text-sm text-slate-500">
          <p>{t.emailSentNote}</p>
          <p>{t.cancelNote}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setReservationResult(null)}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            {t.anotherBooking}
          </button>
        </div>
      </div>
    </div>
  );
}