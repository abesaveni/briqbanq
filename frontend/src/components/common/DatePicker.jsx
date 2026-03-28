import React, { forwardRef, useState, useEffect, useRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

const DatePicker = forwardRef(({ 
  value, 
  onChange, 
  placeholderText = "MM/DD/YYYY", 
  className = "", 
  disabled = false,
  minDate = null,
  maxDate = null,
  ...props 
}, ref) => {

  const parsedValueDate = value ? parse(value, 'MM/dd/yyyy', new Date()) : null;
  const validValueDate = parsedValueDate && isValid(parsedValueDate) ? parsedValueDate : null;

  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(validValueDate || new Date()); // Default to today if null for display purposes
  const [inputValue, setInputValue] = useState(value || '');
  const [placement, setPlacement] = useState('top');
  
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value !== inputValue && !isOpen) {
      setInputValue(value || '');
      setTempDate(validValueDate || new Date());
    }
  }, [value, isOpen, validValueDate, inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const calendarHeight = 420; // approximate height of the datepicker popup
      setPlacement(rect.top >= calendarHeight ? 'top' : 'bottom');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen) {
          setTempDate(validValueDate || new Date());
          setInputValue(validValueDate ? format(validValueDate, 'MM/dd/yyyy') : '');
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, validValueDate]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parse(val, 'MM/dd/yyyy', new Date());
    if (isValid(parsed)) {
      setTempDate(parsed);
      if (onChange) onChange(val, parsed);
    } else {
      if (onChange) onChange(val, null);
    }
  };

  const handleCalendarSelect = (date) => {
    setTempDate(date);
    // Wait for OK to confirm to parent
  };

  const handleOk = () => {
    if (tempDate && isValid(tempDate)) {
      const formatted = format(tempDate, 'MM/dd/yyyy');
      setInputValue(formatted);
      if (onChange) onChange(formatted, tempDate);
    } else {
      setInputValue('');
      if (onChange) onChange('', null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(validValueDate || new Date());
    setInputValue(value || '');
    setIsOpen(false);
  };
  
  const handleClear = () => {
    setTempDate(new Date());
    setInputValue('');
    if (onChange) onChange('', null);
    setIsOpen(false);
  };

  const onInputFocus = () => {
    if (!disabled) setIsOpen(true);
  };

  const CustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const handlePrevYear = () => changeYear(date.getFullYear() - 1);
    const handleNextYear = () => changeYear(date.getFullYear() + 1);

    return (
      <div className="w-full px-1 pt-2 pb-1">
        <div className="flex justify-between items-center w-[224px] mx-auto">
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded transition-colors disabled:opacity-30 cursor-pointer text-slate-500 text-xs"
            type="button"
          >
            &#10094;
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-700">{format(date, 'MMMM')}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={handlePrevYear} className="w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded cursor-pointer text-slate-400 text-[10px]" type="button">&#10094;</button>
              <span className="text-xs font-semibold text-slate-700 w-8 text-center">{format(date, 'yyyy')}</span>
              <button onClick={handleNextYear} className="w-4 h-4 flex items-center justify-center hover:bg-slate-100 rounded cursor-pointer text-slate-400 text-[10px]" type="button">&#10095;</button>
            </div>
          </div>
          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded transition-colors disabled:opacity-30 cursor-pointer text-slate-500 text-xs"
            type="button"
          >
            &#10095;
          </button>
        </div>
      </div>
    );
  };

  const defaultClassName = "w-full border border-slate-300 rounded-md py-2 pl-10 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#33A8A0] focus:border-[#33A8A0] disabled:bg-slate-50 disabled:text-slate-500";
  const isError = className.includes('border-red-500');
  const baseClassName = isError 
    ? "w-full border border-red-500 ring-1 ring-red-500 rounded-md py-2 pl-10 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-500"
    : defaultClassName;
  const finalClassName = className.includes('w-full') && !isError ? className + " pl-10" : `${baseClassName} ${className.replace(/w-full|border-slate-300|rounded-md|px-3|py-2\.*?|text-sm|bg-white/g, '').trim()}`;

  const isValueValid = validValueDate && isValid(validValueDate);
  const displayDate = isValid(tempDate) ? tempDate : (isValueValid ? validValueDate : new Date());

  // Inject scoped CSS strictly targeting our wrapper to kill any Tailwind interference
  const scopedCss = `
    .exact-dp-wrapper .react-datepicker {
      border: none !important;
      background: transparent !important;
      font-family: inherit !important;
    }
    .exact-dp-wrapper .react-datepicker__header {
      background: transparent !important;
      border-bottom: none !important;
      padding: 0 !important;
    }
    .exact-dp-wrapper .react-datepicker__month-container {
      width: 100% !important;
      float: none !important;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .exact-dp-wrapper .react-datepicker__day-names {
      display: flex !important;
      justify-content: space-between !important;
      width: 224px !important;
      margin: 0 auto !important;
      margin-top: 6px !important;
    }
    .exact-dp-wrapper .react-datepicker__day-name {
      color: #33A8A0 !important;
      font-weight: 500 !important;
      font-size: 11px !important;
      width: 32px !important;
      margin: 0 !important;
      text-transform: uppercase;
    }
    .exact-dp-wrapper .react-datepicker__month {
      margin: 0 !important;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .exact-dp-wrapper .react-datepicker__week {
      display: flex !important;
      justify-content: space-between !important;
      width: 224px !important;
    }
    .exact-dp-wrapper .react-datepicker__day {
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 1px 0 !important;
      font-size: 12px !important;
      color: #444 !important;
      font-weight: 500 !important;
      border: none !important;
      background: transparent !important;
      outline: none !important;
    }
    .exact-dp-wrapper .react-datepicker__day:hover {
      background: #f0f0f0 !important;
      border-radius: 4px !important;
    }
    .exact-dp-wrapper .react-datepicker__day--selected {
      background: #33A8A0 !important;
      color: #fff !important;
      border-radius: 4px !important;
    }
    .exact-dp-wrapper .react-datepicker__day--today {
      font-weight: 700 !important;
      color: #33A8A0 !important;
    }
    .exact-dp-wrapper .react-datepicker__day--selected.react-datepicker__day--today {
      color: #fff !important;
    }
    .exact-dp-wrapper .react-datepicker__day--outside-month {
      opacity: 0.35 !important;
    }
  `;

  return (
    <div className="relative w-full material-datepicker-wrapper inline-block" ref={wrapperRef}>
      <style>{scopedCss}</style>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Calendar className={`h-4 w-4 ${disabled ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={onInputFocus}
        onClick={onInputFocus}
        placeholder={placeholderText}
        className={finalClassName}
        disabled={disabled}
        ref={ref}
        {...props}
      />

      {isOpen && !disabled && (
        <div
          className="absolute z-[9999]"
          style={{
             ...(placement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }),
             left: 0
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200 font-sans" style={{ width: '256px' }}>
            {/* Compact header strip */}
            <div className="bg-[#33A8A0] px-3 py-2 text-white text-center">
              <div className="text-xs font-medium opacity-80">{format(displayDate, 'EEEE')}</div>
              <div className="text-lg font-bold leading-tight">
                {format(displayDate, 'd')} {format(displayDate, 'MMMM yyyy')}
              </div>
            </div>

            {/* Calendar grid */}
            <div className="exact-dp-wrapper px-2 pt-1 pb-0">
              <ReactDatePicker
                inline
                selected={tempDate}
                onChange={handleCalendarSelect}
                minDate={minDate}
                maxDate={maxDate}
                renderCustomHeader={CustomHeader}
                formatWeekDay={nameOfDay => nameOfDay.substring(0, 1)}
              />
            </div>

            {/* Action footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-2 py-1 rounded transition-colors uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOk}
                  className="text-xs font-semibold text-white bg-[#33A8A0] hover:bg-[#2D8E87] px-3 py-1 rounded transition-colors uppercase"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
