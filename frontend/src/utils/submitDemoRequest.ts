import type { DemoFormValues } from '../types/demoForm';

interface SubmitOptions {
  simulateFailure?: boolean;
}

/**
 * The n8n webhook that receives demo requests. Override per build with
 * VITE_WEBHOOK_URL, or per visit with ?webhook=https://your-n8n/webhook/lead-intake
 */
const WEBHOOK_URL =
  new URLSearchParams(window.location.search).get('webhook') ||
  import.meta.env.VITE_WEBHOOK_URL ||
  'http://localhost:5678/webhook/lead-intake';

/** Posts the request to n8n and returns the lead ID it assigns. */
export async function submitDemoRequest(values: DemoFormValues, options: SubmitOptions = {}): Promise<string> {
  if (options.simulateFailure) {
    throw new Error('Simulated submission failure');
  }

  const payload = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim().toLowerCase(),
    company: values.company.trim(),
    website: values.website.trim().toLowerCase().replace(/^www\./, '').replace(/\/.*$/, ''),
    job_title: values.job_title.trim(),
    company_size: values.company_size,
    crm: values.crm || 'Not specified',
    timeline: values.timeline,
    message: values.message.trim(),
    consent: values.consent,
    source: 'website_demo_form',
    page_url: window.location.href.split('?')[0],
    submitted_at: new Date().toISOString(),
  };

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Request failed with ${res.status}`);

  const body = (await res.json().catch(() => ({}))) as { lead_id?: string };
  return body.lead_id || generateReferenceId();
}

export function generateReferenceId(): string {
  return `VNT-${Math.floor(1000 + Math.random() * 9000)}`;
}
