import type { DemoFormField, DemoFormValues } from '../types/demoForm';

export const companySizeOptions = ['1–10', '11–50', '51–200', '201–1,000', '1,001–5,000', '5,000+'];

export const crmOptions = ['Salesforce', 'HubSpot', 'Pipedrive', 'Other', 'None yet'];

export const timelineOptions = [
'Immediately (this month)',
'This quarter',
'Next 3–6 months',
'Just exploring'];


export const emptyDemoFormValues: DemoFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  company: '',
  website: '',
  job_title: '',
  company_size: '',
  crm: '',
  timeline: '',
  message: '',
  consent: false
};

export const sampleDemoFormValues: DemoFormValues = {
  first_name: 'Jordan',
  last_name: 'Ellis',
  email: 'jordan@acme.com',
  company: 'Acme Inc.',
  website: 'acme.com',
  job_title: 'Head of Sales',
  company_size: '201–1,000',
  crm: 'HubSpot',
  timeline: 'This quarter',
  message: 'Our commit number drifts every quarter. Want to see deal risk scoring.',
  consent: true
};

export const invalidDemoFormValues: DemoFormValues = {
  ...sampleDemoFormValues,
  last_name: '',
  email: 'jordan@acme',
  website: 'acme',
  timeline: '',
  consent: false
};

/** Order used to focus the first invalid field on submit. */
export const demoFormFieldOrder: DemoFormField[] = [
'first_name',
'last_name',
'email',
'company',
'website',
'job_title',
'company_size',
'crm',
'timeline',
'message',
'consent'];