"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, RefreshCcw, ListTodo } from "lucide-react";
import StockTable from "./StockTable"
import BikeMasterTable from "./BikeMasterTable"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminStockPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [showBikeMaster, setShowBikeMaster] = useState(false)

  const key = `/api/admin/stock?date=${selectedDate}&range=1d`
  const { data, error, mutate, isLoading } = useSWR(key, fetcher)

  const bikeMasterKey = showBikeMaster ? `/api/admin/bike-master` : null
  const {
    data: bikeMasterData,
    error: bikeMasterError,
    mutate: mutateBikeMaster,
    isLoading: bikeMasterLoading,
  } = useSWR(bikeMasterKey, fetcher)

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().slice(0, 10))
  }

  const handleAdjust = async (bike_type: string, delta: number) => {
    try {
      const res = await fetch("/api/admin/update-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, bike_type, delta }),
      })
      const result = await res.json()
      console.log("更新結果:", result)

      // ✅ 再フェッチでUIに反映
      mutate(undefined, { revalidate: true })
    } catch (e) {
      console.error("更新エラー:", e)
    }
  }


  if (error)
    return <div className="p-4 text-red-500">データ取得エラー: {error.message}</div>

  if (isLoading || !data)
    return <div className="p-4 text-gray-500">読み込み中...</div>

  if (data.status === "error")
    return <div className="p-4 text-gray-500">{data.message || "データが見つかりません"}</div>

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">在庫管理</h1>
              <p className="text-sm text-slate-500 mt-1">
                オンライン以外で受けた予約も含めて在庫を把握し、貸出準備をスムーズに進めましょう。
              </p>
            </div>
            <Link
              href="/admin/reservations"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ListTodo className="h-4 w-4" />
              予約管理
            </Link>
          </div>
        </header>

        <div className="flex justify-end">
          <button
            onClick={() => setShowBikeMaster((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-100"
          >
            {showBikeMaster ? "基本在庫を隠す" : "基本在庫を表示"}
          </button>
        </div>

        {showBikeMaster &&
          (bikeMasterError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              bike_master 取得エラー: {bikeMasterError.message}
            </div>
          ) : bikeMasterLoading || !bikeMasterData ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              基本在庫を読み込み中...
            </div>
          ) : bikeMasterData.status === "error" ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              {bikeMasterData.message || "bike_master が見つかりません"}
            </div>
          ) : (
            <BikeMasterTable
              rows={bikeMasterData.rows || []}
              propagateStartDate={selectedDate}
              onSaved={() => {
                mutateBikeMaster(undefined, { revalidate: true })
                mutate(undefined, { revalidate: true })
              }}
            />
          ))}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => shiftDate(-1)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
                前日
              </button>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="appearance-none border-none bg-transparent text-slate-700 focus:outline-none"
                />
              </div>

              <button
                onClick={() => shiftDate(+1)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                翌日
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(today)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
                <RefreshCcw className="h-4 w-4" />
                今日に戻る
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <StockTable data={data.stocks} onAdjust={handleAdjust} />
        </section>
      </div>
    </div>
  );
}
