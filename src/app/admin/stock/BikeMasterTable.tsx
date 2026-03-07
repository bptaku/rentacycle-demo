"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, RefreshCcw } from "lucide-react";

type BikeMasterRow = {
  bike_type: string;
  base_quantity: number;
  updated_at: string | null;
};

type Props = {
  rows: BikeMasterRow[];
  propagateStartDate: string; // YYYY-MM-DD
  onSaved?: () => void;
};

export default function BikeMasterTable({ rows, propagateStartDate, onSaved }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errorByType, setErrorByType] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const r of rows) next[r.bike_type] = String(r.base_quantity ?? 0);
    setDraft(next);
  }, [rows]);

  const changed = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      const current = String(r.base_quantity ?? 0);
      if ((draft[r.bike_type] ?? current) !== current) s.add(r.bike_type);
    }
    return s;
  }, [rows, draft]);

  const saveOne = async (bike_type: string) => {
    const raw = draft[bike_type];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setErrorByType((prev) => ({ ...prev, [bike_type]: "0以上の数値を入力してください" }));
      return;
    }

    setSaving((p) => ({ ...p, [bike_type]: true }));
    setErrorByType((p) => ({ ...p, [bike_type]: "" }));

    try {
      const res = await fetch("/api/admin/bike-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bike_type,
          base_quantity: Math.trunc(parsed),
          propagate_start_date: propagateStartDate,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.status !== "ok") {
        setErrorByType((prev) => ({ ...prev, [bike_type]: json?.message || "更新に失敗しました" }));
        return;
      }
      onSaved?.();
    } catch (e: any) {
      setErrorByType((prev) => ({ ...prev, [bike_type]: e?.message || "更新に失敗しました" }));
    } finally {
      setSaving((p) => ({ ...p, [bike_type]: false }));
    }
  };

  if (!rows || rows.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">bike_master データがありません</div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">基本在庫（所有台数）</h2>
        <p className="text-xs text-slate-500">
          ここで入力した台数は <code>bike_master.base_quantity</code> を更新し、同時に{" "}
          <code>stock.base_quantity</code>（{propagateStartDate} 以降）にも同期します。
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => {
          const isChanged = changed.has(r.bike_type);
          const isSaving = Boolean(saving[r.bike_type]);
          const err = errorByType[r.bike_type];
          return (
            <div key={r.bike_type} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{r.bike_type}</div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    更新日時: {r.updated_at ? new Date(r.updated_at).toLocaleString("ja-JP") : "—"}
                  </div>
                </div>

                <button
                  onClick={() => saveOne(r.bike_type)}
                  disabled={!isChanged || isSaving}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition",
                    !isChanged || isSaving
                      ? "bg-slate-100 text-slate-400"
                      : "bg-blue-600 text-white hover:bg-blue-700",
                  ].join(" ")}
                >
                  {isSaving ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  保存
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  inputMode="numeric"
                  value={draft[r.bike_type] ?? String(r.base_quantity ?? 0)}
                  onChange={(e) => setDraft((p) => ({ ...p, [r.bike_type]: e.target.value }))}
                  className={[
                    "w-full rounded-xl border px-3 py-2 text-sm focus:outline-none",
                    err ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:ring-2 focus:ring-blue-100",
                  ].join(" ")}
                />
                <div className="shrink-0 text-sm text-slate-500">台</div>
              </div>

              {err ? <div className="mt-2 text-xs text-red-600">{err}</div> : null}
              {!err && isChanged ? <div className="mt-2 text-xs text-amber-600">未保存</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

