import {
    type DailyTimeWindow,
    type DayOfWeek,
    dayOfWeekOptions,
    type TimeWindow,
    type WeeklyTimeWindow
} from "./types.js";

export type DailySlots = boolean[];
export type WeeklySlots = DailySlots[];


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

/**
 * Build an empty N slots matrix (false = closed, true = open).
 */
function buildEmptyDailySlots(slotsPerDay: number): DailySlots {
    return Array(slotsPerDay).fill(false)
}

function buildEmptyWeeklySlots(slotsPerDay: number): WeeklySlots {
    return Array(7).fill(buildEmptyDailySlots(slotsPerDay));
}

/* ---------- Conversion between windows <-> slots ---------- */

export interface SlotConfig {
    stepMinutes: number;
    dayStartHour: number;
    dayEndHour: number;
}

/**
 * Convert TimeWindow[] into an N boolean array.
 */
export function dailyWindowsToSlots(
    windows: DailyTimeWindow[],
    config: SlotConfig
): DailySlots {
    const { stepMinutes, dayStartHour, dayEndHour } = config;
    const minutesPerSlot = stepMinutes;
    const minMinutes = dayStartHour * 60;
    const maxMinutes = dayEndHour * 60;
    const slotsPerDay = Math.floor(
        (maxMinutes - minMinutes) / minutesPerSlot
    );

    const slots = buildEmptyDailySlots(slotsPerDay);

    for (const w of windows || []) {

        let start = timeToMinutes(w.startTime);
        let end = timeToMinutes(w.endTime);

        // clip to the visible range
        start = Math.max(minMinutes, Math.min(maxMinutes, start));
        end = Math.max(minMinutes, Math.min(maxMinutes, end));
        if (end <= start) continue;

        const startSlot = Math.floor((start - minMinutes) / minutesPerSlot);
        const endSlot = Math.ceil((end - minMinutes) / minutesPerSlot);

        for (let i = startSlot; i < endSlot; i++) {
            if (i >= 0 && i < slotsPerDay) {
                slots[i] = true;
            }
        }
    }

    return slots;
}

export function weeklyWindowsToSlots(windows: WeeklyTimeWindow[], config: SlotConfig): WeeklySlots {
    const { stepMinutes, dayStartHour, dayEndHour } = config;
    const minutesPerSlot = stepMinutes;
    const minMinutes = dayStartHour * 60;
    const maxMinutes = dayEndHour * 60;
    const slotsPerDay = Math.floor(
        (maxMinutes - minMinutes) / minutesPerSlot
    );

    const slots = buildEmptyWeeklySlots(slotsPerDay);

    for (const w of windows || []) {
        if (!w.dayOfWeek) continue;
        const dayIndex = dayOfWeekOptions.indexOf(w.dayOfWeek);
        if (dayIndex === -1) continue;

        let start = timeToMinutes(w.startTime);
        let end = timeToMinutes(w.endTime);

        // clip to the visible range
        start = Math.max(minMinutes, Math.min(maxMinutes, start));
        end = Math.max(minMinutes, Math.min(maxMinutes, end));
        if (end <= start) continue;

        const startSlot = Math.floor((start - minMinutes) / minutesPerSlot);
        const endSlot = Math.ceil((end - minMinutes) / minutesPerSlot);

        for (let i = startSlot; i < endSlot; i++) {
            if (i >= 0 && i < slotsPerDay) {
                if (!slots[dayIndex]) slots[dayIndex] = buildEmptyDailySlots(slotsPerDay);
                slots[dayIndex][i] = true;
            }
        }
    }

    return slots;
}

/**
 * Convert an N boolean array back into TimeWindow[] by
 * compressing contiguous "true" cells into windows.
 */
export function slotsToDailyWindows(
    slots: DailySlots,
    config: SlotConfig,
): DailyTimeWindow[] {
    const { stepMinutes, dayStartHour, dayEndHour } = config;
    const minutesPerSlot = stepMinutes;
    const minMinutes = dayStartHour * 60;
    const maxMinutes = dayEndHour * 60;

    const result: TimeWindow[] = [];

    let i = 0;
    const len = slots.length;

    while (i < len) {
        if (!slots[i]) {
            i++;
            continue;
        }
        const startSlot = i;
        while (i < len && slots[i]) i++;
        const endSlot = i;

        const startMinutes = minMinutes + startSlot * minutesPerSlot;
        const endMinutes = minMinutes + endSlot * minutesPerSlot;

        // extra safety clamp
        const start = Math.max(minMinutes, Math.min(maxMinutes, startMinutes));
        const end = Math.max(minMinutes, Math.min(maxMinutes, endMinutes));
        if (end <= start) continue;

        result.push({
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
        });

    }

    return result;
}

export function slotsToWeeklyWindows(slots: WeeklySlots, config: SlotConfig): WeeklyTimeWindow[] {
    const { stepMinutes, dayStartHour, dayEndHour } = config;
    const minutesPerSlot = stepMinutes;
    const minMinutes = dayStartHour * 60;
    const maxMinutes = dayEndHour * 60;

    const result: WeeklyTimeWindow[] = [];

    slots.forEach((dailySlots, dayIndex) => {
        if (!dailySlots) return;

        let i = 0;
        const len = dailySlots.length;

        while (i < len) {
            if (!dailySlots[i]) {
                i++;
                continue;
            }

            const startSlot = i;
            while (i < len && dailySlots[i]) i++;
            const endSlot = i;

            const startMinutes = minMinutes + startSlot * minutesPerSlot;
            const endMinutes = minMinutes + endSlot * minutesPerSlot;

            // extra safety clamp
            const start = Math.max(minMinutes, Math.min(maxMinutes, startMinutes));
            const end = Math.max(minMinutes, Math.min(maxMinutes, endMinutes));
            if (end <= start) continue;

            if (!dayOfWeekOptions[dayIndex]) continue;

            result.push({
                dayOfWeek: dayOfWeekOptions[dayIndex],
                startTime: minutesToTime(start),
                endTime: minutesToTime(end),
            });
        }

    });

    return result;
}

/* ---------- Header labels ---------- */
export function buildHeaderLabels(config: SlotConfig): string[] {
    const { dayStartHour, dayEndHour } = config;
    const minMinutes = dayStartHour * 60;
    const maxMinutes = dayEndHour * 60;
    const segments = 4; // we'll show 5 labels: 0,1,2,3,4

    const labels: string[] = [];
    for (let i = 0; i <= segments; i++) {
        const m = minMinutes + ((maxMinutes - minMinutes) * i) / segments;
        const hours = Math.round(m / 60);
        const labelHours = Math.max(dayStartHour, Math.min(dayEndHour, hours));
        labels.push(`${labelHours}:00`);
    }
    return labels;
}

export const MINUTES_PER_DAY = 24 * 60;

export const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));


export function snapMinutes(value: number, stepMinutes: number): number {
    return Math.round(value / stepMinutes) * stepMinutes;
}
