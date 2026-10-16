import type { DemoFormErrors, DemoFormField, DemoFormValues } from '../types/demoForm';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/\S*)?$/i;
const PERSONAL_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'proton.me'];

export function validateField<K extends DemoFormField>(name: K, value: DemoFormValues[K]): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';

  switch (name) {
    case 'first_name':
      return text ? undefined : 'Please enter your first name';
    case 'last_name':
      return text ? undefined : 'Please enter your last name';
    case 'email':{
        if (!text) return 'Please enter your work email';
        if (!EMAIL_PATTERN.test(text)) return 'Please enter a valid work email';
        const domain = text.split('@')[1]?.toLowerCase();
        if (domain && PERSONAL_EMAIL_DOMAINS.includes(domain)) return 'Please use your work email address';
        return undefined;
      }
    case 'company':
      return text ? undefined : 'Please enter your company name';
    case 'website':
      if (!text) return 'Please enter your company website';
      return DOMAIN_PATTERN.test(text) ? undefined : 'Please enter a valid website, e.g. acme.com';
    case 'job_title':
      return text ? undefined : 'Please enter your job title';
    case 'company_size':
      return text ? undefined : 'Please select your company size';
    case 'timeline':
      return text ? undefined : 'Please select a timeline';
    case 'consent':
      return value === true ? undefined : 'Please agree so we can contact you';
    default:
      return undefined;
  }
}

export function validateDemoForm(values: DemoFormValues): DemoFormErrors {
  const errors: DemoFormErrors = {};
  (Object.keys(values) as DemoFormField[]).forEach((name) => {
    const error = validateField(name, values[name]);
    if (error) errors[name] = error;
  });
  return errors;
}

/** Strips a pasted protocol so the fixed "https://" prefix is never duplicated. */
export function normalizeWebsite(input: string): string {
  return input.replace(/^\s*https?:\/\//i, '');
}