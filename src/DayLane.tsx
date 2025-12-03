import React from "react";
import {TimeWindow} from "./types.js";
import {clamp, timeToMinutes} from "./utils.js";
import {Rnd} from "react-rnd";

export interface DayLaneProps {
    key?: string,
    windows: { window: TimeWindow, index: number }[]
    pxPerMinute: number,
    laneWidthPx: number,
    dayStartMinutes: number,
    dayEndMinutes: number,
    dayMinutesSpan: number,
    minWindowMinutes: number,
    laneHeightPx: number,
    updateWindow: (index: number, newStartMinutes: number, newEndMinutes: number) => void,
    createWindow: (rawMinutesFromDayStart: number) => void,
    removeWindow: (index: number) => void,
}

export const DayLane: React.FC<DayLaneProps> = ({
                                                    key,
                                                    windows,
                                                    pxPerMinute,
                                                    laneWidthPx,
                                                    dayStartMinutes,
                                                    dayEndMinutes,
                                                    dayMinutesSpan,
                                                    minWindowMinutes,
                                                    laneHeightPx,
                                                    updateWindow,
                                                    createWindow,
                                                    removeWindow
                                                }) => {

    const handleLaneDoubleClick: React.MouseEventHandler<HTMLDivElement> =
        (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutesFromDayStart = y / pxPerMinute;
            const clampedOffset = clamp(
                minutesFromDayStart,
                0,
                dayMinutesSpan
            );
            createWindow(clampedOffset);
        };

    return (
        <div
            key={key}
            style={{
                position: "relative",
                width: laneWidthPx,
                height: laneHeightPx,
                borderRight: "1px solid #e5e7eb",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
            }}
            onDoubleClick={handleLaneDoubleClick}
        >
            {/* Hour grid lines */}
            {Array.from(
                {
                    length:
                        (dayEndMinutes - dayStartMinutes) / 60,
                },
                (_, h) => {
                    const top = h * 60 * pxPerMinute;
                    return (
                        <div
                            key={h}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top,
                                borderTop: "1px dotted #e5e7eb",
                                boxSizing: "border-box",
                            }}
                        />
                    );
                }
            )}

            {/* Time windows for this day */}
            {windows.map(({window, index}) => {
                const startM = timeToMinutes(window.startTime);
                const endM = timeToMinutes(window.endTime);
                const clampedStart = clamp(
                    startM,
                    dayStartMinutes,
                    dayEndMinutes
                );
                const clampedEnd = clamp(
                    endM,
                    clampedStart + 1,
                    dayEndMinutes
                );

                const topMinutes = clampedStart - dayStartMinutes;
                const durationMinutes = clampedEnd - clampedStart;
                const heightPx = Math.max(
                    durationMinutes * pxPerMinute,
                    minWindowMinutes * pxPerMinute
                );
                const yPx = topMinutes * pxPerMinute;

                return (
                    <Rnd
                        key={index}
                        bounds="parent"
                        size={{
                            width: laneWidthPx - 8,
                            height: heightPx,
                        }}
                        position={{x: 4, y: yPx}}
                        enableResizing={{
                            top: true,
                            bottom: true,
                            left: false,
                            right: false,
                            topLeft: false,
                            topRight: false,
                            bottomLeft: false,
                            bottomRight: false,
                        }}
                        dragAxis="y"
                        onDragStop={(_, data) => {
                            const newStartMinutes =
                                dayStartMinutes + data.y / pxPerMinute;
                            const newEndMinutes =
                                dayStartMinutes +
                                (data.y + heightPx) / pxPerMinute;
                            updateWindow(
                                index,
                                newStartMinutes,
                                newEndMinutes
                            );
                        }}
                        onResizeStop={(
                            _,
                            __,
                            ref,
                            ___,
                            position
                        ) => {
                            const newHeight = ref.offsetHeight;
                            const newStartMinutes =
                                dayStartMinutes + position.y / pxPerMinute;
                            const newEndMinutes =
                                dayStartMinutes +
                                (position.y + newHeight) / pxPerMinute;
                            updateWindow(
                                index,
                                newStartMinutes,
                                newEndMinutes
                            );
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: "100%",
                                backgroundColor: "rgba(37, 99, 235, 0.85)",
                                color: "#ffffff",
                                borderRadius: 4,
                                boxShadow:
                                    "0 1px 3px rgba(0,0,0,0.2)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxSizing: "border-box",
                            }}
                        >
                            <div
                                style={{
                                    padding: "2px 4px",
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                            >
                                {window.startTime.slice(0, 5)}–
                                {window.endTime.slice(0, 5)}
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeWindow(index);
                                }}
                                style={{
                                    alignSelf: "flex-end",
                                    border: "none",
                                    background: "transparent",
                                    color: "#e5e7eb",
                                    fontSize: 10,
                                    padding: "0 4px 2px",
                                    cursor: "pointer",
                                }}
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    </Rnd>
                );
            })}
        </div>
    );
}
