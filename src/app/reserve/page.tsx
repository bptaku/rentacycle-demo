"use client";

import { useState } from "react";
import AvailabilityChecker from "@/components/AvailabilityChecker";

export default function ReservePage() {
  // --- 入力項目 ---
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // --- 在庫状態・ボタン制御 ---
  const [availability, setAvailability] = useState<{
    loading: boolean;
    error: string | null;
    available: boolean | null;
    remaining: number | null;
  }>({ loading: false, error: null, available: null, remaining: null });

  const isInputReady =
    selectedType && startDate && endDate && quantity > 0;

  const isOutOfStock = availability.remaining === 0;
  const isLoading = availability.loading;
  const hasError = Boolean(availability.error);

  const isBookingDisabled =
    !isInputReady || isLoading || hasError || isOutOfStock;

  // --- 予約送信 ---
  async function handleReserve() {
    alert("予約処理を実装予定！");
    // POST /api/reserve に送信など
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      {/* 車種・日付・台数などのフォームUI（仮） */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">車種</label>
        <select
          value={selectedType ?? ""}
          onChange={(e) => setSelectedType(e.target.value || null)}
          className="w-full border rounded p-2"
        >
          <option value="">選択してください</option>
          <option value="standard">スタンダード</option>
          <option value="e-bike">Eバイク</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">貸出日</label>
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value || null)}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">返却日</label>
          <input
            type="date"
            value={endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value || null)}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">台数</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full border rounded p-2"
        />
      </div>

      {/* AvailabilityChecker を組み込み */}
      <AvailabilityChecker
        bikeType={selectedType}
        startDate={startDate}
        endDate={endDate}
        requestQty={quantity}
        onStatusChange={setAvailability}
      />

      {/* 予約ボタン */}
      <button
        disabled={isBookingDisabled}
        onClick={handleReserve}
        className={`mt-4 w-full rounded-lg px-4 py-2 text-white font-medium transition-colors duration-200 ${
          isBookingDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "確認中…" : isOutOfStock ? "貸出中" : "予約する"}
      </button>
    </div>
  );
}
