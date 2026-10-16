import React from 'react';
import { CheckIcon } from 'lucide-react';
import { crmOptions } from '../../data/demoForm';

interface CrmChipsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CrmChips({ value, onChange, className = '' }: CrmChipsProps) {
  return (
    <fieldset className={className}>
      <legend className="mb-1 block text-[13px] font-medium text-ink-800">
        Current CRM <span className="font-normal text-ink-500">(optional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {crmOptions.map((option) => {
          const selected = value === option;
          return (
            <label key={option} className="relative cursor-pointer">
              <input
                type="radio"
                name="crm"
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="peer sr-only" />
              
              <span
                className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 ease-out peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 lg:h-8 lg:text-[13px] ${
                selected ?
                'border-brand-500 bg-brand-50 text-brand-700' :
                'border-line-strong bg-surface text-ink-700 hover:border-ink-400 hover:text-ink-900'}`
                }>
                
                {selected && <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                {option}
              </span>
            </label>);

        })}
      </div>
    </fieldset>);

}