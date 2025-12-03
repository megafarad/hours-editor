import {useState} from "react";
import {type WeeklyTimeWindow, WeeklyHoursEditor} from "@sirhc77/hours-editor";
import './App.css';

function App() {

    const [value, setValue] = useState<WeeklyTimeWindow[]>([]);

    return (
        <WeeklyHoursEditor value={value} onChange={setValue}/>
   )
}

export default App
