import React, {useMemo} from "react";
import type {BaseHoursEditorClassNames, BaseHoursEditorProps, DailyTimeWindow} from "./types.js";
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

    classNames?: BaseHoursEditorClassNames;
}

export const DailyHoursEditor: React.FC<DailyHoursEditorProps> = ({
                                                                      value,
                                                                      onChange,
                                                                      stepMinutes = 30,
                                                                      dayStartHour = 8,
                                                                      dayEndHour = 20,
                                                                      minWindowMinutes = 30,
                                                                      defaultWindowMinutes = 60,
                                                                      layoutProps,
                                                                      locale = "en-US",
                                                                      classNames = {}
                                                                  }) => {

    // Layout config
    const pxPerMinute = layoutProps?.pxPerMinute ?? 1;             // vertical scale
    const laneWidthPx = layoutProps?.laneWidthPx ?? 140;           // width of the day lane
    const gutterWidthPx = layoutProps?.gutterWidthPx ?? 40;          // left time-gutter width

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

    const timeScaleLabels: string[] = []

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

                {/* Day lane */}
                <div
                    className={classNames.lanesContainer}
                    style={classNames.lanesContainer ? undefined : {display: "flex"}}>
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
