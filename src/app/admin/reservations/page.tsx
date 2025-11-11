"use client";

import useSWR from "swr";
import { useMemo, useState, useCallback } from "react";
import {
  CalendarDays,
  RefreshCcw,
  LayoutGrid,
  Filter,
  Search,
  User,
  Mail,
  Bike,
  Shield,
  MapPin,
  Clock,
  JapaneseYen,
} from "lucide-react";
import BikeRevenueSection from "./BikeRevenueSection";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ADDONS = [
  { id: "A-HOLDER", name: "スマホホルダー" },
  { id: "A-BATTERY", name: "予備バッテリー" },
  { id: "A-CHILDSEAT", name: "チャイルドシート" },
  { id: "A-CARRIER", name: "リアキャリア" },
];

type Reservation = {
  id: string;
  name: string;
  email: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  pickup_time: string | null;
  plan: string;
  bikes: Record<string, number>;
  addons: Record<string, Array<Record<string, number>>>;
  bike_numbers: Record<string, string[]>;
  dropoff: boolean;
  dropoff_price: number;
  insurance_plan: string;
  insurance_price: number;
  total_price: number;
  status: string;
  created_at: string;
};

type BikeNumberInputs = Record<string, Record<string, string[]>>;

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const STATUS_LABELS: Record<string, string> = {
  reserved: "予約済み",
  in_use: "貸出中",
  dropoff_in_progress: "ドロップオフ中",
  completed: "返却済み",
  canceled: "キャンセル済み",
};

const STATUS_COLORS: Record<string, string> = {
  reserved: "bg-blue-100 text-blue-700 border-blue-300",
  in_use: "bg-orange-100 text-orange-700 border-orange-300",
  dropoff_in_progress: "bg-purple-100 text-purple-700 border-purple-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  canceled: "bg-gray-100 text-gray-600 border-gray-300",
};

function getStatusSequence(reservation: Reservation): string[] {
  const workflow = reservation.dropoff || reservation.status === "dropoff_in_progress"
    ? ["reserved", "in_use", "dropoff_in_progress", "completed"]
    : ["reserved", "in_use", "completed"];
  const sequence = ["canceled", ...workflow];
  if (!sequence.includes(reservation.status)) {
    sequence.push(reservation.status);
  }
  return Array.from(new Set(sequence));
}

function formatAddonList(addonSet: Record<string, number>) {
  const entries = ADDONS.filter((addon) => (addonSet[addon.id] || 0) > 0).map(
    (addon) => `${addon.name}×${addonSet[addon.id]}`
  );
  return entries.length > 0 ? entries.join("、") : "オプションなし";
}

