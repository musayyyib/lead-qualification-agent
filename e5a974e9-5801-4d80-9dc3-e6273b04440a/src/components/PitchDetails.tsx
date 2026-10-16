import React from 'react';
import { benefits, customerLogos, testimonial } from '../data/pitch';
import { ForecastPreview } from './ForecastPreview';

export function PitchDetails() {
  return (
    <div className="flex flex-col gap-10">
      <ul className="grid max-w-[600px] gap-5">
        {benefits.map(({ icon: Icon, title, description }) =>
        <li key={title} className="flex gap-3.5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-brand-600 shadow-xs">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink-900">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{description}</p>
            </div>
          </li>
        )}
      </ul>

      <ForecastPreview />

      <figure className="max-w-[600px] border-l-2 border-brand-200 pl-5">
        <blockquote className="text-[16px] leading-[1.6] text-ink-800">“{testimonial.quote}”</blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700"
            aria-hidden="true">
            
            {testimonial.initials}
          </span>
          <span className="text-sm">
            <span className="block font-semibold text-ink-900">{testimonial.name}</span>
            <span className="block text-ink-500">
              {testimonial.title}, {testimonial.company}
            </span>
          </span>
        </figcaption>
      </figure>

      <section aria-labelledby="trusted-heading" className="border-t border-line pt-7">
        <h2 id="trusted-heading" className="text-[13px] font-medium text-ink-500">
          Trusted by <span className="tabular-nums text-ink-800">400+</span> revenue teams
        </h2>
        <ul className="mt-4 flex flex-wrap items-center gap-x-9 gap-y-4">
          {customerLogos.map((logo) =>
          <li key={logo.name} className={`select-none text-ink-500 ${logo.className}`}>
              {logo.name}
            </li>
          )}
        </ul>
      </section>
    </div>);

}