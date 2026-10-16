import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDaysIcon, MailIcon, RotateCcwIcon, ScanSearchIcon } from 'lucide-react';

interface DemoSuccessProps {
  firstName: string;
  email: string;
  referenceId: string;
  autoFocus: boolean;
  onReset: () => void;
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function DemoSuccess({ firstName, email, referenceId, autoFocus, onReset }: DemoSuccessProps) {
  const reduce = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  const steps = [
  {
    icon: MailIcon,
    title: 'Check your inbox',
    body:
    <>
          We've sent a confirmation to <span className="font-medium text-ink-900 break-all">{email}</span>.
        </>

  },
  {
    icon: ScanSearchIcon,
    title: 'We review your stack',
    body: 'A solutions engineer looks at your CRM and pipeline setup before you meet.'
  },
  {
    icon: CalendarDaysIcon,
    title: 'Pick a time that works',
    body: "You'll get a calendar link for a 30-minute demo tailored to your team."
  }];


  return (
    <div className="p-6 sm:p-8" aria-live="polite">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: EASE }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
        
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-success-600" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.14, ease: EASE }} />
          
        </svg>
      </motion.div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-ink-950 focus:outline-none">
        
        Thanks, {firstName || 'there'}. You're all set.
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
        Your demo request is in. Here's what happens next.
      </p>

      <ol className="mt-7">
        {steps.map(({ icon: Icon, title, body }, index) =>
        <motion.li
          key={title}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.2 + index * 0.05, ease: EASE }}
          className="relative flex gap-4 pb-6 last:pb-0">
          
            {index < steps.length - 1 &&
          <span className="absolute left-[17px] top-10 h-[calc(100%-44px)] w-px bg-line" aria-hidden="true" />
          }
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-brand-600 shadow-xs">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-ink-900">
                <span className="sr-only">Step {index + 1}: </span>
                {title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{body}</p>
            </div>
          </motion.li>
        )}
      </ol>

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] text-ink-600">
          Reference ID
          <span className="font-mono text-[12px] font-medium text-ink-900 tabular-nums">{referenceId}</span>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md text-sm font-medium text-brand-700 transition-colors duration-150 ease-out hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:min-h-0">
          
          <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Submit another request
        </button>
      </div>
    </div>);

}