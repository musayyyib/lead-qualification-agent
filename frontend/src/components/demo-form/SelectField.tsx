import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { FieldShell } from './FieldShell';
import { inputClasses } from '../../utils/fieldStyles';

interface SelectFieldProps {
  name: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  error?: string;
  className?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function SelectField({ name, label, value, options, placeholder, error, className, onChange, onBlur }: SelectFieldProps) {
  const id = `field-${name}`;
  const hasError = Boolean(error);

  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          required
          aria-required="true"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={inputClasses(hasError, `h-11 cursor-pointer appearance-none pl-3 pr-9 lg:h-10 tall:h-11 tall:pl-3.5 ${value ? '' : 'text-ink-400'}`)}>
          
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) =>
          <option key={option} value={option} className="text-ink-900">
              {option}
            </option>
          )}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          aria-hidden="true" />
        
      </div>
    </FieldShell>);

}