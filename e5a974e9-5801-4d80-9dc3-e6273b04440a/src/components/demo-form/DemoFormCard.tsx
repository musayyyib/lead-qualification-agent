import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircleIcon, ArrowRightIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { useDemoForm } from './useDemoForm';
import { TextField } from './TextField';
import { SelectField } from './SelectField';
import { CrmChips } from './CrmChips';
import { DemoSuccess } from './DemoSuccess';
import { FieldError } from './FieldShell';
import { companySizeOptions, timelineOptions } from '../../data/demoForm';
import { inputClasses } from '../../utils/fieldStyles';
import { normalizeWebsite } from '../../utils/validateDemoForm';
import type { DemoPreviewState } from '../../types/demoForm';

interface DemoFormCardProps {
  previewState: DemoPreviewState;
  simulateSubmitFailure: boolean;
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function DemoFormCard({ previewState, simulateSubmitFailure }: DemoFormCardProps) {
  const { values, errors, status, referenceId, focusSuccess, setField, blurField, submit, reset } = useDemoForm({
    previewState,
    simulateSubmitFailure
  });
  const submitting = status === 'submitting';
  const { ref: scrollRef, overflowing } = useOverflow<HTMLDivElement>();

  return (
    <section
      aria-label="Book a demo"
      className="flex flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-card lg:max-h-[calc(100dvh-6rem)]">
      
      <AnimatePresence mode="wait" initial={false}>
        {status === 'success' ?
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="min-h-0 overflow-y-auto">
          
            <DemoSuccess
            firstName={values.first_name.trim()}
            email={values.email.trim()}
            referenceId={referenceId}
            autoFocus={focusSuccess}
            onReset={reset} />
          
          </motion.div> :

        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="flex min-h-0 flex-col">
          
            <form
            noValidate
            onSubmit={submit}
            aria-labelledby="demo-form-title"
            aria-busy={submitting}
            className="flex min-h-0 flex-col">
            
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 sm:px-6 sm:pt-6">
                {status === 'error' &&
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-danger-200 bg-danger-50 px-3 py-2.5 text-[13px] leading-snug text-danger-700">
                
                    <AlertCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>We couldn't submit your request right now. Please try again in a moment.</p>
                  </div>
              }

                <header className="mb-4">
                  <h2 id="demo-form-title" className="text-[19px] font-semibold tracking-[-0.015em] text-ink-950">
                    Book your personalized demo
                  </h2>
                  <p className="mt-1 text-[13.5px] text-ink-600">30 minutes, tailored to your pipeline and CRM.</p>
                </header>

                <div className="grid grid-cols-1 gap-x-3 gap-y-3 pb-1 sm:grid-cols-2">
                  <TextField
                  name="first_name"
                  label="First name"
                  placeholder="Jordan"
                  autoComplete="given-name"
                  value={values.first_name}
                  error={errors.first_name}
                  onChange={(v) => setField('first_name', v)}
                  onBlur={() => blurField('first_name')} />
                
                  <TextField
                  name="last_name"
                  label="Last name"
                  placeholder="Ellis"
                  autoComplete="family-name"
                  value={values.last_name}
                  error={errors.last_name}
                  onChange={(v) => setField('last_name', v)}
                  onBlur={() => blurField('last_name')} />
                
                  <TextField
                  name="email"
                  type="email"
                  inputMode="email"
                  label="Work email"
                  placeholder="jordan@company.com"
                  autoComplete="email"
                  value={values.email}
                  error={errors.email}
                  onChange={(v) => setField('email', v)}
                  onBlur={() => blurField('email')} />
                
                  <TextField
                  name="job_title"
                  label="Job title"
                  placeholder="Head of Sales"
                  autoComplete="organization-title"
                  value={values.job_title}
                  error={errors.job_title}
                  onChange={(v) => setField('job_title', v)}
                  onBlur={() => blurField('job_title')} />
                
                  <TextField
                  name="company"
                  label="Company name"
                  placeholder="Acme Inc."
                  autoComplete="organization"
                  value={values.company}
                  error={errors.company}
                  onChange={(v) => setField('company', v)}
                  onBlur={() => blurField('company')} />
                
                  <TextField
                  name="website"
                  label="Company website"
                  placeholder="acme.com"
                  prefix="https://"
                  inputMode="url"
                  autoComplete="url"
                  value={values.website}
                  error={errors.website}
                  onChange={(v) => setField('website', normalizeWebsite(v))}
                  onBlur={() => blurField('website')} />
                

                  <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:col-span-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <SelectField
                    name="company_size"
                    label="Company size"
                    placeholder="Select size"
                    options={companySizeOptions}
                    value={values.company_size}
                    error={errors.company_size}
                    onChange={(v) => setField('company_size', v)}
                    onBlur={() => blurField('company_size')} />
                  
                    <SelectField
                    name="timeline"
                    label="When are you looking to get started?"
                    placeholder="Select a timeline"
                    options={timelineOptions}
                    value={values.timeline}
                    error={errors.timeline}
                    onChange={(v) => setField('timeline', v)}
                    onBlur={() => blurField('timeline')} />
                  
                  </div>

                  <CrmChips className="sm:col-span-2" value={values.crm} onChange={(v) => setField('crm', v)} />

                  <div className="sm:col-span-2">
                    <label htmlFor="field-message" className="mb-1 block text-[13px] font-medium text-ink-800">
                      What would you like to solve? <span className="font-normal text-ink-500">(optional)</span>
                    </label>
                    <textarea
                    id="field-message"
                    name="message"
                    rows={2}
                    value={values.message}
                    placeholder="e.g. Our forecast misses by 15%+ and we can't tell which deals are slipping."
                    onChange={(e) => setField('message', e.target.value)}
                    className={inputClasses(false, 'block resize-none px-3 py-2 leading-relaxed')} />
                  
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-2.5">
                      <input
                      id="field-consent"
                      name="consent"
                      type="checkbox"
                      required
                      aria-required="true"
                      checked={values.consent}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={errors.consent ? 'field-consent-error' : undefined}
                      onChange={(e) => {
                        setField('consent', e.target.checked);
                        blurField('consent');
                      }}
                      className={`mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 lg:h-4 lg:w-4 ${
                      errors.consent ? 'outline outline-1 outline-danger-500' : ''}`
                      } />
                    
                      <label htmlFor="field-consent" className="cursor-pointer text-[13px] leading-snug text-ink-600">
                        I agree to Vantora contacting me about this request. See our{' '}
                        <a
                        href="#"
                        className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                        
                          Privacy Policy
                        </a>
                        .
                      </label>
                    </div>
                    {errors.consent && <FieldError id="field-consent-error" message={errors.consent} />}
                  </div>
                </div>
              </div>

              {/* Pinned action area — stays visible even if the fields need to scroll on short screens */}
              <div
              className={`shrink-0 border-t bg-surface px-5 pb-5 pt-4 transition-colors duration-150 ease-out sm:px-6 sm:pb-5 ${
              overflowing ? 'border-line' : 'border-transparent'}`
              }>
              
                <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-600 text-[15px] font-semibold text-white shadow-button transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-brand-600 disabled:active:scale-100 lg:h-11">
                
                  {submitting ?
                <>
                      <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Submitting…
                    </> :

                <>
                      Request my demo
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </>
                }
                </button>
                <ul className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12.5px] text-ink-600">
                  {['Reply within 1 business day', 'No credit card required'].map((line) =>
                <li key={line} className="flex items-center gap-1.5">
                      <CheckIcon className="h-3.5 w-3.5 text-success-600" aria-hidden="true" strokeWidth={2.5} />
                      {line}
                    </li>
                )}
                </ul>
              </div>
            </form>
          </motion.div>
        }
      </AnimatePresence>
    </section>);

}

/** Tracks whether a scroll container's content is taller than its visible area. */
function useOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  });

  return { ref, overflowing };
}