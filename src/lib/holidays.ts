export interface Holiday {
  date: string;
  name: string;
}

const holidayCache = new Map<number, Holiday[]>();

async function fetchHolidaysFromApi(year: number): Promise<Holiday[] | null> {
  try {
    const response = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`, {
      cache: "force-cache",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return Object.entries<string>(data).map(([date, name]) => ({ date, name }));
  } catch (error) {
    console.warn("Failed to fetch holidays from API:", error);
    return null;
  }
}

function calculateFixedHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [
    { date: `${year}-01-01`, name: "元日" },
    { date: `${year}-02-11`, name: "建国記念の日" },
    { date: `${year}-02-23`, name: "天皇誕生日" },
    { date: `${year}-04-29`, name: "昭和の日" },
    { date: `${year}-05-03`, name: "憲法記念日" },
    { date: `${year}-05-04`, name: "みどりの日" },
    { date: `${year}-05-05`, name: "こどもの日" },
    { date: `${year}-08-11`, name: "山の日" },
    { date: `${year}-11-03`, name: "文化の日" },
    { date: `${year}-11-23`, name: "勤労感謝の日" },
  ];

  const springEquinox = getSpringEquinox(year);
  const autumnEquinox = getAutumnEquinox(year);
  holidays.push({ date: springEquinox, name: "春分の日" });
  holidays.push({ date: autumnEquinox, name: "秋分の日" });

  holidays.push({ date: getNthMonday(year, 7, 3), name: "海の日" });
  holidays.push({ date: getNthMonday(year, 9, 3), name: "敬老の日" });
  holidays.push({ date: getNthMonday(year, 10, 2), name: "スポーツの日" });

  holidays.push(...calculateSubstituteHolidays(holidays));

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

function getSpringEquinox(year: number): string {
  if (year >= 2000 && year <= 2099) {
    const day = Math.floor(20.8431 + 0.242194 * (year - 2000) - Math.floor((year - 2000) / 4));
    return `${year}-03-${String(day).padStart(2, "0")}`;
  }
  return `${year}-03-20`;
}

function getAutumnEquinox(year: number): string {
  if (year >= 2000 && year <= 2099) {
    const day = Math.floor(23.2488 + 0.242194 * (year - 2000) - Math.floor((year - 2000) / 4));
    return `${year}-09-${String(day).padStart(2, "0")}`;
  }
  return `${year}-09-23`;
}

function getNthMonday(year: number, month: number, nth: number): string {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = (firstDay === 0 ? 1 : 8 - firstDay) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function calculateSubstituteHolidays(holidays: Holiday[]): Holiday[] {
  const substitutes: Holiday[] = [];
  const holidaySet = new Set(holidays.map((h) => h.date));

  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    if (date.getDay() === 0) {
      const substitute = new Date(date);
      substitute.setDate(substitute.getDate() + 1);
      const substituteDate = formatDate(substitute);
      if (!holidaySet.has(substituteDate)) {
        substitutes.push({ date: substituteDate, name: "振替休日" });
        holidaySet.add(substituteDate);
      }
    }
  }

  return substitutes;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getHolidays(year: number): Promise<Holiday[]> {
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  const fetched = await fetchHolidaysFromApi(year);
  const holidays = fetched && fetched.length > 0 ? fetched : calculateFixedHolidays(year);
  holidayCache.set(year, holidays);
  return holidays;
}

export async function isHoliday(date: string): Promise<boolean> {
  const year = new Date(date).getFullYear();
  const holidays = await getHolidays(year);
  return holidays.some((holiday) => holiday.date === date);
}

export function getDayOfWeek(date: string): number {
  return new Date(date).getDay();
}
