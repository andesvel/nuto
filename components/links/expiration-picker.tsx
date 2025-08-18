import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon } from "lucide-react";
import {
  setHours,
  setMinutes,
  isBefore,
  startOfToday,
  isSameDay,
} from "date-fns";

interface ExpirationPickerProps {
  name?: string;
  enabled: boolean;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  onToggle?: (next: boolean) => void;
  minDate?: Date;
  maxDate?: Date;
  timeStepSeconds?: number;
}

export function ExpirationPicker({
  name = "expiresAt",
  enabled,
  value,
  onChange,
  minDate = new Date(),
  maxDate = new Date(2027, 11),
  timeStepSeconds = 60,
}: ExpirationPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState(() =>
    value ? value.toTimeString().slice(0, 5) : "23:59"
  );
  minDate = new Date();
  const today = startOfToday();

  // Sync internal time if parent value changes (edit mode)
  React.useEffect(() => {
    if (value) {
      const hh = String(value.getHours()).padStart(2, "0");
      const mm = String(value.getMinutes()).padStart(2, "0");
      const newTime = `${hh}:${mm}`;
      if (newTime !== timeValue) setTimeValue(newTime);
    }
  }, [value]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
      return;
    }

    if (isBefore(day, today)) return;

    const [h, m] = timeValue.split(":").map((n) => parseInt(n, 10));
    let withTime = setHours(setMinutes(day, m), h);

    if (isSameDay(withTime, new Date()) && isBefore(withTime, new Date())) {
      const now = new Date();
      now.setSeconds(0, 0);
      withTime = now;
      // sincroniza timeValue con la hora ajustada
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      setTimeValue(`${hh}:${mm}`);
    }

    onChange(withTime);
    setOpen(false);
  };

  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    if (value) {
      const [h, m] = newTime.split(":").map((n) => parseInt(n, 10));
      onChange(setHours(setMinutes(value, m), h));
    }
  };

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={enabled && value ? value.toISOString() : ""}
      />
      {enabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="w-full justify-between font-normal"
            >
              {value ? value.toLocaleString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              showOutsideDays
              mode="single"
              captionLayout="dropdown"
              startMonth={minDate}
              endMonth={maxDate}
              selected={value}
              onSelect={handleDaySelect}
              disabled={{ before: today }}
            />
            <div className="px-4 pb-4 flex gap-2 items-center justify-center">
              <Label htmlFor="time-picker" className="grow">
                Time
              </Label>
              <Input
                id="time-picker"
                type="time"
                step={timeStepSeconds}
                value={timeValue}
                onChange={handleTimeChange}
                className="mx-auto w-fit appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
