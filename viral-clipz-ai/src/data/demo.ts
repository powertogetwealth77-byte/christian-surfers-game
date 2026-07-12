/**
 * DEMO MODE SAMPLE DATA — centralized and clearly labeled.
 *
 * Everything in this file is fictional demonstration content used when
 * Supabase credentials are not configured (see src/lib/env.ts#isDemoMode).
 * It exists so the full product experience is testable without a backend.
 * Delete this file (and src/services/demoBackend.ts) when the real backend
 * is connected end-to-end.
 */

import type {
  AppNotification,
  BrandKit,
  Clip,
  ClipScores,
  ClipStrategy,
  GeneratedCopy,
  Profile,
  Project,
  Subscription,
  Workspace,
} from '@/types/entities';

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DEMO_USER_ID = 'demo-user-0001';
export const DEMO_WORKSPACE_ID = 'demo-workspace-0001';

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  email: 'demo@viralclipz.app',
  fullName: 'Demo Creator',
  avatarUrl: null,
  creatorType: 'podcaster',
  primaryGoal: 'grow_followers',
  platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],
  contentStyle: 'podcast_highlights',
  onboardingCompletedAt: iso(9 * DAY),
  createdAt: iso(10 * DAY),
  updatedAt: iso(1 * DAY),
};

export const demoWorkspace: Workspace = {
  id: DEMO_WORKSPACE_ID,
  name: 'My Studio',
  ownerId: DEMO_USER_ID,
  planId: 'free',
  isClientWorkspace: false,
  createdAt: iso(10 * DAY),
};

export const demoSubscription: Subscription = {
  id: 'demo-sub-0001',
  workspaceId: DEMO_WORKSPACE_ID,
  planId: 'free',
  status: 'active',
  provider: 'none',
  currentPeriodStart: iso(10 * DAY),
  currentPeriodEnd: new Date(now + 20 * DAY).toISOString(),
  cancelAtPeriodEnd: false,
};

/** Minutes already consumed this cycle (plan limit lives in config/plans). */
export const demoMinutesUsed = 22;

export const demoBrandKits: BrandKit[] = [
  {
    id: 'demo-brand-0001',
    workspaceId: DEMO_WORKSPACE_ID,
    name: 'Main Brand',
    logoUrl: null,
    primaryColor: '#FF5C38',
    secondaryColor: '#8B5CF6',
    accentColor: '#2DE3A7',
    captionFont: 'Inter Black',
    captionStyle: 'bold_pop',
    logoPosition: 'top_right',
    introCardEnabled: false,
    outroCardEnabled: true,
    defaultCta: 'Follow for more →',
    watermarkEnabled: true,
    isDefault: true,
    createdAt: iso(9 * DAY),
    updatedAt: iso(2 * DAY),
  },
];

