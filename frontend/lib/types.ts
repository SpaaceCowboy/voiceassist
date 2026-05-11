// lib/types.ts - Complete corrected version

// ============= Existing Types (Reservations) =============
export type ReservationListItem = {
  id: string | number;
  date?: string;
  time?: string;
  datetime?: string;
  customer_name?: string;
  customer_phone?: string;
  status?: "scheduled" | "canceled" | "completed" | "no_show" | string;
  department?: string;
  provider?: string;
  doctor?: string;
  reason?: string;
  created_via?: "ai" | "staff" | string;
  timezone?: string;
  callSid?: string;
  call_sid?: string;
};

export type ReservationDetail = ReservationListItem & {
  special_requests?: string;
  notes?: string;
};

// ============= Existing Types (Call Logs) =============
export type CallLogListItem = {
  callSid: string;
  created_at?: string;
  outcome?: "booked" | "transferred" | "faq_only" | "failed" | string;
  intent?: string;
  problem?: string;
  mood?: "calm" | "neutral" | "angry" | string;
  duration_seconds?: number;
  transfer_department?: string;
};

export type ToolCallEvent = {
  name: string;
  at: string;
  status: "ok" | "error" | string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type CallLogDetail = CallLogListItem & {
  transcript?: string;
  conversation?: Record<string, unknown>;
  tool_calls?: ToolCallEvent[];
  errors?: Record<string, unknown>[];
};

// ============= Existing Types (Analytics & FAQs) =============
export type AnalyticsOverview = {
  total_calls?: number;
  total_reservations?: number;
  transfers?: number;
  failures?: number;
};

export type FaqItem = {
  id: string | number;
  question: string;
  answer: string;
  category?: string;
  active?: boolean;
};

// ============= New Types (Healthcare Voice Assistant) =============

// User type (for authentication)
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
}

// Patient Management
export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  medical_record_number?: string;
  insurance_id?: string;
  primary_provider?: string;
  department?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Appointment Management
export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  provider: string;
  department: string;
  scheduled_time: string;
  duration_minutes: number;
  status:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  type: "initial" | "follow_up" | "urgent" | "routine";
  reason: string;
  notes?: string;
  call_sid?: string;
  created_at: string;
  updated_at: string;
  created_via?: "ai" | "manual" | "web";
}

// Voice Session & Transcript
export interface TranscriptSegment {
  id: string;
  speaker: "patient" | "assistant" | "system";
  text: string;
  timestamp: string;
  confidence?: number;
}

export interface VoiceSession {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  provider?: string;
  department?: string;
  status: "active" | "completed" | "failed" | "transferred";
  intent?: string;
  mood?: string;
  duration_seconds: number;
  created_at: string;
  transcript?: TranscriptSegment[];
  tool_calls?: ToolCallEvent[];
}

// Analytics
export interface SessionStats {
  total_sessions: number;
  active_sessions: number;
  completed_today: number;
  average_duration_seconds: number;
  transfer_rate: number;
  success_rate: number;
  top_intents: Array<{ intent: string; count: number }>;
  mood_distribution: Record<string, number>;
}

export interface IntentAnalytics {
  intent: string;
  count: number;
  percentage: number;
  avg_duration_seconds: number;
}

export interface HourlyAnalytics {
  hour: number;
  calls: number;
  appointments: number;
  transfers: number;
}

// Type aliases for backward compatibility
export type Reservation = Appointment;
export type CallLog = CallLogDetail;
