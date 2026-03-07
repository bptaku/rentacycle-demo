"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { ja, enUS } from "react-day-picker/locale";
import "react-day-picker/style.css";
import type { ReservationLocale } from "@/lib/reservation-i18n";

function formatDateForInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateFromInput(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  locale: ReservationLocale;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export default function LocaleDatePicker({
  value,
  onChange,
  locale,
  min,
  max,
  disabled,
  className = "",
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dayLocale = locale === "en" ? enUS : ja;
  const selectedDate = value ? parseDateFromInput(value) : undefined;
  const minDate = min ? parseDateFromInput(min) : undefined;
  const maxDate = max ? parseDateFromInput(max) : undefined;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayLabel = locale === "en" ? "Year / Month / Day" : "年 / 月 / 日";
  const todayLabel = locale === "en" ? "Today" : "今日";
  const clearLabel = locale === "en" ? "Clear" : "削除";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-blue-400 focus:outline-none disabled:opacity-50 ${className}`}
        aria-label={displayLabel}
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-slate-400">{placeholder ?? displayLabel}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            locale={dayLocale}
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onChange(formatDateForInput(date));
                setOpen(false);
              }
            }}
            disabled={(d) => {
              if (minDate && d < minDate) return true;
              if (maxDate && d > maxDate) return true;
              return false;
            }}
            defaultMonth={selectedDate ?? new Date()}
            showOutsideDays
            className="rdp-root"
          />
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
            >
              {clearLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(formatDateForInput(today));
                setOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              {todayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
