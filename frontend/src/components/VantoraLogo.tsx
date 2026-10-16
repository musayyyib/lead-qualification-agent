import React from 'react';

export function VantoraLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <rect width="28" height="28" rx="8" className="fill-brand-600" />
        <path d="M7.5 8.5 L12.6 19.5 L14 19.5 L10.4 8.5 Z" fill="#fff" fillOpacity="0.55" />
        <path d="M20.5 8.5 L15.4 19.5 L12.6 19.5 L17.6 8.5 Z" fill="#fff" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink-900">Vantora</span>
    </span>);

}