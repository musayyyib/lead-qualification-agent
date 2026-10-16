const base =
'w-full rounded-[10px] border bg-surface text-base text-ink-900 shadow-xs placeholder:text-ink-400 transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:ring-4 lg:text-sm tall:text-[15px]';

const valid = 'border-line-strong hover:border-ink-400 focus:border-brand-500 focus:ring-brand-500/15';
const invalid = 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/15';

export function inputClasses(hasError: boolean, extra = ''): string {
  return `${base} ${hasError ? invalid : valid} ${extra}`.trim();
}

/** Wrapper styles for composite inputs (e.g. prefixed website field) that rely on focus-within. */
export function compositeInputClasses(hasError: boolean): string {
  const state = hasError ?
  'border-danger-500 focus-within:ring-danger-500/15' :
  'border-line-strong hover:border-ink-400 focus-within:border-brand-500 focus-within:ring-brand-500/15';
  return `flex w-full overflow-hidden rounded-[10px] border bg-surface shadow-xs transition-[border-color,box-shadow] duration-150 ease-out focus-within:ring-4 ${state}`;
}