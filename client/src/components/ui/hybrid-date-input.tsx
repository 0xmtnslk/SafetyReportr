import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HybridDateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  "data-testid"?: string;
}

export function HybridDateInput({
  value,
  onChange,
  placeholder = "GG/AA/YYYY formatında yazın",
  disabled = false,
  minDate,
  maxDate,
  required = false,
  "data-testid": testId,
}: HybridDateInputProps) {
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy") : ""
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Update input when value changes
  useEffect(() => {
    setInputValue(value ? format(value, "dd/MM/yyyy") : "");
  }, [value]);

  const parseDate = (dateStr: string): Date | null => {
    try {
      // Try parsing DD/MM/YYYY format
      if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Try parsing DD.MM.YYYY format
      if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const parsed = parse(dateStr, "dd.MM.yyyy", new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Try parsing DD-MM-YYYY format
      if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const parsed = parse(dateStr, "dd-MM-yyyy", new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue === "") {
      onChange(undefined);
      return;
    }

    const parsedDate = parseDate(newValue);
    if (parsedDate) {
      // Check date bounds
      if (minDate && parsedDate < minDate) return;
      if (maxDate && parsedDate > maxDate) return;
      
      onChange(parsedDate);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testId}
        className="flex-1"
      />
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}