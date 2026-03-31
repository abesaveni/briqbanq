import React, { useState, forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import clsx from 'clsx';
import "react-datepicker/dist/react-datepicker.css";
import './GlobalDatePicker.css';

/**
 * GlobalDatePicker - A reusable desktop-style date picker component.
 * 
 * @param {string|Date} value - The current date value.
 * @param {function} onChange - Callback triggered when the date changes.
 * @param {string} placeholder - Input placeholder (default: MM/DD/YYYY).
 * @param {boolean} required - Whether the field is required.
 * @param {string} name - Input name attribute.
 * @param {string} className - Container class name.
 * @param {string} inputClassName - Input field class name.
 */
const GlobalDatePicker = ({
  value,
  onChange,
  placeholder = "MM/DD/YYYY",
  required = false,
  name,
  className = '',
  inputClassName = '',
  minDate,
  maxDate,
  ...rest
}) => {
  // Handle value conversion: react-datepicker needs a Date object
  const dateValue = typeof value === 'string' && value 
    ? (isValid(new Date(value)) ? new Date(value) : null)
    : value instanceof Date ? value : null;

  const handleChange = (date) => {
    if (onChange) {
      // Create a synthetic event or just pass the value if the parent expects that
      // Most of our forms use e.target.value. We'll pass a formatted string to maintain compatibility.
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
      onChange({
        target: {
          name,
          value: formattedDate
        }
      });
    }
  };

  const CustomInput = forwardRef(({ value, onClick, onChange: onInputChange }, ref) => (
    <div className={clsx("relative inline-block w-full text-slate-600", className)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <CalendarIcon size={16} className="text-gray-400" />
      </div>
      <input
        ref={ref}
        type="text"
        name={name}
        value={value}
        onClick={onClick}
        onChange={onInputChange}
        placeholder={placeholder}
        required={required}
        className={clsx(
          "w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm font-medium",
          "outline-none transition-all shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-300",
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
          inputClassName
        )}
        {...rest}
      />
    </div>
  ));

  return (
    <ReactDatePicker
      selected={dateValue}
      onChange={handleChange}
      dateFormat="MM/dd/yyyy"
      placeholderText={placeholder}
      required={required}
      minDate={minDate}
      maxDate={maxDate}
      customInput={<CustomInput />}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-3 py-3 bg-[#f3f4f6] border-b border-gray-300">
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50 text-gray-700 shadow-sm border border-gray-400"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <div className="text-lg font-bold text-gray-800 tracking-tight">
            {format(date, 'MMMM yyyy')}
          </div>
          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors disabled:opacity-50 text-gray-700 shadow-sm border border-gray-400"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      )}
      popperPlacement="bottom-start"
      popperProps={{ strategy: 'fixed' }}
      popperModifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 8],
          },
        },
      ]}
      showPopperArrow={false}
    />
  );
};

export default GlobalDatePicker;
