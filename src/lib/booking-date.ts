/**
 * 予約可能な「最短貸出日」を返す。
 * 2日後以降のみ予約可能とするため、今日（UTC） + 2 日を YYYY-MM-DD で返す。
 * クライアント・API で同じロジックを使い、日付の解釈を揃える。
 */
export function getMinBookingDateStr(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const minDate = new Date(Date.UTC(y, m, d + 2));
  const yy = minDate.getUTCFullYear();
  const mm = String(minDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(minDate.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * start_date が最短予約日（2日後以降）かどうか
 */
export function isStartDateAllowed(startDate: string, now: Date = new Date()): boolean {
  const min = getMinBookingDateStr(now);
  return startDate >= min;
}
