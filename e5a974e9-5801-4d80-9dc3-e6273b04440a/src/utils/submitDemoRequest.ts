import type { DemoFormValues } from '../types/demoForm';

interface SubmitOptions {
  simulateFailure?: boolean;
}

/**
 * Placeholder submit handler — replace the body with your backend call, e.g.
 *
 *   const res = await fetch('/api/demo-requests', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ...values, website: `https://${values.website}` }),
 *   });
 *   if (!res.ok) throw new Error('Request failed');
 *
 * Note: `website` holds the domain only; the "https://" prefix is visual.
 */
export async function submitDemoRequest(values: DemoFormValues, options: SubmitOptions = {}): Promise<void> {
  void values;
  await new Promise((resolve) => setTimeout(resolve, 1400));
  if (options.simulateFailure) {
    throw new Error('Simulated submission failure');
  }
}

export function generateReferenceId(): string {
  return `VNT-${Math.floor(1000 + Math.random() * 9000)}`;
}