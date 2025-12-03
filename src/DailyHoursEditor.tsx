import React, {useMemo} from "react";
import type {BaseHoursEditorProps} from "./HoursEditor.js";
import type {DailyTimeWindow} from "./types.js";
import {clamp, MINUTES_PER_DAY, minutesToTime, snapMinutes} from "./utils.js";
import {DayLane} from "./DayLane.js";

export interface DailyHoursEditorProps extends BaseHoursEditorProps {

    value: DailyTimeWindow[];

    onChange: (value: DailyTimeWindow[]) => void;

    renderCell?: (props: {
        slotIndex: number;
        startTime: string;
        endTime: string;
        active: boolean;
        toggle: () => void;
    }) => React.ReactNode;
}

export const DailyHoursEditor: React.FC<DailyHoursEditorProps> = ({
                                                                      value,
                                                                      onChange,
                                                                      stepMinutes = 30,
                                                                      dayStartHour = 8,
                                                                      dayEndHour = 20,
                                                                      minWindowMinutes = 30,
                                                                      defaultWindowMinutes = 60,
                                                                  }) => {

    // Layout config
    const pxPerMinute = 1;             // vertical scale
    const laneWidthPx = 140;           // width of the day lane
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

        const newWindow: DailyTimeWindow = {
            startTime: minutesToTime(start),
            endTime: minutesToTime(end),
        };

        onChange([...value, newWindow]);
    };

    const removeWindow = (index: number) => {
        const next = value.filter((_, i) => i !== index);
        onChange(next);
    };

    const windows: { window: DailyTimeWindow; index: number }[] = useMemo(() => {
        return value.map((w, index) => ({window: w, index}));
    }, [value]);

    // Simple 3-tick labels (top/mid/bottom)
    const timeScaleLabels = [
        `${dayStartHour}:00`,
        `${Math.round((dayStartHour + dayEndHour) / 2)}:00`,
        `${dayEndHour}:00`,
    ];

    return (
        <div style={{fontFamily: "system-ui, sans-serif", fontSize: 12}}>

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

                {/* Day lane */}
                <div style={{display: "flex", overflowX: "auto", flex: 1}}>
                    <DayLane
                        windows={windows}
                        pxPerMinute={pxPerMinute}
                        laneWidthPx={laneWidthPx}
                        dayStartMinutes={dayStartMinutes}
                        dayEndMinutes={dayEndMinutes}
                        dayMinutesSpan={dayMinutesSpan}
                        minWindowMinutes={minWindowMinutes}
                        laneHeightPx={laneHeightPx}
                        updateWindow={updateWindow}
                        createWindow={createWindow}
                        removeWindow={removeWindow}
                    />
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
