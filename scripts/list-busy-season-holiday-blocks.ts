const BUSY_SEASON_MONTHS = [
  { start: 3, end: 5 },
  { start: 9, end: 11 },
] as const;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const HOLIDAY_API = "https://holidays-jp.github.io/api/v1/date.json";

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isBusySeasonMonth(date: Date): boolean {
  const month = date.getMonth() + 1;
  return BUSY_SEASON_MONTHS.some(({ start, end }) => month >= start && month <= end);
}

const holidayCache = new Map<number, Set<string>>();
const holidayNameCache = new Map<string, string>();

async function loadHolidays(): Promise<void> {
  if (holidayCache.size > 0) return;
  const res = await fetch(HOLIDAY_API);
  if (!res.ok) {
    throw new Error(`Failed to fetch holiday data: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as Record<string, string>;
  for (const [date, name] of Object.entries(data)) {
    holidayNameCache.set(date, name);
    const year = Number.parseInt(date.split("-")[0]!, 10);
    if (!holidayCache.has(year)) {
      holidayCache.set(year, new Set());
    }
    holidayCache.get(year)!.add(date);
  }
}

async function getHolidaySet(year: number): Promise<Set<string>> {
  await loadHolidays();
  return holidayCache.get(year) ?? new Set();
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function isHolidayOrWeekend(date: Date): Promise<boolean> {
  const set = await getHolidaySet(date.getFullYear());
  return set.has(formatDate(date)) || isWeekend(date);
}

async function countConsecutive(date: Date): Promise<number> {
  if (Number.isNaN(date.getTime())) return 0;
  if (!(await isHolidayOrWeekend(date))) return 0;

  let count = 1;

  const prev = new Date(date);
  while (true) {
    prev.setDate(prev.getDate() - 1);
    if (!(await isHolidayOrWeekend(prev))) break;
    count += 1;
  }

  const next = new Date(date);
  while (true) {
    next.setDate(next.getDate() + 1);
    if (!(await isHolidayOrWeekend(next))) break;
    count += 1;
  }

  return count;
}

async function listBlockedRanges({ startYear, endYear }: { startYear: number; endYear: number }) {
  const ranges: Array<{ start: Date; end: Date; length: number }> = [];

  for (let year = startYear; year <= endYear; year++) {
    let date = new Date(year, 0, 1);
    while (date.getFullYear() === year) {
      if (isBusySeasonMonth(date)) {
        const isHoliday = await isHolidayOrWeekend(date);
        if (isHoliday) {
          const prev = new Date(date);
          prev.setDate(prev.getDate() - 1);
          const prevHoliday = await isHolidayOrWeekend(prev);
          if (!prevHoliday) {
            const length = await countConsecutive(date);
            if (length >= 3) {
              const end = new Date(date);
              end.setDate(end.getDate() + length - 1);
              ranges.push({ start: new Date(date), end, length });
              date = new Date(end);
            }
          }
        }
      }
      date.setDate(date.getDate() + 1);
    }
  }

  return ranges;
}

async function describeRange(start: Date, end: Date): Promise<string[]> {
  const lines: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const formatted = formatDate(cursor);
    const label = holidayNameCache.get(formatted);
    const dayLabel = ["日", "月", "火", "水", "木", "金", "土"][cursor.getDay()];
    lines.push(`${formatted} (${dayLabel})${label ? ` - ${label}` : ""}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return lines;
}

(async () => {
  const startYear = Number(process.argv[2] ?? new Date().getFullYear());
  const endYear = Number(process.argv[3] ?? startYear);
  await loadHolidays();
  const ranges = await listBlockedRanges({ startYear, endYear });
  if (ranges.length === 0) {
    console.log("対象期間にブロック対象日はありません。");
    return;
  }

  for (const range of ranges) {
    const summary = `${formatDate(range.start)} 〜 ${formatDate(range.end)} (${range.length}日)`;
    console.log("===", summary, "===");
    const lines = await describeRange(range.start, range.end);
    for (const line of lines) {
      console.log("  -", line);
    }
    console.log("");
  }
})();
