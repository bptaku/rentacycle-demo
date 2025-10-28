"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

type AddonRow = { bike_type: string; addons: Record<string, number> };
type Reservation = {
  id: string;
  name: string;
  email: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  pickup_time: string | null;
  plan: string;
  bikes: Record<string, number> | string;
  addons: AddonRow[] | string;
  total_price: number;
  status: string;
  created_at: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function AdminReservationsPage() {
  const [date, setDate] = useState<string>(todayStr());
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("date", date);
    if (status) p.set("status", status);
    if (search.trim()) p.set("search", search.trim());
    return `/api/admin/reservations?${p.toString()}`;
  }, [date, status, search]);

  const { data, isLoading, mutate } = useSWR<{status:string;date:string;reservations:Reservation[]}>(query, fetcher);

  const reservations = useMemo(() => {
    const list = data?.reservations || [];
    const key = (r: Reservation) => (r.pickup_time || r.start_time || "99:99");
    return [...list].sort((a, b) => key(a).localeCompare(key(b)));
  }, [data]);

  const resetToday = () => {
    setDate(todayStr());
    setStatus("");
    setSearch("");
    mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">予約一覧（/admin/reservations）</h1>

      {/* フィルタ */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">状態</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">(canceled除外)</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="canceled">canceled</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600">検索（名前/メール）</label>
          <input
            placeholder="山田 / yamada@example.com"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded border px-3 py-2 min-w-[240px]"
          />
        </div>

        <button
          onClick={resetToday}
          className="ml-auto rounded bg-gray-100 px-3 py-2 hover:bg-gray-200"
        >
          今日に戻る
        </button>
      </div>

      {/* リスト */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center px-4 py-2 text-sm text-gray-500 border-b bg-gray-50">
          <div className="w-24">来店</div>
          <div className="flex-1">顧客</div>
          <div className="w-40">プラン</div>
          <div className="w-[320px]">車種</div>
          <div className="flex-1">オプション</div>
          <div className="w-28 text-right">合計</div>
          <div className="w-40 text-center">状態/操作</div>
        </div>

        {isLoading && (
          <div className="px-4 py-6 text-gray-500">読み込み中…</div>
        )}

        {!isLoading && reservations.length === 0 && (
          <div className="px-4 py-6 text-gray-500">該当する予約はありません。</div>
        )}

        {reservations.map((r) => {
          const visit = r.pickup_time || r.start_time || "--:--";

          /* --- bikes（0除外・縦並び） --- */
          const bikesRaw = r.bikes;
          let bikesObj: Record<string, number> = {};
          try {
            if (typeof bikesRaw === "object" && bikesRaw !== null) {
              bikesObj = bikesRaw;
            } else if (typeof bikesRaw === "string" && bikesRaw.trim().startsWith("{")) {
              bikesObj = JSON.parse(bikesRaw);
            }
          } catch (e) {
            bikesObj = {};
          }
          const bikesList = Object.entries(bikesObj || {})
            .filter(([_, v]) => Number(v) > 0)
            .map(([k, v]) => `🚲 ${k} ×${v}`)
            .join("\n");

          /* --- addons（車種ごとに縦並び） --- */
          const addonsRaw = r.addons;
          let addonsArray: any[] = [];
          try {
            if (Array.isArray(addonsRaw)) {
              addonsArray = addonsRaw;
            } else if (typeof addonsRaw === "string" && addonsRaw.trim().startsWith("[")) {
              addonsArray = JSON.parse(addonsRaw);
            }
          } catch (e) {
            addonsArray = [];
          }
          const addonsList = addonsArray
            .map((row: any) => {
              const items = Object.entries(row.addons || {})
                .filter(([_, v]) => Number(v) > 0)
                .map(([k, v]) => `🧩 ${k} ×${v}`)
                .join("\n");
              return items ? `🚲 ${row.bike_type}\n${items}` : "";
            })
            .filter((s) => s !== "")
            .join("\n\n");

          const yen = new Intl.NumberFormat("ja-JP", {
            style: "currency",
            currency: "JPY",
            maximumFractionDigits: 0,
          }).format(Number(r.total_price || 0));

          return (
            <div key={r.id} className="flex items-start px-4 py-3 border-b last:border-b-0 whitespace-pre-wrap">
              <div className="w-24 font-medium">{visit}</div>
              <div className="flex-1">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.email}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {r.start_date} → {r.end_date}
                </div>
              </div>
              <div className="w-40">{labelPlan(r.plan)}</div>
              <div className="w-[320px]">{bikesList || "-"}</div>
              <div className="flex-1">{addonsList || "-"}</div>
              <div className="w-28 text-right">{yen}</div>

              <div className="w-40 flex items-center justify-end gap-2">
                <span className="text-xs rounded-full bg-gray-100 px-2 py-1">{r.status}</span>
                <button
                  disabled
                  className="rounded bg-gray-200 px-2 py-1 text-xs cursor-not-allowed"
                >
                  キャンセル
                </button>
                <button
                  disabled
                  className="rounded bg-gray-200 px-2 py-1 text-xs cursor-not-allowed"
                >
                  完了
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function labelPlan(p: string) {
  switch (p) {
    case "3h":
      return "3hプラン";
    case "6h":
      return "6hプラン";
    case "1d":
      return "1日プラン";
    case "2d_plus":
      return "2日＋プラン";
    default:
      return p;
  }
}
