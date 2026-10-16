import { RocketIcon, ShieldCheckIcon, TargetIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const benefits: Benefit[] = [
{
  icon: TargetIcon,
  title: 'Forecasts within 3% of actual',
  description: 'AI-weighted commits built from real buyer activity, not gut feel.'
},
{
  icon: RocketIcon,
  title: 'Live in under 2 weeks',
  description: 'Native CRM sync. No data team, no migration project.'
},
{
  icon: ShieldCheckIcon,
  title: 'Enterprise-grade security',
  description: 'SOC 2 Type II, SSO/SAML and granular role permissions.'
}];


export type DealRisk = 'at-risk' | 'attention' | 'on-track';

export interface Deal {
  company: string;
  amount: string;
  stage: string;
  signal: string;
  risk: DealRisk;
}

export const priorityDeals: Deal[] = [
{
  company: 'Arcfield Systems',
  amount: '$186k',
  stage: 'Negotiation',
  signal: 'No exec contact in 14 days',
  risk: 'at-risk'
},
{
  company: 'Orinda Health',
  amount: '$142k',
  stage: 'Proposal',
  signal: 'Champion changed roles',
  risk: 'attention'
},
{
  company: 'Sableworks',
  amount: '$98k',
  stage: 'Legal review',
  signal: 'Procurement engaged',
  risk: 'on-track'
}];


/** Cumulative forecast in $M across Q3 weeks. First 9 weeks are closed-won actuals. */
export const forecastSeries = [0.38, 0.71, 1.08, 1.46, 1.92, 2.37, 2.81, 3.26, 3.64, 4.02, 4.41, 4.82];
export const forecastActualWeeks = 9;
export const forecastTarget = 5.1;

export const testimonial = {
  quote:
  'Forecast calls used to eat half a day. Now we walk in with a number our board actually trusts. Vantora called our Q2 within 2%.',
  name: 'Maya Okafor',
  initials: 'MO',
  title: 'VP, Revenue Operations',
  company: 'Tidewell'
};

export interface CustomerLogo {
  name: string;
  className: string;
}

export const customerLogos: CustomerLogo[] = [
{ name: 'Arcfield', className: 'font-semibold tracking-[-0.04em] text-[19px]' },
{ name: 'tidewell', className: 'font-medium lowercase tracking-[-0.02em] text-[20px]' },
{ name: 'KESTREL', className: 'font-bold tracking-[0.18em] text-[14px]' },
{ name: 'Orinda', className: 'font-serif italic font-semibold text-[20px]' },
{ name: 'Sableworks', className: 'font-mono font-medium tracking-[-0.03em] text-[15px]' }];