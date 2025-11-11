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
  fallbackRemaining?: number | null;
};

export default function AvailabilityChecker({
  bikeType,
  startDate,
  endDate,
  requestQty,
  onStatusChange,
  debounceMs = 300,
  className = "",
  fallbackRemaining = null,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(false);
  const statusCallbackRef = useRef<Props["onStatusChange"] | undefined>(undefined);

  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (remaining == null && typeof fallbackRemaining === "number") {
      setRemaining(fallbackRemaining);
    }
  }, [fallbackRemaining, remaining]);

  const isReady = useMemo(() => {
    return Boolean(bikeType && startDate && endDate && requestQty >= 0);
  }, [bikeType, startDate, endDate, requestQty]);

  useEffect(() => {
    if (statusCallbackRef.current) {
      statusCallbackRef.current({
        loading,
        error,
        available,
        remaining,
      });
    }
  }, [loading, error, available, remaining]);

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

    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      active.tagName === "INPUT" &&
      (active as HTMLInputElement).type === "number" &&
      active.hasAttribute("data-availability-pause")
    ) {
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

        const json = await res.json();
        const result = json.data ?? json;

        const remainingNum =
          typeof result.remaining === "number"
            ? result.remaining
            : Number(result.remaining) || null;

        if (!mountedRef.current) return;
        setAvailable(result.available ?? null);
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

  let content: React.ReactNode;

  if (!isReady) {
    content = (
      <p className="text-sm text-gray-400 italic">
        プラン・日付を選ぶと在庫を表示します
      </p>
    );
  } else if (loading) {
    content = <p className="text-sm text-gray-500 animate-pulse">在庫を確認中…</p>;
  } else if (error) {
    content = <p className="text-sm text-red-600">{error}</p>;
  } else if (typeof remaining === "number") {
    content =
      remaining <= 0 ? (
        <p className="text-sm font-semibold text-red-600">すべて貸出中</p>
      ) : (
        <p className="text-sm font-medium text-green-700">残り{remaining}台</p>
      );
  } else if (available === false) {
    content = <p className="text-sm font-semibold text-red-600">予約不可</p>;
  } else if (typeof fallbackRemaining === "number") {
    content =
      fallbackRemaining <= 0 ? (
        <p className="text-sm font-semibold text-red-600">すべて貸出中</p>
      ) : (
        <p className="text-sm font-medium text-green-700">残り{fallbackRemaining}台</p>
      );
  } else {
    content = <p className="text-sm text-gray-500">在庫状況を確認中です</p>;
  }

  return <div className={`text-center transition-all duration-200 ${className}`}>{content}</div>;
}
