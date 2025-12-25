export const dayOfWeekOptions = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
] as const;


export type DayOfWeek = typeof dayOfWeekOptions[number];

export interface DailyTimeWindow {
    startTime: string,
    endTime: string
}

export interface WeeklyTimeWindow extends DailyTimeWindow {
    dayOfWeek: DayOfWeek;
}

export type TimeWindow = DailyTimeWindow | WeeklyTimeWindow;

export interface LayoutProps {
    pxPerMinute: number;
    laneWidthPx: number;
    gutterWidthPx: number;
}

export interface BaseHoursEditorProps {

    value: TimeWindow[];
    onChange: (value: TimeWindow[]) => void;

    stepMinutes?: number;

    minWindowMinutes?: number;
    defaultWindowMinutes?: number;

    dayStartHour?: number;
    dayEndHour?: number;

    layoutProps?: LayoutProps;

    locale?: string;

}

export interface BaseHoursEditorClassNames {
    container?: string;
    headerRow?: string;
    mainArea?: string;
    timeScaleGutter?: string;
    timeLabel?: string;
    lanesContainer?: string;
    footerNote?: string;
}
