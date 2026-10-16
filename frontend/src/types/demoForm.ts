export interface DemoFormValues {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  website: string;
  job_title: string;
  company_size: string;
  crm: string;
  timeline: string;
  message: string;
  consent: boolean;
}

export type DemoFormField = keyof DemoFormValues;

export type DemoFormErrors = Partial<Record<DemoFormField, string>>;

export type DemoFormStatus = 'idle' | 'submitting' | 'error' | 'success';

export type DemoPreviewState =
'interactive' |
'validationErrors' |
'loading' |
'submissionError' |
'success';