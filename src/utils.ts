import type {DayOfWeek} from "./types.js";

export const DEFAULT_DAY_LABELS: Record<DayOfWeek, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
};

/**
 * Convert "HH:MM[:SS]" to minutes since midnight.
 * Any seconds are ignored and we clamp to [0, 24h).
 */
export function timeToMinutes(time: string): number {
    const [hStr, mStr = "0"] = time.split(":");
    const hours = Number(hStr) || 0;
    const minutes = Number(mStr) || 0;
    const total = hours * 60 + minutes;
    const max = 24 * 60;
    return Math.max(0, Math.min(total, max));
}

export function timeToDate(time: string): Date {
    const [hStr, mStr = "0"] = time.split(":");
    const hours = Number(hStr) || 0;
    const minutes = Number(mStr) || 0;
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date;
}

/**
 * Convert minutes since midnight to "HH:MM:SS".
 * We clamp to [0, 24h), and for 24:00 we approximate as 23:59:00.
 */
export function minutesToTime(totalMinutes: number): string {
    const maxMinutes = 24 * 60;
    let minutesClamped = Math.max(0, Math.min(totalMinutes, maxMinutes));
    // Avoid 24:00:00, which is not technically valid; approximate as 23:59:00.
    if (minutesClamped === maxMinutes) {
        minutesClamped = maxMinutes - 1;
    }
    const hours = Math.floor(minutesClamped / 60);
    const minutes = minutesClamped % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`;
}


export const MINUTES_PER_DAY = 24 * 60;

export const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));


export function snapMinutes(value: number, stepMinutes: number): number {
    return Math.round(value / stepMinutes) * stepMinutes;
}
