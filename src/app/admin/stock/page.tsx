"use client"

import { useState } from "react"
import useSWR from "swr"
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCcw, LayoutGrid } from "lucide-react";
import StockTable from "./StockTable"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminStockPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [range, setRange] = useState<"1d" | "1week">("1d")

  const key = `/api/admin/stock?date=${selectedDate}&range=${range}`
const { data, error, mutate, isLoading } = useSWR(key, fetcher)

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

  // 1週間分データを日付ごとにグループ化
  const grouped =
    range === "1week"
      ? data.stocks.reduce((acc: Record<string, any[]>, row: any) => {
          if (!acc[row.date]) acc[row.date] = []
          acc[row.date].push(row)
          return acc
        }, {})
      : { [selectedDate]: data.stocks }

  const dateList = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen bg-slate-50/70 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">在庫管理</h1>
          <p className="text-sm text-slate-500">
            オンライン以外で受けた予約も含めて在庫を把握し、貸出準備をスムーズに進めましょう。
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" />
                {selectedDate}
              </span>
              <div className="hidden text-xs text-slate-400 md:block">在庫の基準日</div>
            </div>

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

            <div className="flex items-center justify-end gap-2">
              <div className="relative">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as "1d" | "1week")}
                  className="appearance-none rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none"
                >
                  <option value="1d">1日表示</option>
                  <option value="1week">1週間表示</option>
                </select>
                <LayoutGrid className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                onClick={() => setSelectedDate(today)}
                className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <RefreshCcw className="h-4 w-4" />
                今日に戻る
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {range === "1week" ? (
            dateList.map((d) => (
              <div key={d} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  {d}
                </div>
                <StockTable data={grouped[d]} onAdjust={handleAdjust} />
              </div>
            ))
          ) : (
            <StockTable data={data.stocks} onAdjust={handleAdjust} />
          )}
        </section>
      </div>
    </div>
  );
}