export const demoProjects: Project[] = [
  {
    id: 'demo-project-0001',
    workspaceId: DEMO_WORKSPACE_ID,
    createdBy: DEMO_USER_ID,
    title: 'Podcast Ep. 42 — Pricing Psychology',
    status: 'completed',
    objective: 'build_authority',
    audience: {
      targetAudience: 'Early-stage founders and solo consultants',
      painPoint: 'Undercharging and discounting out of fear',
      transformation: 'Confidently raising prices without losing clients',
      tone: 'Direct, expert, a little contrarian',
      prioritizeTopics: ['pricing', 'negotiation', 'positioning'],
      avoidTopics: ['politics'],
    },
    config: {
      autoSelect: true,
      clipCount: 6,
      minLengthSec: 20,
      maxLengthSec: 60,
      aspectRatio: '9:16',
      captionStyle: 'bold_pop',
      speakerTracking: true,
      emojiLevel: 'light',
      profanityFilter: true,
      removeFillerWords: true,
      removeSilence: true,
      autoZoom: true,
      brollSuggestions: true,
      defaultCta: 'Follow for more →',
      brandKitId: 'demo-brand-0001',
    },
    sourceVideoId: 'demo-source-0001',
    thumbnailUrl: null,
    durationSec: 3480,
    clipCount: 6,
    estimatedCreditsMin: 58,
    failureReason: null,
    createdAt: iso(3 * DAY),
    updatedAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-project-0002',
    workspaceId: DEMO_WORKSPACE_ID,
    createdBy: DEMO_USER_ID,
    title: 'Webinar — Launch Funnel Teardown',
    status: 'processing',
    objective: 'generate_leads',
    audience: null,
    config: {
      autoSelect: true,
      clipCount: 8,
      minLengthSec: 25,
      maxLengthSec: 75,
      aspectRatio: '9:16',
      captionStyle: 'block_highlight',
      speakerTracking: true,
      emojiLevel: 'none',
      profanityFilter: true,
      removeFillerWords: true,
      removeSilence: true,
      autoZoom: false,
      brollSuggestions: false,
      defaultCta: 'Grab the free checklist ↓',
      brandKitId: 'demo-brand-0001',
    },
    sourceVideoId: 'demo-source-0002',
    thumbnailUrl: null,
    durationSec: 5220,
    clipCount: 0,
    estimatedCreditsMin: 87,
    failureReason: null,
    createdAt: iso(2 * HOUR),
    updatedAt: iso(10 * 60_000),
  },
  {
    id: 'demo-project-0003',
    workspaceId: DEMO_WORKSPACE_ID,
    createdBy: DEMO_USER_ID,
    title: 'Sunday Talk — Overcoming Doubt',
    status: 'draft',
    objective: 'inspire',
    audience: null,
    config: {
      autoSelect: true,
      clipCount: 5,
      minLengthSec: 20,
      maxLengthSec: 60,
      aspectRatio: '9:16',
      captionStyle: 'clean_minimal',
      speakerTracking: true,
      emojiLevel: 'none',
      profanityFilter: true,
      removeFillerWords: true,
      removeSilence: true,
      autoZoom: true,
      brollSuggestions: false,
      defaultCta: 'Share this with someone',
      brandKitId: null,
    },
    sourceVideoId: null,
    thumbnailUrl: null,
    durationSec: null,
    clipCount: 0,
    estimatedCreditsMin: 0,
    failureReason: null,
    createdAt: iso(6 * DAY),
    updatedAt: iso(6 * DAY),
  },
  {
    id: 'demo-project-0004',
    workspaceId: DEMO_WORKSPACE_ID,
    createdBy: DEMO_USER_ID,
    title: 'Interview — Agency Growth Story',
    status: 'failed',
    objective: 'maximize_reach',
    audience: null,
    config: {
      autoSelect: true,
      clipCount: 6,
      minLengthSec: 20,
      maxLengthSec: 60,
      aspectRatio: '9:16',
      captionStyle: 'bold_pop',
      speakerTracking: true,
      emojiLevel: 'light',
      profanityFilter: true,
      removeFillerWords: true,
      removeSilence: true,
      autoZoom: true,
      brollSuggestions: true,
      defaultCta: 'Follow for more →',
      brandKitId: 'demo-brand-0001',
    },
    sourceVideoId: 'demo-source-0004',
    thumbnailUrl: null,
    durationSec: 2710,
    clipCount: 0,
    estimatedCreditsMin: 46,
    failureReason: 'The imported link expired before download finished. Re-add the source to retry.',
    createdAt: iso(5 * DAY),
    updatedAt: iso(5 * DAY - HOUR),
  },
];

