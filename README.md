# hours-editor

Two small React components for editing **daily and weekly opening hours**.

- There are two flavors: one for a single day (`DailyHoursEditor`), and another for weekly hours (`WeeklyHoursEditor`).
- For the DailyHoursEditor, there is one column.
- For WeeklyHoursEditor, the columns are **days of the week**
- Vertical axis is **time**
- Users create **time windows** by double-clicking in a day column
- Windows can be **dragged** and **resized** (powered by [`react-rnd`](https://github.com/bokuweb/react-rnd))
- Outputs a clean array of:

```ts
type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

interface WeeklyTimeWindow {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM:SS"
  endTime: string;   // "HH:MM:SS"
}

//Or...

interface DailyTimeWindow {
    startTime: string,
    endTime: string
}

````

Perfect for “business hours”, “support hours”, “call routing hours”, etc.

> **UX in one sentence:**
> Double-click to create a window, drag to move, resize to adjust, and you get `{ dayOfWeek, startTime, endTime }[]` out the other end.

---

## Install

```bash
npm install @sirhc77/hours-editor 
# or
yarn add @sirhc77/hours-editor react-rnd
# or
pnpm add @sirhc77/hours-editor react-rnd
```

The only peer dependency is `react` / `react-dom`.
`react-rnd` is a runtime dependency used internally for drag/resize.

---

## Quick start

```tsx
import React, { useState } from "react";
import {
  WeeklyHoursEditor,
  type WeeklyTimeWindow,
} from "@sirhc77/hours-editor";

export function HoursDemo() {
  const [windows, setWindows] = useState<WeeklyTimeWindow[]>([
    {
      dayOfWeek: "monday",
      startTime: "09:00:00",
      endTime: "17:00:00",
    },
  ]);

  return (
    <div style={{ padding: 16 }}>
      <WeeklyHoursEditor
        value={windows}
        onChange={setWindows}
        stepMinutes={30}
        dayStartHour={8}
        dayEndHour={20}
      />

      <pre style={{ marginTop: 16, fontSize: 11 }}>
        {JSON.stringify(windows, null, 2)}
      </pre>
    </div>
  );
}
```

**Interactions:**

* **Double-click** in a day column to create a new window.
* **Drag** the block vertically to move it earlier/later.
* **Resize** the block from the top/bottom to adjust duration.
* Click the small **“×”** in the block to remove it.

Times snap to `stepMinutes` boundaries and are constrained to `[dayStartHour, dayEndHour]`.

---

## Props

### For both `DailyHoursEditor` and `WeeklyHoursEditor`:


`stepMinutes?: number;`

* Snap size in minutes for drag/resize.
* Typical values: 30 (half hours), 60 (hours).
* Default: 30.


`minWindowMinutes?: number;`

* Minimum duration of a window, in minutes.
* Default: 30.

`defaultWindowMinutes?: number;`

* Default duration when creating a new window (on double-click), in minutes.
* Default: 60.

`dayStartHour?: number;`

* Start of the visible day (0–23).
* Example: 8 => 8:00 at the top.
* Default: 8.

`dayEndHour?: number;`

* End of the visible day (1–24).
* Example: 20 => 20:00 at the bottom.
* Default: 20.

```
layoutProps?: {
    pxPerMinute: number;
    laneWidthPx: number;
    gutterWidthPx: number;
}
```

* Customize the grid layout.
* `pxPerMinute` is the number of pixels per minute on the screen. Default: 1.
* `laneWidthPx` is the width of a day column. Default: 140
* `gutterWidthPx` is the width of the gutter between columns. Default: 40

`locale?: string;`

* Locale for time display.

### Additional properties for `DailyHoursEditor`:

`value: DailyTimeWindow[];`

Current list of open-hour windows. Controlled value.

`onChange: (value: DailyTimeWindow[]) => void;`

Called whenever the user changes the grid.

### Additional properties for `WeeklyHoursEditor`:

`value: WeeklyTimeWindow[];`

Current list of open-hour windows. Controlled value.

`onChange: (value: WeeklyTimeWindow[]) => void;`

Called whenever the user changes the grid.

`startOfWeek?: DayOfWeek;`

* First day of the week.

### Types

```ts
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WeeklyTimeWindow {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM:SS", 24h
  endTime: string;   // "HH:MM:SS", 24h
}

export interface DailyTimeWindow {
    startTime: string,
    endTime: string
}

```

---

## Time model & snapping

Internally, everything is done in **minutes since midnight** and then converted to `"HH:MM:SS"`.

* `dayStartHour` and `dayEndHour` define the **visible vertical range**.
* `stepMinutes` defines the **snap granularity** for:

    * drag (moving windows)
    * resize (changing window length)
    * initial placement on double-click
* When a window is dragged or resized:

    * Start/end times are **snapped** to the nearest multiple of `stepMinutes`.
    * Windows are **clamped** so they never go outside `[dayStartHour, dayEndHour]`.
    * There is always at least `minWindowMinutes` between `startTime` and `endTime`.

So if you use:

```tsx
<WeeklyHoursEditor
  value={...}
  onChange={...}
  stepMinutes={30}
  dayStartHour={9}
  dayEndHour={18}
/>
```

You’ll get windows aligned to 09:00, 09:30, 10:00, …, 18:00, and nothing outside that range.

---

## Using with Zod + React Hook Form

The component plays nicely with schemas like:

```ts
import { z } from "zod";

const TimeWindowSchema = z.object({
  dayOfWeek: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  startTime: z.string(), // or z.iso.time()
  endTime: z.string(),   // or z.iso.time()
});

const AddHourTypeCodeBodySchema = z.object({
  type: z.enum(["standard", "exception"]),
  timeZone: z.string(),
  effectiveDate: z.string(),              // or z.iso.datetime()
  effectiveUntil: z.string().optional(),  // or z.iso.datetime().optional()
  timeWindows: z.array(TimeWindowSchema),
});

type AddHourTypeCodeBody = z.infer<typeof AddHourTypeCodeBodySchema>;
```

Example form integration:

```tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  WeeklyHoursEditor,
  type TimeWindow,
} from "@megafarad/weekly-hours-editor";
import { AddHourTypeCodeBodySchema } from "./schemas";

type FormValues = AddHourTypeCodeBody;

export function HourTypeCodeForm() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(AddHourTypeCodeBodySchema),
    defaultValues: {
      type: "standard",
      timeZone: "America/New_York",
      effectiveDate: "",
      effectiveUntil: undefined,
      timeWindows: [],
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Payload:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Your other fields here */}
      <div>
        <label>Time zone</label>
        <input {...register("timeZone")} />
        {errors.timeZone && <p>{errors.timeZone.message}</p>}
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 4 }}>
          Weekly hours
        </label>
        <Controller
          name="timeWindows"
          control={control}
          render={({ field }) => (
            <WeeklyHoursEditor
              value={field.value as TimeWindow[]}
              onChange={field.onChange}
              stepMinutes={30}
              dayStartHour={8}
              dayEndHour={20}
            />
          )}
        />
        {errors.timeWindows && (
          <p style={{ color: "red", fontSize: 12 }}>
            {Array.isArray(errors.timeWindows)
              ? "One or more time windows are invalid."
              : (errors.timeWindows.message as string)}
          </p>
        )}
      </div>

      <button type="submit" style={{ marginTop: 16 }}>
        Save
      </button>
    </form>
  );
}
```

Since `WeeklyHoursEditor` is controlled via `value` / `onChange`, `react-hook-form` just sees it as another field containing an array of `TimeWindow`.

---

## Styling & theming

By default the component:

* Uses **inline styles** for layout (no CSS or Tailwind required).
* Tries to be visually neutral: white background, light gray lines, blue blocks.

If you want to theme it:

* Wrap it in a container with your own fonts/colors.
* Fork or wrap the component to add custom styles to:

    * day headers
    * blocks
    * grid lines / gutter

A future version might expose a `renderWindow` or `className`-style hooks for deeper customization.

---

## Limitations / roadmap

Current v0 is intentionally small:

* One “kind” of window (all blue). No types/labels per window yet.
* No keyboard navigation.
* No multi-select editing or copy/paste (e.g. copy Monday → Friday).
* No localization for the time scale (just `HH:00` text).

Nice future ideas:

* `renderWindow` prop for custom block content (labels, icons, etc.).
* `onCreateWindow` / `onDeleteWindow` callbacks for custom confirmation logic.
* Optional `disabled` mode (read-only weekly hours view).
* 30-minute grid by default, with optional 15-minute support.

---

## License

MIT 

