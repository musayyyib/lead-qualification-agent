import React from 'react';
import { MotionConfig } from 'framer-motion';
import { SiteNav } from '../components/SiteNav';
import { PitchIntro } from '../components/PitchIntro';
import { PitchDetails } from '../components/PitchDetails';
import { DemoFormCard } from '../components/demo-form/DemoFormCard';
import { useTheme } from '../hooks/useTheme';
import type { ThemePreference } from '../hooks/useTheme';
import type { DemoPreviewState } from '../types/demoForm';

interface BookDemoProps {
  previewState: DemoPreviewState;
  simulateSubmitFailure: boolean;
  defaultTheme: ThemePreference;
}

const footerLink =
'rounded hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';

export function BookDemo({ previewState, simulateSubmitFailure, defaultTheme }: BookDemoProps) {
  const { theme, toggleTheme } = useTheme(defaultTheme);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen w-full overflow-x-hidden bg-page text-ink-900 antialiased">
        <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />

        <SiteNav theme={theme} onToggleTheme={toggleTheme} />

        <main className="relative mx-auto w-full max-w-[1280px] px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-[minmax(0,1fr)_520px] tall:grid-cols-[minmax(0,1fr)_580px] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10 xl:gap-x-24 tall:gap-x-14">
            <div className="lg:col-start-1 lg:row-start-1 lg:pt-8">
              <PitchIntro />
            </div>

            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              {/* Sticky + capped to the viewport so the submit button is always on screen */}
              <div className="lg:sticky lg:top-4">
                <DemoFormCard previewState={previewState} simulateSubmitFailure={simulateSubmitFailure} />
              </div>
            </div>

            <div className="lg:col-start-1 lg:row-start-2">
              <PitchDetails />
            </div>
          </div>
        </main>

        <footer className="relative border-t border-line">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-6 text-[13px] text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 Vantora, Inc. All rights reserved.</p>
            <nav aria-label="Legal" className="flex gap-5">
              <a href="#" className={footerLink}>
                Privacy
              </a>
              <a href="#" className={footerLink}>
                Terms
              </a>
              <a href="#" className={footerLink}>
                Security
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </MotionConfig>);

}