export const demoClips: Clip[] = [
  {
    id: 'demo-clip-0001',
    projectId: 'demo-project-0001',
    title: 'The $10K mistake almost every freelancer makes',
    startMs: 754_000,
    endMs: 796_000,
    aspectRatio: '9:16',
    status: 'recommended',
    approved: true,
    platformRecommendation: 'tiktok',
    aiSummary:
      'Opens on a concrete dollar-amount mistake, then flips the audience’s pricing assumption in under 15 seconds.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      'Here’s the ten thousand dollar mistake almost every freelancer makes: they price the hours, not the outcome…',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-clip-0002',
    projectId: 'demo-project-0001',
    title: 'Why discounts destroy trust (not just margin)',
    startMs: 1_420_000,
    endMs: 1_478_000,
    aspectRatio: '9:16',
    status: 'recommended',
    approved: false,
    platformRecommendation: 'instagram_reels',
    aiSummary:
      'A contrarian claim backed by a client story — strong save-and-share energy for consultants.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      'Every time you discount, you’re not lowering the price — you’re telling the client your first number was a lie…',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-clip-0003',
    projectId: 'demo-project-0001',
    title: 'The anchor-price script, word for word',
    startMs: 2_105_000,
    endMs: 2_160_000,
    aspectRatio: '9:16',
    status: 'recommended',
    approved: false,
    platformRecommendation: 'youtube_shorts',
    aiSummary:
      'Tactical, screenshot-able script content — the highest lead-magnet potential in this episode.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      'Say this exactly: “Most clients invest between X and 2X. Where that lands depends on three things…”',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-clip-0004',
    projectId: 'demo-project-0001',
    title: 'Raising prices lost me zero clients',
    startMs: 2_610_000,
    endMs: 2_643_000,
    aspectRatio: '9:16',
    status: 'alternative',
    approved: false,
    platformRecommendation: 'linkedin',
    aiSummary:
      'Personal proof story; slower open but strong credibility payoff for a professional audience.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      'I doubled my rate in January, braced for the exodus… and every single client renewed…',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-clip-0005',
    projectId: 'demo-project-0001',
    title: 'Charge for the diagnosis, not the prescription',
    startMs: 3_010_000,
    endMs: 3_075_000,
    aspectRatio: '9:16',
    status: 'alternative',
    approved: false,
    platformRecommendation: 'instagram_reels',
    aiSummary:
      'Memorable metaphor with quotable one-liner; competes with clip 1 for the same insight.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      'A doctor doesn’t bill you for the prescription pad. You’re paying for the diagnosis…',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-clip-0006',
    projectId: 'demo-project-0001',
    title: 'Q&A — “What if my market can’t afford it?”',
    startMs: 3_240_000,
    endMs: 3_318_000,
    aspectRatio: '9:16',
    status: 'needs_review',
    approved: false,
    platformRecommendation: 'youtube_shorts',
    aiSummary:
      'Valuable answer but the question audio is faint for the first 4 seconds — review before publishing.',
    previewUrl: null,
    thumbnailUrl: null,
    transcriptExcerpt:
      '“What if my market genuinely can’t afford premium pricing?” Then you don’t have a pricing problem, you have a market problem…',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
];

export const demoScores: Record<string, ClipScores> = {
  'demo-clip-0001': {
    clipId: 'demo-clip-0001',
    viralPotential: 92,
    hookStrength: 95,
    clarity: 88,
    emotionalImpact: 78,
    ctaOpportunity: 84,
    leadPotential: 71,
  },
  'demo-clip-0002': {
    clipId: 'demo-clip-0002',
    viralPotential: 86,
    hookStrength: 89,
    clarity: 84,
    emotionalImpact: 82,
    ctaOpportunity: 70,
    leadPotential: 64,
  },
  'demo-clip-0003': {
    clipId: 'demo-clip-0003',
    viralPotential: 81,
    hookStrength: 76,
    clarity: 93,
    emotionalImpact: 61,
    ctaOpportunity: 91,
    leadPotential: 94,
  },
  'demo-clip-0004': {
    clipId: 'demo-clip-0004',
    viralPotential: 72,
    hookStrength: 64,
    clarity: 90,
    emotionalImpact: 74,
    ctaOpportunity: 68,
    leadPotential: 58,
  },
  'demo-clip-0005': {
    clipId: 'demo-clip-0005',
    viralPotential: 77,
    hookStrength: 79,
    clarity: 86,
    emotionalImpact: 69,
    ctaOpportunity: 66,
    leadPotential: 52,
  },
  'demo-clip-0006': {
    clipId: 'demo-clip-0006',
    viralPotential: 63,
    hookStrength: 58,
    clarity: 61,
    emotionalImpact: 71,
    ctaOpportunity: 75,
    leadPotential: 66,
  },
};

export const demoStrategies: Record<string, ClipStrategy> = {
  'demo-clip-0001': {
    clipId: 'demo-clip-0001',
    hookAnalysis:
      'Leads with a specific dollar figure and the word “mistake” — loss-framing plus specificity is the strongest opener in this episode. Viewers know within 2 seconds whether this is for them.',
    audienceRelevance:
      'Directly targets freelancers and consultants who suspect they’re undercharging — the exact pain point set for this project.',
    emotionalTrigger:
      'Fear of leaving money on the table, followed by relief when the fix sounds achievable.',
    curiosityMechanism:
      'The mistake is named but not explained until second 9, creating an open loop the viewer stays to close.',
    retentionRisk:
      'Mid-clip (sec 18–24) has a slower explanatory stretch; a keyword caption highlight or zoom cut there would protect completion rate.',
    bestPlatform: 'tiktok',
    postingAngle:
      'Post as a duet-able “hard truth” — invite freelancers to comment their rate before and after watching.',
    suggestedCta: 'Comment “RATE” and I’ll send the pricing script.',
    improvement:
      'Trim 1.5s of breath before the first sentence and add a price-tag emoji to the opening caption line.',
  },
  'demo-clip-0002': {
    clipId: 'demo-clip-0002',
    hookAnalysis:
      'Contrarian reframe (“discounts destroy trust”) contradicts common advice, which reliably stops scrolls from business audiences.',
    audienceRelevance:
      'Consultants who feel pressured into discounting will feel personally called out — high comment likelihood.',
    emotionalTrigger: 'Indignation and self-recognition — “I’ve done this.”',
    curiosityMechanism: 'Claims a hidden second cost of discounting that isn’t revealed until the client story lands.',
    retentionRisk: 'Story runs 58s; consider a 40s cut for TikTok where completion decays faster.',
    bestPlatform: 'instagram_reels',
    postingAngle: 'Frame as a save-worthy rule: “The discount rule I give every client.”',
    suggestedCta: 'Save this for your next pricing call.',
    improvement: 'Add a mid-clip text card with the one-line rule to make it screenshot-able.',
  },
  'demo-clip-0003': {
    clipId: 'demo-clip-0003',
    hookAnalysis:
      'Opens with “say this exactly” — a direct utility promise. Weaker curiosity than clip 1 but the strongest save trigger.',
    audienceRelevance: 'Tactical script content matches the “negotiation” priority topic set for this project.',
    emotionalTrigger: 'Confidence — the viewer can imagine using the script tomorrow.',
    curiosityMechanism: 'The “three things” in the script are enumerated one at a time.',
    retentionRisk: 'Low — the enumeration structure holds attention well.',
    bestPlatform: 'youtube_shorts',
    postingAngle: 'Pair with a lead magnet: full script PDF in exchange for an email.',
    suggestedCta: 'Grab the full anchor-price script — link in bio.',
    improvement: 'Highlight the “X and 2X” phrase in the captions; it’s the quotable core.',
  },
  'demo-clip-0004': {
    clipId: 'demo-clip-0004',
    hookAnalysis:
      'Result-first personal claim. Solid, but the first sentence takes 6 seconds — slow for short-form.',
    audienceRelevance: 'Proof stories land best with a professional LinkedIn audience already considering a raise.',
    emotionalTrigger: 'Hope — “if it worked for them, it can work for me.”',
    curiosityMechanism: 'Tension between the expected client exodus and the actual outcome.',
    retentionRisk: 'Slow open is the main risk; front-load the outcome (“zero clients lost”) in the caption.',
    bestPlatform: 'linkedin',
    postingAngle: 'Post natively on LinkedIn with a first-comment breakdown of the renewal conversation.',
    suggestedCta: 'Repost this for the freelancer who needs it.',
    improvement: 'Cut straight to “I doubled my rate in January” and drop the wind-up sentence.',
  },
  'demo-clip-0005': {
    clipId: 'demo-clip-0005',
    hookAnalysis: 'Metaphor-led open. Memorable, but abstract openers underperform concrete ones by ~15% for this audience.',
    audienceRelevance: 'Reinforces the same pricing insight as clip 1 — good B-test, don’t post both the same week.',
    emotionalTrigger: 'The “aha” of a familiar situation reframed.',
    curiosityMechanism: 'Doctor analogy sets up an expectation gap resolved in the last line.',
    retentionRisk: 'Moderate — no stakes until second 12.',
    bestPlatform: 'instagram_reels',
    postingAngle: 'Use as the follow-up post a few days after clip 1 to reinforce the theme.',
    suggestedCta: 'Follow for the full pricing series.',
    improvement: 'Open on “You’re paying for the diagnosis” and let the analogy explain backwards.',
  },
  'demo-clip-0006': {
    clipId: 'demo-clip-0006',
    hookAnalysis: 'Question-led open works for Q&A formats, but the audience question audio is faint for the first 4 seconds.',
    audienceRelevance: 'Addresses the most common objection in the comments of similar content — high reply value.',
    emotionalTrigger: 'Validation — the viewer’s own objection is taken seriously before being challenged.',
    curiosityMechanism: 'The blunt reframe (“market problem, not pricing problem”) invites agreement or pushback.',
    retentionRisk: 'High in the first 4 seconds due to audio; re-record or caption the question as a text card.',
    bestPlatform: 'youtube_shorts',
    postingAngle: 'Publish as a reply-style short: “You asked, here’s the honest answer.”',
    suggestedCta: 'Drop your pricing question for the next episode.',
    improvement: 'Replace the faint question audio with an on-screen text card of the question.',
  },
};

export const demoCopy: Record<string, GeneratedCopy> = {
  'demo-clip-0001': {
    id: 'demo-copy-0001',
    clipId: 'demo-clip-0001',
    hooks: [
      'The $10K mistake almost every freelancer makes',
      'You’re not underpaid. You’re underpriced — here’s the difference.',
      'Stop pricing your hours. Start pricing this instead.',
    ],
    titles: [
      'The $10K Freelancer Mistake',
      'Price the Outcome, Not the Hours',
      'Why Hourly Pricing Is Costing You $10K a Year',
    ],
    captions: [
      'Most freelancers lose five figures a year to one pricing habit. Here’s the fix — and the exact reframe to use on your next proposal. 💸',
      'Hourly pricing punishes you for being fast. Outcome pricing rewards you for being good. Which one are you charging?',
    ],
    ctaOptions: [
      'Comment “RATE” and I’ll send the pricing script.',
      'Follow for the full pricing psychology series.',
      'Save this before your next client call.',
    ],
    hashtagsByPlatform: {
      tiktok: ['#freelancer', '#pricing', '#freelancetips', '#solopreneur', '#businesstok'],
      instagram_reels: ['#freelancelife', '#pricingstrategy', '#consultingtips', '#creatorbusiness'],
      youtube_shorts: ['#freelancing', '#pricing', '#business'],
    },
    thumbnailIdeas: [
      'Big “$10K” in brand coral over a shocked mid-gesture freeze frame',
      'Split card: “HOURS” crossed out / “OUTCOMES” highlighted',
      'Caption bar: “the mistake 90% of freelancers make”',
    ],
    postingStrategy:
      'Lead the week with this clip — it has the strongest hook of the batch. Post at your audience’s morning commute window, pin the CTA comment immediately, and reply to every “RATE” comment within the first hour to feed the algorithm early engagement.',
    recommendedPostingTime: 'Tue 8:00 AM (audience local time) — placeholder until social accounts are connected',
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
};

/** Fallback content package used for clips without bespoke copy in the demo set. */
export const demoCopyFallback = (clipId: string): GeneratedCopy => ({
  ...demoCopy['demo-clip-0001'],
  id: `demo-copy-${clipId}`,
  clipId,
});

export const demoNotifications: AppNotification[] = [
  {
    id: 'demo-notif-0001',
    userId: DEMO_USER_ID,
    kind: 'processing_complete',
    title: 'Your clips are ready',
    body: '“Podcast Ep. 42 — Pricing Psychology” produced 6 clips. Top score: 92.',
    readAt: null,
    createdAt: iso(3 * DAY - 2 * HOUR),
  },
  {
    id: 'demo-notif-0002',
    userId: DEMO_USER_ID,
    kind: 'usage_low',
    title: '38 processing minutes left',
    body: 'You’ve used 22 of 60 free minutes this cycle.',
    readAt: iso(DAY),
    createdAt: iso(2 * DAY),
  },
];

/** Demonstration analytics — always labeled as sample data in the UI. */
export const demoAnalytics = {
  totalClips: 14,
  minutesProcessed: 22,
  clipsExported: 9,
  clipsPublished: 5,
  views: 48_200,
  avgWatchPct: 61,
  engagementRate: 7.4,
  leadsAttributed: 12,
  topHook: 'The $10K mistake almost every freelancer makes',
  topTopic: 'Pricing psychology',
  bestPlatform: 'tiktok' as const,
  bestLengthSec: 34,
  weeklyTrend: [3, 5, 2, 8, 6, 9, 14] as number[],
  recommendations: [
    'Your question-led hooks outperform statement hooks by 22% — brief the next project toward Q&A moments.',
    'Clips between 30–40s hold the highest completion rate for your audience.',
    'TikTok drives 3× the reach of Reels for you, but Reels drives 2× the profile taps — split CTAs accordingly.',
  ],
};
