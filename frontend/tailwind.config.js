const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        tall: { raw: '(min-width: 1024px) and (min-height: 960px)' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        page: v('page'),
        surface: v('surface'),
        canvas: v('canvas'),
        brand: {
          50: v('brand-50'),
          100: v('brand-100'),
          200: v('brand-200'),
          300: v('brand-300'),
          500: v('brand-500'),
          600: v('brand-600'),
          700: v('brand-700'),
          800: v('brand-800'),
          hover: v('brand-hover'),
        },
        ink: {
          950: v('ink-950'),
          900: v('ink-900'),
          800: v('ink-800'),
          700: v('ink-700'),
          600: v('ink-600'),
          500: v('ink-500'),
          400: v('ink-400'),
          300: v('ink-300'),
        },
        line: {
          DEFAULT: v('line'),
          strong: v('line-strong'),
        },
        danger: {
          50: v('danger-50'),
          200: v('danger-200'),
          500: v('danger-500'),
          600: v('danger-600'),
          700: v('danger-700'),
        },
        success: {
          50: v('success-50'),
          200: v('success-200'),
          600: v('success-600'),
          700: v('success-700'),
        },
        warning: {
          50: v('warning-50'),
          200: v('warning-200'),
          700: v('warning-700'),
        },
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        card: 'var(--shadow-card)',
        preview: 'var(--shadow-preview)',
        button: 'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(16, 24, 40, 0.14)',
      },
    },
  },
}
