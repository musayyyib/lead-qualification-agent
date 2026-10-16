import React from 'react';

export function PitchIntro() {
  return (
    <div className="max-w-[600px]">
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-2 pr-3 text-[13px] font-medium text-ink-700 shadow-xs">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success-600 opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success-600" />
        </span>
        Live demo <span className="text-ink-400" aria-hidden="true">·</span> 30 min
      </p>

      <h1 className="mt-5 text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink-950 sm:text-[42px] lg:text-[48px] lg:leading-[1.06]">
        See your pipeline the way your <span className="text-brand-600">best rep</span> sees it.
      </h1>

      <p className="mt-5 max-w-[540px] text-[17px] leading-[1.6] text-ink-600">
        Vantora reads every deal signal across your CRM, inbox and calls, so you forecast with confidence and
        your team works the deals that will actually close.
      </p>
    </div>);

}