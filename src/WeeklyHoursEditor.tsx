import React, {useMemo} from "react";
import {
    BaseHoursEditorClassNames,
    BaseHoursEditorProps,
    type DayOfWeek,
    dayOfWeekOptions,
    type WeeklyTimeWindow
} from "./types.js";
import {
    DEFAULT_DAY_LABELS, minutesToTime, clamp, MINUTES_PER_DAY, snapMinutes
} from "./utils.js";
import {DayLane} from "./DayLane.js";

export interface WeeklyHoursEditorClassNames extends BaseHoursEditorClassNames {
    dayHeader?: string;
}

export interface WeeklyHoursEditorProps extends BaseHoursEditorProps {
    value: WeeklyTimeWindow[];

    onChange: (value: WeeklyTimeWindow[]) => void;

    dayLabels?: Partial<Record<DayOfWeek, string>>;

    startOfWeek?: DayOfWeek;

    renderCell?: (props: {
        day: DayOfWeek;
        dayIndex: number;
        slotIndex: number;
        startTime: string;
        endTime: string;
        active: boolean;
        toggle: () => void;
    }) => React.ReactNode;

    classNames?: WeeklyHoursEditorClassNames;
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
                                                                        startOfWeek = "monday" as DayOfWeek,
                                                                        layoutProps,
                                                                        locale = "en-US",
                                                                        classNames = {}
                                                                    }) => {
    const labels = useMemo(
        () => ({
            ...DEFAULT_DAY_LABELS,
            ...(dayLabels || {}),
        }),
        [dayLabels]
    );

    // Layout config
    const pxPerMinute = layoutProps?.pxPerMinute ?? 1;             // vertical scale
    const laneWidthPx = layoutProps?.laneWidthPx ?? 140;           // width of each day column
    const gutterWidthPx = layoutProps?.gutterWidthPx ?? 40;          // left time-gutter width

    const dayStartMinutes = clamp(dayStartHour * 60, 0, MINUTES_PER_DAY);
    const dayEndMinutes = clamp(
        dayEndHour * 60,
        dayStartMinutes + 60,
        MINUTES_PER_DAY
    );
    const dayMinutesSpan = dayEndMinutes - dayStartMinutes;
    const laneHeightPx = dayMinutesSpan * pxPerMinute;

    const sortedDays = useMemo(() => {
        const startIndex = dayOfWeekOptions.indexOf(startOfWeek);
        return [
            ...dayOfWeekOptions.slice(startIndex),
            ...dayOfWeekOptions.slice(0, startIndex),
        ];
    }, [startOfWeek]);

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
    const timeScaleLabels: string[] = [];

    for (let i = dayStartHour; i <= dayEndHour; i++) {
        if (i === 24) {
            const date = new Date().setHours(0, 0, 0, 0);
            timeScaleLabels.push(new Intl.DateTimeFormat(locale, {hour: 'numeric'}).format(date))
        } else {
            const date = new Date().setHours(i, 0, 0, 0);
            timeScaleLabels.push(new Intl.DateTimeFormat(locale, {hour: 'numeric'}).format(date))
        }
    }


    return (
        <div
            className={classNames.container}
            style={classNames.container ? undefined : {fontFamily: "system-ui, sans-serif", fontSize: 12}}>
            {/* Header row: time gutter + day headers */}
            <div
                className={classNames.headerRow}
                style={classNames.headerRow ? undefined : {
                    display: "flex",
                    marginBottom: 4,
                    marginLeft: gutterWidthPx,
                }}
            >
                {sortedDays.map((day) => (
                    <div
                        key={day}
                        className={classNames.dayHeader}
                        style={classNames.dayHeader ? undefined : {
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
            <div
                className={classNames.mainArea}
                style={classNames.mainArea ? undefined :
                    {display: "flex", height: "600px", overflowX: "auto", overflowY: "auto", padding: "10px"}}>
                {/* Time scale */}
                <div
                    className={classNames.timeScaleGutter}
                    style={classNames.timeScaleGutter ? undefined : {
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
                            className={classNames.timeLabel}
                            style={classNames.timeLabel ? undefined : {
                                position: "absolute",
                                left: 0,
                                transform: "translateY(-50%)",
                                top: idx * 60 * pxPerMinute,
                                fontSize: 11,
                                color: "#6b7280",
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Day lanes */}
                <div
                    className={classNames.lanesContainer}
                    style={classNames.lanesContainer ? undefined : {display: "flex", flex: 1}}>
                    {sortedDays.map((day) => {
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
                className={classNames.footerNote}
                style={classNames.footerNote ? undefined : {
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
