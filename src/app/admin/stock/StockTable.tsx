"use client";

import { Minus, Plus, Clock, Bike, Phone, Globe } from "lucide-react";

interface StockRow {
  date: string;
  bike_type: string;
  base_quantity: number;
  manual_adjustment: number;
  reserved: number;
  available: number;
  updated_at?: string;
}

interface Props {
  data?: StockRow[];
  onAdjust: (bike_type: string, delta: number) => void;
}

function statusColor(available: number) {
  if (available <= 0) return "text-red-600 border-red-200 bg-red-50";
  if (available <= 2) return "text-amber-600 border-amber-200 bg-amber-50";
  return "text-emerald-600 border-emerald-200 bg-emerald-50";
}

export default function StockTable({ data = [], onAdjust }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500 bg-white">
        データがありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((row) => (
          <div
            key={`${row.date}-${row.bike_type}`}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-900">
                <Bike className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">{row.bike_type}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {row.date}
              </div>
            </div>

            <div className={`rounded-xl border px-4 py-5 text-center ${statusColor(row.available)} transition`}>
              <p className="text-xs tracking-[0.2em] uppercase text-current/70">残り台数</p>
              <p className="mt-2 text-5xl font-bold leading-none">{row.available}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="flex items-center gap-2 text-slate-600">
                  ベース数量
                </span>
                <span className="text-base font-semibold text-slate-900">{row.base_quantity}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <span className="flex items-center gap-2 text-slate-600">
                  <Globe className="h-3.5 w-3.5" />
                  オンライン予約
                </span>
                <span className="text-base font-semibold text-slate-900">{row.reserved}</span>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    電話・店頭予約
                  </span>
                  <span className="text-base font-semibold text-slate-900">{row.manual_adjustment}</span>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
                  <span>予約を反映</span>
                  <button
                    onClick={() => onAdjust(row.bike_type, -1)}
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onAdjust(row.bike_type, +1)}
                    className="flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
