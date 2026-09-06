import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatToDDMMYYYY, parseDateParts, isValidDDMMYYYY } from '../../utils/dateUtils';

interface CustomDatePickerProps {
  value: string; // Accepts DD/MM/YYYY, YYYY-MM-DD, etc.
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current date value
  const parsed = parseDateParts(value);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Calendar viewport (month & year being viewed)
  const [viewYear, setViewYear] = useState<number>(parsed?.year || currentYear);
  const [viewMonth, setViewMonth] = useState<number>(parsed?.month || currentMonth);

  // Sync view when opened or value changes
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Local text representation
  const displayValue = formatToDDMMYYYY(value);
  const [textInput, setTextInput] = useState<string>(displayValue);

  useEffect(() => {
    setTextInput(formatToDDMMYYYY(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleInputBlur = () => {
    if (!textInput.trim()) {
      onChange('');
      return;
    }
    const formatted = formatToDDMMYYYY(textInput);
    if (formatted && isValidDDMMYYYY(formatted)) {
      setTextInput(formatted);
      onChange(formatted);
    } else {
      // Revert if invalid
      setTextInput(formatToDDMMYYYY(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  // Monday as first day (0: Mon, 1: Tue, ..., 6: Sun)
  const firstDayOfWeek = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDate = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth).padStart(2, '0');
    const yyyy = viewYear;
    const formatted = `${dd}/${mm}/${yyyy}`;
    setTextInput(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const selectToday = () => {
    const dd = String(currentDay).padStart(2, '0');
    const mm = String(currentMonth).padStart(2, '0');
    const yyyy = currentYear;
    const formatted = `${dd}/${mm}/${yyyy}`;
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setTextInput(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Input container */}
      <div className="flex items-center relative">
        <input
          type="text"
          value={textInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`bg-surface-container-lowest px-2.5 py-1 pr-7 rounded-md border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary/70 transition-colors w-[115px] font-mono ${className}`}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          title="Chọn ngày từ lịch"
          className="absolute right-1 text-outline hover:text-primary transition-colors p-1 cursor-pointer disabled:opacity-50"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl p-3 select-none animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-on-surface">
              Tháng {viewMonth} / {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {weekdays.map((w, idx) => (
              <span
                key={w}
                className={`text-[10px] font-bold ${
                  idx >= 5 ? 'text-rose-500' : 'text-outline'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-7 h-7" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                parsed &&
                parsed.day === day &&
                parsed.month === viewMonth &&
                parsed.year === viewYear;
              const isToday =
                day === currentDay &&
                viewMonth === currentMonth &&
                viewYear === currentYear;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : isToday
                      ? 'border border-primary/50 text-primary font-bold hover:bg-primary/10'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            <button
              type="button"
              onClick={selectToday}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Hôm nay ({String(currentDay).padStart(2, '0')}/{String(currentMonth).padStart(2, '0')}/{currentYear})
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-outline hover:text-on-surface cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
