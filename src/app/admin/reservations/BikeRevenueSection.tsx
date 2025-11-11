"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type RevenueRecord = {
  bike_type: string;
  bike_number: string;
  reservation_count: number;
  total_revenue: number;
  reservations: { id: string; date: string; revenue: number }[];
};

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function startOfMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default function BikeRevenueSection() {
  const [startDate, setStartDate] = useState(startOfMonthStr());
  const [endDate, setEndDate] = useState(todayStr());

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return `/api/admin/bike-revenue?${params.toString()}`;
  }, [startDate, endDate]);

  const { data, isLoading } = useSWR<{ status: string; data: RevenueRecord[] }>(query, fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">自転車番号別 売上集計</h2>
        <p className="text-sm text-gray-600 mt-1">
          完了済みの予約を元に、車両番号ごとの売上金額を集計しています。
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">開始日</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">終了日</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">集計中...</p>
      ) : !data || data.status !== "ok" || !data.data?.length ? (
        <p className="text-sm text-gray-500">該当する期間の予約がありません。</p>
      ) : (
        <div className="border rounded divide-y">
          {data.data.map((record) => (
            <div key={`${record.bike_type}-${record.bike_number}`} className="p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {record.bike_type} / #{record.bike_number || "番号未登録"}
                  </p>
                  <p className="text-xs text-gray-500">
                    利用回数: {record.reservation_count}件
                  </p>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  ¥{Math.round(record.total_revenue).toLocaleString()}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">該当予約</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {record.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border rounded px-3 py-2 text-xs bg-gray-50"
                    >
                      <p>予約ID: {reservation.id}</p>
                      <p>日付: {reservation.date}</p>
                      <p>売上: ¥{Math.round(reservation.revenue).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
