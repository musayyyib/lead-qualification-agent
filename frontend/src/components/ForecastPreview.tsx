import React from 'react';
import { TrendingUpIcon } from 'lucide-react';
import { forecastActualWeeks, forecastSeries, forecastTarget, priorityDeals } from '../data/pitch';
import type { DealRisk } from '../data/pitch';

const CHART_W = 300;
const CHART_H = 112;
const MAX = 5.6;

const riskStyles: Record<DealRisk, {label: string;className: string;dot: string;}> = {
  'at-risk': { label: 'At risk', className: 'bg-danger-50 text-danger-700 border-danger-200', dot: 'bg-danger-600' },
  attention: { label: 'Watch', className: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-700' },
  'on-track': { label: 'On track', className: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-600' }
};

export function ForecastPreview() {
  const x = (i: number) => i / (forecastSeries.length - 1) * CHART_W;
  const y = (v: number) => CHART_H - v / MAX * CHART_H;

  const actual = forecastSeries.slice(0, forecastActualWeeks);
  const projected = forecastSeries.slice(forecastActualWeeks - 1);
  const lastActual = forecastActualWeeks - 1;

  const actualLine = actual.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const areaPath = `M${x(0)},${CHART_H} ${actual.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${x(lastActual)},${CHART_H} Z`;
  const projectedLine = projected.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + lastActual)},${y(v)}`).join(' ');
  const endIndex = forecastSeries.length - 1;
  const targetY = y(forecastTarget);

  return (
    <div
      className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-preview"
      role="img"
      aria-label="Product preview: Q3 forecast of $4.82M, 94% to a $5.1M target, with three prioritized deals flagged by risk.">
      
      <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-ink-300" />
          <span className="h-2 w-2 rounded-full bg-ink-300" />
          <span className="h-2 w-2 rounded-full bg-ink-300" />
        </div>
        <span className="text-[11px] font-medium text-ink-500">app.vantora.io / forecast</span>
        <span className="w-10" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
        <div className="p-5 md:border-r md:border-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-ink-500">Q3 commit forecast</p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums">
                $4.82M
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-1.5 py-0.5 text-[11px] font-semibold text-success-700 tabular-nums">
              <TrendingUpIcon className="h-3 w-3" aria-hidden="true" />
              +12.4%
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-ink-500 tabular-nums">
              <span>
                <span className="font-semibold text-ink-800">94%</span> of $5.10M target
              </span>
              <span>3 weeks left</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-50">
              <div className="h-full w-[94%] rounded-full bg-brand-600" />
            </div>
          </div>

          <svg viewBox={`0 -6 ${CHART_W} ${CHART_H + 24}`} className="mt-4 h-auto w-full overflow-visible" aria-hidden="true">
            {[0.25, 0.5, 0.75].map((t) =>
            <line key={t} x1="0" x2={CHART_W} y1={CHART_H * t} y2={CHART_H * t} className="stroke-line" strokeWidth="1" />
            )}
            <line x1="0" x2={CHART_W} y1={CHART_H} y2={CHART_H} className="stroke-line-strong" strokeWidth="1" />
            <line x1="0" x2={CHART_W} y1={targetY} y2={targetY} className="stroke-ink-400" strokeWidth="1" strokeDasharray="2 3" />
            <text x={CHART_W} y={targetY - 5} textAnchor="end" className="fill-ink-500 text-[9px] font-medium">
              Target $5.1M
            </text>
            <path d={areaPath} className="fill-brand-50" />
            <path d={actualLine} fill="none" className="stroke-brand-600" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <path d={projectedLine} fill="none" className="stroke-brand-500" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
            <circle cx={x(lastActual)} cy={y(actual[lastActual])} r="3" className="fill-surface stroke-brand-600" strokeWidth="2" />
            <circle cx={x(endIndex)} cy={y(forecastSeries[endIndex])} r="3.5" className="fill-brand-600" />
            {['Jul', 'Aug', 'Sep'].map((m, i) =>
            <text key={m} x={i / 2 * CHART_W} y={CHART_H + 16} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} className="fill-ink-400 text-[9px]">
                {m}
              </text>
            )}
          </svg>
        </div>

        <div className="border-t border-line p-5 md:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-ink-800">Deals to prioritize</p>
            <p className="text-[11px] text-ink-500">This week</p>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {priorityDeals.map((deal) => {
              const risk = riskStyles[deal.risk];
              return (
                <li key={deal.company} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-ink-900">{deal.company}</p>
                    <p className="text-[13px] font-semibold text-ink-900 tabular-nums">{deal.amount}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="truncate text-[11px] text-ink-500">{deal.signal}</p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold ${risk.className}`}>
                      
                      <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                      {risk.label}
                    </span>
                  </div>
                </li>);

            })}
          </ul>
        </div>
      </div>
    </div>);

}