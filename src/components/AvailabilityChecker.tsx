// components/AvailabilityChecker.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  bikeType: string | null;
  startDate: string | null;
  endDate: string | null;
  requestQty: number;
  onStatusChange?: (status: {
    loading: boolean;
    error: string | null;
    available: boolean | null;
    remaining: number | null;
  }) => void;
  debounceMs?: number;
  className?: string;
};

export default function AvailabilityChecker({
  bikeType,
  startDate,
  endDate,
  requestQty,
  onStatusChange,
  debounceMs = 300,
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(false);

  const isReady = useMemo(() => {
    return Boolean(bikeType && startDate && endDate && requestQty > 0);
  }, [bikeType, startDate, endDate, requestQty]);

  useEffect(() => {
    onStatusChange?.({ loading, error, available, remaining });
  }, [loading, error, available, remaining, onStatusChange]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      setLoading(false);
      setError(null);
      setAvailable(null);
      setRemaining(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // ✅ POSTで送信（RPC対応）
        const res = await fetch(`/api/check-availability`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bike_type: bikeType,
            start_date: startDate,
            end_date: endDate,
            request_qty: requestQty,
          }),
        });

        if (!res.ok) throw new Error(`在庫APIエラー: ${res.status}`);
        const data: { available?: boolean; remaining?: number | string | null } =
          await res.json();
        if (!mountedRef.current) return;

        // 🔽 残数を安全に数値化
        const remainingNum =
          typeof data.remaining === "number"
            ? data.remaining
            : Number(data.remaining) || null;

        setAvailable(data.available ?? null);
        setRemaining(remainingNum);
        setLoading(false);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (!mountedRef.current) return;
        setLoading(false);
        setError(e?.message || "在庫情報の取得に失敗しました");
        setAvailable(null);
        setRemaining(null);
      }
    }, debounceMs);
  }, [isReady, bikeType, startDate, endDate, requestQty, debounceMs]);

  // ========= 表示ロジック =========
  let content: React.ReactNode;

  if (!isReady) {
    content = (
      <p className="text-sm text-gray-400 italic">
        日付・車種・台数を選ぶと在庫を表示します
      </p>
    );
  } else if (loading) {
    content = (
      <p className="text-sm text-gray-500 animate-pulse">在庫を確認中…</p>
    );
  } else if (error) {
    content = <p className="text-sm text-red-600">{error}</p>;
  } else if (remaining === 0) {
    content = (
      <p className="text-sm font-semibold text-red-600">すべて貸出中</p>
    );
  } else if (typeof remaining === "number" && remaining > 0) {
    content = (
      <p className="text-sm font-medium text-green-700">
        残り{remaining}台
      </p>
    );
  } else {
    // 🔽 DB未登録など → 予約不可
    content = (
      <p className="text-sm font-semibold text-red-600">予約不可</p>
    );
  }

  return (
    <div className={`mt-2 text-center transition-all duration-200 ${className}`}>
      {content}
    </div>
  );
}
