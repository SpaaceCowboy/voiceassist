// All landing copy + seed data in one place. Every name, number and line on
// the page comes from here — no lorem ipsum, no placeholders.

export type Caller = {
  name: string;
  action: string;
  detail: string;
  status: "booked" | "rescheduled" | "callback" | "routed" | "resolved";
};

export const CALLERS: Caller[] = [
  {
    name: "Sarah Chen",
    action: "Booked annual physical",
    detail: "Dr. Patel · Thu 9:40 AM",
    status: "booked",
  },
  {
    name: "Marcus Reyes",
    action: "Rescheduled dermatology follow-up",
    detail: "Dr. Okafor · Mon 2:15 PM",
    status: "rescheduled",
  },
  {
    name: "Aisha Brennan",
    action: "New patient intake · pediatrics",
    detail: "Requested callback",
    status: "callback",
  },
  {
    name: "Daniel Lindqvist",
    action: "Rx refill question",
    detail: "Routed to pharmacy line",
    status: "routed",
  },
  {
    name: "Priya Natarajan",
    action: "Insurance question",
    detail: "FAQ resolved — no transfer",
    status: "resolved",
  },
];

export const PROVIDERS = [
  "Dr. Patel",
  "Dr. Okafor",
  "Dr. Whitfield",
  "Dr. Sato",
  "Dr. Alvarez",
];

export type Metric = {
  target: number;
  decimals?: number;
  suffix?: string;
  label: string;
  format?: (n: number) => string;
};

export const METRICS: Metric[] = [
  {
    target: 1247,
    label: "Calls handled this week",
    format: (n) => Math.round(n).toLocaleString("en-US"),
  },
  { target: 94.2, decimals: 1, suffix: "%", label: "Answered within 2 rings" },
  { target: 38, suffix: "%", label: "Deflected from the front desk" },
  { target: 11.4, decimals: 1, suffix: " hrs", label: "Receptionist time recovered" },
  {
    target: 134,
    label: "Average call duration",
    format: (n) => `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`,
  },
  { target: 312, label: "After-hours calls captured" },
];

// Hero live transcript — types over ~6s, then loops.
export const TRANSCRIPT: { speaker: "Caller" | "VoiceAssist"; text: string }[] = [
  { speaker: "Caller", text: "Hi, I need to reschedule my appointment with Dr. Patel." },
  {
    speaker: "VoiceAssist",
    text: "Of course. I see your appointment is Thursday at 9:40. What day works better?",
  },
  { speaker: "Caller", text: "Maybe next Monday afternoon." },
  {
    speaker: "VoiceAssist",
    text: "Dr. Patel has 2:15 PM open on Monday. Shall I move it there?",
  },
];

export const LOGOS = [
  "Northside Family Health",
  "Bay Cove Medical Group",
  "Cedar Valley Clinics",
  "Helix Pediatrics",
  "Meridian Primary Care",
];

export const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
];

export const PROBLEMS = [
  {
    stat: "1 in 3",
    title: "calls go unanswered",
    body: "At a busy front desk, a third of inbound calls hit hold music or voicemail — and most callers never call back.",
  },
  {
    stat: "After hours",
    title: "the phone just stops",
    body: "Evenings and weekends are when patients actually have time to call. That window is dead air for most clinics.",
  },
  {
    stat: "11+ hrs",
    title: "lost to the phone weekly",
    body: "Scheduling, refills, insurance questions — repetitive calls pull your staff away from the patients in the room.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "A patient calls",
    body: "The assistant answers on the first ring, 24/7 — no menus, no “press 1,” no hold music.",
  },
  {
    n: "02",
    title: "It listens and understands",
    body: "Twilio carries the call, Deepgram transcribes it live, and OpenAI turns natural speech into intent.",
  },
  {
    n: "03",
    title: "It takes the action",
    body: "Books, reschedules, answers an FAQ, or routes to the right line — speaking back in real time.",
  },
  {
    n: "04",
    title: "Your team sees everything",
    body: "Every call, transcript and outcome lands on the dashboard the moment it happens.",
  },
];

export const FEATURES = [
  {
    icon: "PhoneIcon",
    title: "Calls & transcripts",
    body: "Every conversation captured, transcribed and searchable — with the outcome attached.",
  },
  {
    icon: "CalendarIcon",
    title: "Scheduling",
    body: "Books, reschedules and cancels straight into your calendar, honouring provider availability.",
  },
  {
    icon: "HeartPulseIcon",
    title: "Patients",
    body: "Recognises returning callers, pulls their history, and greets them by name.",
  },
  {
    icon: "HelpIcon",
    title: "FAQ deflection",
    body: "Hours, location, insurance and prep questions answered from your own knowledge base — no transfer.",
  },
];

export const SECURITY = [
  { icon: "ShieldIcon", title: "HIPAA-ready", body: "PHI handled under a signed BAA, with least-privilege access throughout." },
  { icon: "CheckCircleIcon", title: "SOC 2 in progress", body: "Type II controls underway; audit logging on every patient interaction." },
  { icon: "ActivityIcon", title: "Encrypted end to end", body: "TLS in transit, AES-256 at rest, across calls, transcripts and records." },
];

export const TESTIMONIAL = {
  quote:
    "We stopped losing patients to voicemail overnight. The dashboard tells us exactly what every call was about — and our front desk finally has room to breathe.",
  name: "Operations Lead",
  org: "Cedar Valley Clinics",
};

export type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$299",
    cadence: "per location / month",
    blurb: "For a single practice that wants the phone covered.",
    features: ["24/7 call answering", "Booking & rescheduling", "FAQ deflection", "Live dashboard"],
    cta: "Book a demo",
  },
  {
    name: "Clinic",
    price: "$599",
    cadence: "per location / month",
    blurb: "For busy clinics that live and die by the schedule.",
    features: [
      "Everything in Starter",
      "Patient recognition & history",
      "Smart call routing",
      "Analytics & reporting",
      "Priority support",
    ],
    cta: "Book a demo",
    featured: true,
  },
  {
    name: "Group",
    price: "Custom",
    cadence: "talk to us",
    blurb: "For multi-location groups and health systems.",
    features: ["Everything in Clinic", "Multi-location rollout", "EHR integration", "Dedicated success manager"],
    cta: "Contact sales",
  },
];
