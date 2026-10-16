import React from 'react';
import { BookDemo } from './pages/BookDemo';

interface AppProps {
  /** Pins the form card to a specific state for presentation. "interactive" is the live form. */
  previewState?: 'interactive' | 'validationErrors' | 'loading' | 'submissionError' | 'success';
  /** Makes the placeholder submit handler fail, to demo the submission error banner. */
  simulateSubmitFailure?: boolean;
  /** Starting theme. Visitors can still switch with the toggle in the nav. */
  defaultTheme?: 'system' | 'light' | 'dark';
}

export function App({
  previewState = 'interactive',
  simulateSubmitFailure = false,
  defaultTheme = 'light'
}: AppProps) {
  return (
    <BookDemo
      previewState={previewState}
      simulateSubmitFailure={simulateSubmitFailure}
      defaultTheme={defaultTheme} />);


}