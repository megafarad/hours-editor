import type {TimeWindow} from "./types.js";

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

    layoutProps?: Partial<LayoutProps>;

    locale?: string;

}
