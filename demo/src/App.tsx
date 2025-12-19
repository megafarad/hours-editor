import {useState} from "react";
import {type WeeklyTimeWindow, type DailyTimeWindow, WeeklyHoursEditor} from "@sirhc77/hours-editor";
import './App.css';
import {DailyHoursEditor} from "../../src";

type AppMode = "weekly" | "daily";

function App() {

    const [weeklyValue, setWeeklyValue] = useState<WeeklyTimeWindow[]>([]);
    const [dailyValue, setDailyValue] = useState<DailyTimeWindow[]>([]);
    const [mode, setMode] = useState<AppMode>("weekly");

    return (
        <div className="App">
            <header className="App-header">
                <h1>Hours Editor Demo</h1>
                <button onClick={() => setMode(mode === "weekly" ? "daily" : "weekly")}>Switch mode</button>
            </header>
            {mode === "weekly" && (
                <WeeklyHoursEditor value={weeklyValue} onChange={setWeeklyValue} dayStartHour={0} dayEndHour={24} startOfWeek='sunday' layoutProps={{pxPerMinute: .65, laneWidthPx: 80, gutterWidthPx: 40}}/>
            )}
            {mode === "daily" && (
                <DailyHoursEditor value={dailyValue} onChange={setDailyValue} dayStartHour={0} dayEndHour={24} layoutProps={{pxPerMinute: .65, laneWidthPx: 80, gutterWidthPx: 40}}/>
            )}
        </div>
   )
}

export default App
