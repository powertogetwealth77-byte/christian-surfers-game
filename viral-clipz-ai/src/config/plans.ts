import type { PlanId } from '@/types/entities';

/**
 * Subscription plans as configurable product data.
 * The UI reads from here only — never hard-code prices or limits in screens.
 * When RevenueCat is connected these map to offering identifiers.
 */

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  processingMinutes: number;
  maxBrandKits: number;
  maxProjects: number | null;
  exportResolution: '720p' | '1080p';
  watermarked: boolean;
  highlight: boolean;
  revenueCatEntitlement: string;
  features: PlanFeature[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyUsd: 0,
    tagline: 'Try the engine',
    processingMinutes: 60,
    maxBrandKits: 1,
    maxProjects: 3,
    exportResolution: '720p',
    watermarked: true,
    highlight: false,
    revenueCatEntitlement: 'free',
    features: [
      { label: '60 processing minutes / month', included: true },
      { label: '720p exports with watermark', included: true },
      { label: 'Basic captions', included: true },
      { label: 'Up to 3 active projects', included: true },
      { label: 'AI strategy recommendations', included: false },
      { label: 'Brand kit', included: false },
    ],
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    priceMonthlyUsd: 19,
    tagline: 'For serious solo creators',
    processingMinutes: 300,
    maxBrandKits: 1,
    maxProjects: null,
    exportResolution: '1080p',
    watermarked: false,
    highlight: true,
    revenueCatEntitlement: 'creator',
    features: [
      { label: '300 processing minutes / month', included: true },
      { label: '1080p exports, no watermark', included: true },
      { label: 'Premium caption presets', included: true },
      { label: 'AI strategy recommendations', included: true },
      { label: 'Brand kit', included: true },
      { label: 'Social content package', included: true },
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthlyUsd: 39,
    tagline: 'Turn clips into a system',
    processingMinutes: 900,
    maxBrandKits: 5,
    maxProjects: null,
    exportResolution: '1080p',
    watermarked: false,
    highlight: false,
    revenueCatEntitlement: 'growth',
    features: [
      { label: '900 processing minutes / month', included: true },
      { label: 'Advanced AI clip scoring', included: true },
      { label: 'Multiple brand kits', included: true },
      { label: 'Publishing integrations', included: true },
      { label: 'Performance learning', included: true },
      { label: 'Priority processing', included: true },
      { label: 'Advanced analytics', included: true },
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceMonthlyUsd: 99,
    tagline: 'Run clients at scale',
    processingMinutes: 3000,
    maxBrandKits: 25,
    maxProjects: null,
    exportResolution: '1080p',
    watermarked: false,
    highlight: false,
    revenueCatEntitlement: 'agency',
    features: [
      { label: '3,000 processing minutes / month', included: true },
      { label: 'Multiple client workspaces', included: true },
      { label: 'Team members & approvals', included: true },
      { label: 'White-label exports', included: true },
      { label: 'Client analytics', included: true },
      { label: 'Shared brand kits', included: true },
      { label: 'API & webhook access', included: true },
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'creator', 'growth', 'agency'];
