import React, {useState} from "react";
import {TimeWindow} from "./types.js";
import {clamp, minutesToTime, timeToDate, timeToMinutes} from "./utils.js";
import {Rnd} from "react-rnd";
import {Modal} from "./Modal.js";

export interface DayLaneProps {
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
    locale?: string
}

export const DayLane: React.FC<DayLaneProps> = ({
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
                                                    removeWindow,
                                                    locale = "en-US"
                                                }) => {


    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [startTimeInput, setStartTimeInput] = useState("");
    const [endTimeInput, setEndTimeInput] = useState("");

    const openModal = (index: number, startMinutes: number, endMinutes: number) => {
        setEditIndex(index);
        setStartTimeInput(minutesToTime(startMinutes).slice(0, 5));
        setEndTimeInput(minutesToTime(endMinutes).slice(0, 5));
        setIsModalOpen(true);
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setEditIndex(null);
    }

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editIndex === null) return;
        const startMinutes = timeToMinutes(startTimeInput);
        const endMinutes = timeToMinutes(endTimeInput);
        const start = clamp(startMinutes, dayStartMinutes, dayEndMinutes - minWindowMinutes);
        const end = clamp(endMinutes, start + minWindowMinutes, dayEndMinutes);
        updateWindow(editIndex, start, end);
        closeModal();
    }

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column", gap: 8, padding: 16}}>
                    <h3 style={{marginTop: 0, marginBottom: 8, fontSize: 14, fontWeight: 600}}>
                        Edit Time Window
                    </h3>

                    <label style={{display: "flex", flexDirection: "column", fontSize: 12}}>
                        Start time
                        <input
                            type="time"
                            value={startTimeInput}
                            onChange={(e) => setStartTimeInput(e.target.value)}
                            required
                        />
                    </label>

                    <label style={{display: "flex", flexDirection: "column", fontSize: 12}}>
                        End time
                        <input
                            type="time"
                            value={endTimeInput}
                            onChange={(e) => setEndTimeInput(e.target.value)}
                            required
                        />
                    </label>

                    <div style={{display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12}}>
                        <button type="button" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit">
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
            <div
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
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    openModal(index, clampedStart, clampedEnd)
                                }}
                            >
                                <div
                                    style={{
                                        padding: "2px 4px",
                                        fontSize: 10,
                                        fontWeight: 600,
                                    }}
                                >
                                    {new Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'}).format(timeToDate(window.startTime))} –
                                    {new Intl.DateTimeFormat(locale, {hour: 'numeric', minute: 'numeric'}).format(timeToDate(window.endTime))}
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

        </>
    );
}