export default function AdminReservationsPage() {
  const [date, setDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [bikeNumberInputs, setBikeNumberInputs] = useState<BikeNumberInputs>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingDropoff, setUpdatingDropoff] = useState<string | null>(null);
  const [showRevenue, setShowRevenue] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("date", date);
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    return `/api/admin/reservations?${params.toString()}`;
  }, [date, statusFilter, search]);

  const { data, isLoading, mutate } = useSWR<{ status: string; reservations: Reservation[] }>(
    query,
    fetcher
  );

  const reservations = useMemo(() => data?.reservations ?? [], [data]);

  const ensureInputs = useCallback(
    (reservation: Reservation) => {
      if (bikeNumberInputs[reservation.id]) return bikeNumberInputs[reservation.id];
      const initial: Record<string, string[]> = {};
      for (const [bikeType, count] of Object.entries(reservation.bikes)) {
        if (!count) continue;
        const existing = reservation.bike_numbers?.[bikeType] || [];
        initial[bikeType] = Array.from({ length: count }).map((_, idx) => existing[idx] || "");
      }
      setBikeNumberInputs((prev) => ({ ...prev, [reservation.id]: initial }));
      return initial;
    },
    [bikeNumberInputs]
  );

  const handleBikeNumberChange = useCallback(
    (reservationId: string, bikeType: string, index: number, value: string) => {
      setBikeNumberInputs((prev) => {
        const current = { ...(prev[reservationId] || {}) } as Record<string, string[]>;
        const numbers = [...(current[bikeType] || [])];
        numbers[index] = value;
        return {
          ...prev,
          [reservationId]: {
            ...current,
            [bikeType]: numbers,
          },
        };
      });
    },
    []
  );

  const handleSaveBikeNumbers = useCallback(
    async (reservation: Reservation) => {
      const inputs = ensureInputs(reservation);
      setSaving(reservation.id);
      try {
        const payload: Record<string, string[]> = {};

        for (const [bikeType, count] of Object.entries(reservation.bikes)) {
          if (!count) continue;
          const numbers = (inputs[bikeType] || []).slice(0, count).map((n) => n?.trim() || "");
          if (numbers.some((n) => !n)) {
            alert(`${bikeType} の番号をすべて入力してください`);
            setSaving(null);
            return;
          }
          payload[bikeType] = numbers;
        }

        const res = await fetch(`/api/admin/reservations/${reservation.id}/bike-numbers`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bike_numbers: payload }),
        });
        const json = await res.json();
        if (json.status !== "ok") {
          throw new Error(json.message || "保存に失敗しました");
        }
        alert("自転車番号を保存しました");
        mutate();
      } catch (error: any) {
        alert(error?.message || "保存に失敗しました");
      } finally {
        setSaving(null);
      }
    },
    [ensureInputs, mutate]
  );

  const handleDropoffToggle = useCallback(
    async (reservation: Reservation) => {
      setUpdatingDropoff(reservation.id);
      try {
        const res = await fetch(`/api/admin/reservations/${reservation.id}/dropoff`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dropoff: !reservation.dropoff }),
        });
        const json = await res.json();
        if (json.status !== "ok") {
          throw new Error(json.message || "更新に失敗しました");
        }
        mutate();
      } catch (error: any) {
        alert(error?.message || "更新に失敗しました");
      } finally {
        setUpdatingDropoff(null);
      }
    },
    [mutate]
  );

  const handleStatusChange = useCallback(
    async (reservation: Reservation, nextStatus: string) => {
      if (reservation.status === nextStatus) return;
      setUpdatingStatus(reservation.id);
      try {
        const res = await fetch(`/api/admin/reservations/${reservation.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const json = await res.json();
        if (json.status !== "ok") {
          throw new Error(json.message || "更新に失敗しました");
        }
        mutate();
      } catch (error: any) {
        alert(error?.message || "更新に失敗しました");
      } finally {
        setUpdatingStatus(null);
      }
    },
    [mutate]
  );

  const handleCancel = useCallback(
    async (reservation: Reservation) => {
      if (!confirm("この予約をキャンセルしますか？")) return;
      try {
        const res = await fetch("/api/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reservation.id }),
        });
        const json = await res.json();
        if (json.error) {
          throw new Error(json.error);
        }
        mutate();
      } catch (error: any) {
        alert(error?.message || "キャンセルに失敗しました");
      }
    },
    [mutate]
  );

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">予約管理</h1>
          <p className="text-sm text-slate-500">
            予約状況と自転車番号をひと目で把握し、貸出・返却のオペレーションを整えましょう。
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  日付
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full appearance-none border-none bg-transparent text-slate-700 focus:outline-none"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <Filter className="h-3.5 w-3.5" />
                  状態
                </span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 focus:outline-none"
                  >
                    <option value="">すべて（キャンセル除外）</option>
                    <option value="reserved">予約済み</option>
                    <option value="in_use">貸出中</option>
                    <option value="dropoff_in_progress">ドロップオフ中</option>
                    <option value="completed">返却済み</option>
                    <option value="canceled">キャンセル済み</option>
                  </select>
                  <LayoutGrid className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                  検索（名前 / メール）
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="キーワードで絞り込み"
                    className="w-full border-none bg-transparent text-slate-700 focus:outline-none"
                  />
                </div>
              </label>
            </div>

            <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={() => setDate(todayStr())}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <RefreshCcw className="h-4 w-4" />
                今日に戻る
              </button>
              <button
                onClick={() => setShowRevenue((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              >
                <JapaneseYen className="h-4 w-4" />
                {showRevenue ? "一覧へ戻る" : "自転車別売上集計"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {showRevenue ? (
            <BikeRevenueSection />
          ) : isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              読み込み中...
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              該当する予約がありません。
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const visitTime = reservation.pickup_time || reservation.start_time || "--:--";
                const inputs = ensureInputs(reservation);
                const statusOptions = getStatusSequence(reservation);

                return (
                  <article
                    key={reservation.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-5">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <Clock className="h-3.5 w-3.5" />
                            {visitTime}
                          </span>
                          <span className="inline-flex items-center gap-1 text-base font-semibold text-slate-900">
                            <User className="h-4 w-4 text-slate-400" />
                            {reservation.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                              STATUS_COLORS[reservation.status] || STATUS_COLORS.reserved
                            }`}
                          >
                            {STATUS_LABELS[reservation.status] || reservation.status}
                          </span>
                          {reservation.dropoff && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                              <MapPin className="h-3.5 w-3.5" />
                              ドロップオフ
                            </span>
                          )}
                          {reservation.insurance_plan && reservation.insurance_plan !== "none" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              <Shield className="h-3.5 w-3.5" />
                              {reservation.insurance_plan}プラン
                            </span>
                          )}
                        </div>

                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <CalendarDays className="h-3.5 w-3.5" />
                              期間
                            </div>
                            <p className="mt-1 font-medium text-slate-900">
                              {reservation.start_date} → {reservation.end_date}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Mail className="h-3.5 w-3.5" />
                              連絡先
                            </div>
                            <p className="mt-1 break-all font-medium text-slate-900">{reservation.email || "-"}</p>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                          <JapaneseYen className="h-4 w-4" />
                          合計 ¥{reservation.total_price.toLocaleString()}
                        </div>

                        <div className="space-y-3 text-sm">
                          {Object.entries(reservation.bikes)
                            .filter(([_, count]) => count > 0)
                            .map(([bikeType, count]) => {
                              const addonSets = reservation.addons?.[bikeType] || [];
                              return (
                                <div key={bikeType} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <Bike className="h-4 w-4 text-blue-500" />
                                    {bikeType}（{count}台）
                                  </p>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {Array.from({ length: count }).map((_, idx) => {
                                      const addonSet = addonSets[idx] || {};
                                      const numberValue = inputs?.[bikeType]?.[idx] ?? "";
                                      return (
                                        <div key={idx} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                              #{idx + 1}
                                            </span>
                                            <input
                                              type="text"
                                              value={numberValue}
                                              onChange={(e) =>
                                                handleBikeNumberChange(reservation.id, bikeType, idx, e.target.value)
                                              }
                                              placeholder="番号を入力"
                                              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                          </div>
                                          <div className="mt-2 text-xs text-slate-500">
                                            {formatAddonList(addonSet)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      <aside className="w-full max-w-xs space-y-3 text-sm text-slate-600">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">状況</p>
                          <select
                            value={reservation.status}
                            onChange={(e) => handleStatusChange(reservation, e.target.value)}
                            disabled={updatingStatus === reservation.id || statusOptions.length <= 1}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none disabled:bg-slate-100"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status] || status}
                              </option>
                            ))}
                          </select>
                          {updatingStatus === reservation.id && (
                            <p className="mt-2 text-xs text-slate-400">更新中...</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDropoffToggle(reservation)}
                          disabled={updatingDropoff === reservation.id}
                          className="w-full rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50 disabled:opacity-50"
                        >
                          {updatingDropoff === reservation.id
                            ? "更新中..."
                            : reservation.dropoff
                            ? "ドロップオフを解除"
                            : "ドロップオフを追加"}
                        </button>

                        <button
                          onClick={() => handleSaveBikeNumbers(reservation)}
                          disabled={saving === reservation.id}
                          className="w-full rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                        >
                          {saving === reservation.id ? "保存中..." : "自転車番号を保存"}
                        </button>

                        {reservation.status !== "canceled" && (
                          <button
                            onClick={() => handleCancel(reservation)}
                            className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          >
                            キャンセルにする
                          </button>
                        )}
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
