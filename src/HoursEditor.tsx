import type {TimeWindow} from "./types.js";

export interface BaseHoursEditorProps {

    value: TimeWindow[];
    onChange: (value: TimeWindow[]) => void;

    stepMinutes?: number;

    minWindowMinutes?: number;
    defaultWindowMinutes?: number;

    dayStartHour?: number;
    dayEndHour?: number;

}
