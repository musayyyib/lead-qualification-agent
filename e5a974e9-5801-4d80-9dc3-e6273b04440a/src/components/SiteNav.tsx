import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoonIcon, SunIcon } from 'lucide-react';
import { VantoraLogo } from './VantoraLogo';
import type { ResolvedTheme } from '../hooks/useTheme';

interface SiteNavProps {
  theme: ResolvedTheme;
  onToggleTheme: () => void;
}

const links = ['Product', 'Solutions', 'Customers', 'Pricing'];

const focusRing =
'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page';

export function SiteNav({ theme, onToggleTheme }: SiteNavProps) {
  const isDark = theme === 'dark';

  return (
    <header className="relative">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <a href="#" aria-label="Vantora home" className={focusRing}>
            <VantoraLogo />
          </a>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {links.map((link) =>
              <li key={link}>
                  <a
                  href="#"
                  className={`text-sm font-medium text-ink-600 transition-colors duration-150 ease-out hover:text-ink-900 ${focusRing}`}>
                  
                    {link}
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[10px] text-ink-600 transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink-900 lg:h-9 lg:w-9 ${focusRing}`}>
            
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -30, scale: 0.96 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.96 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="flex">
                
                {isDark ? <SunIcon className="h-[18px] w-[18px]" aria-hidden="true" /> : <MoonIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <span className="h-5 w-px bg-line" aria-hidden="true" />
          <a
            href="#"
            className={`inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink-700 transition-colors duration-150 ease-out hover:text-ink-900 ${focusRing}`}>
            
            Sign in
          </a>
        </div>
      </div>
    </header>);

}