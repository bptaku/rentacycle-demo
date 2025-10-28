"use client"

import { useState } from "react"
import useSWR from "swr"
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
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">在庫管理</h1>

      {/* 📅 日付ナビゲーション */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => shiftDate(-1)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⏪ 前日
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-2 py-1"
        />

        <button
          onClick={() => shiftDate(+1)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          翌日 ⏩
        </button>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "1d" | "1week")}
          className="border rounded px-2 py-1 ml-4"
        >
          <option value="1d">1日</option>
          <option value="1week">1週間</option>
        </select>

        <button
          onClick={() => setSelectedDate(today)}
          className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          今日に戻る
        </button>
      </div>

      {/* 🧾 テーブル表示 */}
      {range === "1week" ? (
        <div className="space-y-6">
          {dateList.map((d) => (
            <div key={d}>
              <h2 className="text-lg font-semibold mb-2 border-b border-gray-300">
                📅 {d}
              </h2>
              <StockTable data={grouped[d]} onAdjust={handleAdjust} />
            </div>
          ))}
        </div>
      ) : (
        <StockTable data={data.stocks} onAdjust={handleAdjust} />
      )}
    </div>
  )
}
