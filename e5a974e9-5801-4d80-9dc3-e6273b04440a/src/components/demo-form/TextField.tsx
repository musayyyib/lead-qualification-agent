import React from 'react';
import { FieldShell } from './FieldShell';
import { compositeInputClasses, inputClasses } from '../../utils/fieldStyles';

interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: 'text' | 'email';
  autoComplete?: string;
  prefix?: string;
  inputMode?: 'text' | 'email' | 'url';
  error?: string;
  className?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function TextField({
  name,
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  prefix,
  inputMode,
  error,
  className,
  onChange,
  onBlur
}: TextFieldProps) {
  const id = `field-${name}`;
  const hasError = Boolean(error);
  const shared = {
    id,
    name,
    type,
    value,
    placeholder,
    autoComplete,
    inputMode,
    required: true,
    'aria-required': true,
    'aria-invalid': hasError,
    'aria-describedby': hasError ? `${id}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    onBlur
  };

  return (
    <FieldShell id={id} label={label} error={error} className={className}>
      {prefix ?
      <div className={compositeInputClasses(hasError)}>
          <span className="flex select-none items-center border-r border-line bg-canvas px-3 text-base text-ink-500 lg:text-sm" aria-hidden="true">
            {prefix}
          </span>
          <input
          {...shared}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none lg:h-10 lg:text-sm" />
        
        </div> :

      <input {...shared} className={inputClasses(hasError, 'h-11 px-3 lg:h-10')} />
      }
    </FieldShell>);

}