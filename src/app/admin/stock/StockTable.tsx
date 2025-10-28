"use client"

interface StockRow {
  date: string
  bike_type: string
  base_quantity: number
  manual_adjustment: number
  reserved: number
  available: number
  updated_at?: string
}

interface Props {
  data?: StockRow[]   // ← optional に変更
  onAdjust: (bike_type: string, delta: number) => void
}

export default function StockTable({ data = [], onAdjust }: Props) {
  // data が undefined の場合は空配列を使う
  if (!data || data.length === 0) {
    return (
      <div className="text-gray-500 border p-3 text-sm rounded">
        データがありません
      </div>
    )
  }

  return (
    <table className="w-full border-collapse border border-gray-300 text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="border px-3 py-2 text-left">車種</th>
          <th className="border px-3 py-2 text-right">利用可能</th>
          <th className="border px-3 py-2 text-right">予約</th>
          <th className="border px-3 py-2 text-right">調整</th>
          <th className="border px-3 py-2 text-right">ベース</th>
          <th className="border px-3 py-2 text-center">操作</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={`${row.date}-${row.bike_type}`}>
            <td className="border px-3 py-2">{row.bike_type}</td>
            <td className="border px-3 py-2 text-right font-semibold">
              {row.available}
            </td>
            <td className="border px-3 py-2 text-right">{row.reserved}</td>
            <td className="border px-3 py-2 text-right">{row.manual_adjustment}</td>
            <td className="border px-3 py-2 text-right">{row.base_quantity}</td>
            <td className="border px-3 py-2 text-center">
              <button
                className="px-2 py-1 bg-red-500 text-white rounded mr-2 hover:bg-red-600"
                onClick={() => onAdjust(row.bike_type, -1)}
              >
                −
              </button>
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => onAdjust(row.bike_type, +1)}
              >
                ＋
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
