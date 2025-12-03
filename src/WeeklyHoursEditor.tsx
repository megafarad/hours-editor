import React, {useMemo} from "react";
import {type DayOfWeek, dayOfWeekOptions, type WeeklyTimeWindow} from "./types.js";
import {
    DEFAULT_DAY_LABELS, minutesToTime, clamp, MINUTES_PER_DAY, snapMinutes
} from "./utils.js";
import type {BaseHoursEditorProps} from "./HoursEditor.js";
import {DayLane} from "./DayLane.js";


export interface WeeklyHoursEditorProps extends BaseHoursEditorProps {
    value: WeeklyTimeWindow[];

    onChange: (value: WeeklyTimeWindow[]) => void;

    dayLabels?: Partial<Record<DayOfWeek, string>>;

    renderCell?: (props: {
        day: DayOfWeek;
        dayIndex: number;
        slotIndex: number;
        startTime: string;
        endTime: string;
        active: boolean;
        toggle: () => void;
    }) => React.ReactNode;
}


export const WeeklyHoursEditor: React.FC<WeeklyHoursEditorProps> = ({
                                                                        value,
                                                                        onChange,
                                                                        stepMinutes = 30,
                                                                        dayStartHour = 8,
                                                                        dayEndHour = 20,
                                                                        minWindowMinutes = 30,
                                                                        defaultWindowMinutes = 60,
                                                                        dayLabels,
                                                                    }) => {
    const labels = useMemo(
        () => ({
            ...DEFAULT_DAY_LABELS,
            ...(dayLabels || {}),
        }),
        [dayLabels]
    );

    // Layout config
    const pxPerMinute = 1;             // vertical scale
    const laneWidthPx = 140;           // width of each day column
    const gutterWidthPx = 50;          // left time-gutter width

    const dayStartMinutes = clamp(dayStartHour * 60, 0, MINUTES_PER_DAY);
    const dayEndMinutes = clamp(
        dayEndHour * 60,
        dayStartMinutes + 60,
        MINUTES_PER_DAY
    );
    const dayMinutesSpan = dayEndMinutes - dayStartMinutes;
    const laneHeightPx = dayMinutesSpan * pxPerMinute;

    const updateWindow = (
        index: number,
        newStartMinutes: number,
        newEndMinutes: number
    ) => {
        const spanStart = dayStartMinutes;
        const spanEnd = dayEndMinutes;

        let start = snapMinutes(newStartMinutes, stepMinutes);
        let end = snapMinutes(newEndMinutes, stepMinutes);

        if (end <= start) {
            end = start + minWindowMinutes;
        }

        // clamp to visible span
        if (start < spanStart) {
            const diff = spanStart - start;
            start += diff;
            end += diff;
        }
        if (end > spanEnd) {
            const diff = end - spanEnd;
            start -= diff;
            end -= diff;
        }

        start = clamp(start, spanStart, spanEnd - minWindowMinutes);
        end = clamp(end, start + minWindowMinutes, spanEnd);

        const next = value.map((w, i) =>
            i === index
                ? {
                    ...w,
                    startTime: minutesToTime(start),
                    endTime: minutesToTime(end),
                }
                : w
        );

        onChange(next);
    };

    const createWindow = (
        day: DayOfWeek,
        rawMinutesFromDayStart: number
    ) => {
        const spanStart = dayStartMinutes;
        const spanEnd = dayEndMinutes;

        let start = spanStart + rawMinutesFromDayStart;
        start = snapMinutes(start, stepMinutes);
        let end = start + defaultWindowMinutes;

        if (end > spanEnd) {
            end = spanEnd;
            start = Math.max(spanStart, end - defaultWindowMinutes);
            start = snapMinutes(start, stepMinutes);
        }

        const newWindow: WeeklyTimeWindow = {
            dayOfWeek: day,
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
        };

        onChange([...value, newWindow]);
    };

    const removeWindow = (index: number) => {
        const next = value.filter((_, i) => i !== index);
        onChange(next);
    };

    // windows grouped by day with original index
    const windowsByDay: Record<DayOfWeek, { window: WeeklyTimeWindow; index: number }[]> =
        useMemo(() => {
            const grouped: Record<
                DayOfWeek,
                { window: WeeklyTimeWindow; index: number }[]
            > = {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: [],
            };
            value.forEach((w, index) => {
                if (grouped[w.dayOfWeek]) {
                    grouped[w.dayOfWeek].push({window: w, index});
                }
            });
            return grouped;
        }, [value]);

    // Simple 3-tick labels (top/mid/bottom)
    const timeScaleLabels = [
        `${dayStartHour}:00`,
        `${Math.round((dayStartHour + dayEndHour) / 2)}:00`,
        `${dayEndHour}:00`,
    ];

    return (
        <div style={{fontFamily: "system-ui, sans-serif", fontSize: 12}}>
            {/* Header row: time gutter + day headers */}
            <div
                style={{
                    display: "flex",
                    marginBottom: 4,
                    marginLeft: gutterWidthPx,
                }}
            >
                {dayOfWeekOptions.map((day) => (
                    <div
                        key={day}
                        style={{
                            width: laneWidthPx,
                            textAlign: "center",
                            fontWeight: 600,
                            color: "#374151",
                        }}
                    >
                        {labels[day]}
                    </div>
                ))}
            </div>

            {/* Main area: left time scale + day lanes */}
            <div style={{display: "flex"}}>
                {/* Time scale */}
                <div
                    style={{
                        width: gutterWidthPx,
                        height: laneHeightPx,
                        borderRight: "1px solid #e5e7eb",
                        position: "relative",
                        boxSizing: "border-box",
                    }}
                >
                    {/* top / mid / bottom labels */}
                    {timeScaleLabels.map((label, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: "absolute",
                                left: 0,
                                transform: "translateY(-50%)",
                                top:
                                    idx === 0
                                        ? 0
                                        : idx === 1
                                            ? laneHeightPx / 2
                                            : laneHeightPx,
                                fontSize: 11,
                                color: "#6b7280",
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Day lanes */}
                <div style={{display: "flex", overflowX: "auto", flex: 1}}>
                    {dayOfWeekOptions.map((day) => {
                        const windowsForDay = windowsByDay[day];


                        return (<DayLane
                            key={day}
                            windows={windowsForDay}
                            pxPerMinute={pxPerMinute}
                            laneWidthPx={laneWidthPx}
                            dayStartMinutes={dayStartMinutes}
                            dayEndMinutes={dayEndMinutes}
                            dayMinutesSpan={dayMinutesSpan}
                            minWindowMinutes={minWindowMinutes}
                            laneHeightPx={laneHeightPx}
                            updateWindow={updateWindow}
                            createWindow={function (rawMinutesFromDayStart: number): void {
                                createWindow(day, rawMinutesFromDayStart);
                            }}
                            removeWindow={removeWindow}
                        />);
                    })}
                </div>
            </div>

            <div
                style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#6b7280",
                }}
            >
                Double-click in a column to create a window. Drag and resize
                blocks to adjust hours.
            </div>
        </div>
    );
};
