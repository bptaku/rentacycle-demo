"use client";

import { useState } from "react";
import AvailabilityChecker from "@/components/AvailabilityChecker";

export default function ReservePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [availability, setAvailability] = useState<{
    loading: boolean;
    error: string | null;
    available: boolean | null;
    remaining: number | null;
  }>({ loading: false, error: null, available: null, remaining: null });

  const isReady = Boolean(selectedType && startDate && endDate && quantity > 0);
  const isOutOfStock =
    availability.remaining === 0 || availability.remaining === null;
  const isDisabled =
    !isReady || availability.loading || !!availability.error || isOutOfStock;

  const handleReserve = async () => {
    alert("予約処理を実装予定（在庫確認済）");
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">レンタサイクル予約</h1>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* 車種 */}
        <div>
          <label
            htmlFor="bikeType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            車種
          </label>
          <select
            id="bikeType"
            name="bikeType"
            value={selectedType ?? ""}
            onChange={(e) =>
              setSelectedType(e.target.value ? e.target.value : null)
            }
            className="w-full border rounded p-2 text-gray-800"
            required
          >
            <option value="">選択してください</option>
            <option value="standard">スタンダード</option>
            <option value="e-bike">Eバイク</option>
          </select>
        </div>

        {/* 貸出日・返却日 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              貸出日
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={startDate ?? ""}
              onChange={(e) =>
                setStartDate(e.target.value ? e.target.value : null)
              }
              className="w-full border rounded p-2 text-gray-800"
              required
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              返却日
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={endDate ?? ""}
              onChange={(e) =>
                setEndDate(e.target.value ? e.target.value : null)
              }
              className="w-full border rounded p-2 text-gray-800"
              required
            />
          </div>
        </div>

        {/* 台数 */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            台数
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border rounded p-2 text-gray-800"
            required
          />
        </div>

        {/* 在庫表示 */}
        <AvailabilityChecker
          bikeType={selectedType}
          startDate={startDate}
          endDate={endDate}
          requestQty={quantity}
          onStatusChange={setAvailability}
        />

        {/* 予約ボタン */}
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleReserve}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-white font-medium transition-colors duration-200 ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {availability.loading
            ? "確認中…"
            : isOutOfStock
            ? "すべて貸出中"
            : "予約する"}
        </button>
      </form>
    </main>
  );
}
