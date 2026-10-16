import React from 'react';
import type { ReactNode } from 'react';
import { AlertCircleIcon } from 'lucide-react';

interface FieldShellProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, optional, error, className = '', children }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink-800">
        {label}
        {optional && <span className="font-normal text-ink-500"> (optional)</span>}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>);

}

export function FieldError({ id, message }: {id: string;message: string;}) {
  return (
    <p id={id} className="mt-1 flex items-center gap-1 text-[12px] font-medium text-danger-600">
      <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>);

}