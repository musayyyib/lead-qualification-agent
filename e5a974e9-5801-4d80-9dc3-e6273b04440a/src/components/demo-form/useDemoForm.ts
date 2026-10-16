import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  demoFormFieldOrder,
  emptyDemoFormValues,
  invalidDemoFormValues,
  sampleDemoFormValues } from
'../../data/demoForm';
import { generateReferenceId, submitDemoRequest } from '../../utils/submitDemoRequest';
import { validateDemoForm, validateField } from '../../utils/validateDemoForm';
import type {
  DemoFormErrors,
  DemoFormField,
  DemoFormStatus,
  DemoFormValues,
  DemoPreviewState } from
'../../types/demoForm';

interface UseDemoFormOptions {
  previewState: DemoPreviewState;
  simulateSubmitFailure: boolean;
}

type Touched = Partial<Record<DemoFormField, boolean>>;

const allTouched: Touched = demoFormFieldOrder.reduce<Touched>((acc, key) => ({ ...acc, [key]: true }), {});

export function useDemoForm({ previewState, simulateSubmitFailure }: UseDemoFormOptions) {
  const [values, setValues] = useState<DemoFormValues>(emptyDemoFormValues);
  const [errors, setErrors] = useState<DemoFormErrors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [status, setStatus] = useState<DemoFormStatus>('idle');
  const [referenceId, setReferenceId] = useState('');
  const [focusSuccess, setFocusSuccess] = useState(false);

  useEffect(() => {
    setFocusSuccess(false);
    switch (previewState) {
      case 'validationErrors':
        setValues(invalidDemoFormValues);
        setErrors(validateDemoForm(invalidDemoFormValues));
        setTouched(allTouched);
        setStatus('idle');
        break;
      case 'loading':
        setValues(sampleDemoFormValues);
        setErrors({});
        setTouched({});
        setStatus('submitting');
        break;
      case 'submissionError':
        setValues(sampleDemoFormValues);
        setErrors({});
        setTouched({});
        setStatus('error');
        break;
      case 'success':
        setValues(sampleDemoFormValues);
        setErrors({});
        setReferenceId('VNT-4821');
        setStatus('success');
        break;
      default:
        setValues(emptyDemoFormValues);
        setErrors({});
        setTouched({});
        setStatus('idle');
    }
  }, [previewState]);

  const setField = useCallback(
    <K extends DemoFormField,>(name: K, value: DemoFormValues[K]) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
      }
    },
    [touched]
  );

  const blurField = useCallback(
    (name: DemoFormField) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, values[name]) }));
    },
    [values]
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === 'submitting') return;

      const nextErrors = validateDemoForm(values);
      setErrors(nextErrors);
      setTouched(allTouched);

      const firstInvalid = demoFormFieldOrder.find((key) => nextErrors[key]);
      if (firstInvalid) {
        document.getElementById(`field-${firstInvalid}`)?.focus();
        return;
      }

      setStatus('submitting');
      try {
        await submitDemoRequest(values, { simulateFailure: simulateSubmitFailure });
        setReferenceId(generateReferenceId());
        setFocusSuccess(true);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    },
    [status, values, simulateSubmitFailure]
  );

  const reset = useCallback(() => {
    setValues(emptyDemoFormValues);
    setErrors({});
    setTouched({});
    setReferenceId('');
    setFocusSuccess(false);
    setStatus('idle');
  }, []);

  return { values, errors, status, referenceId, focusSuccess, setField, blurField, submit, reset };
}