// app/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "doctor" | "staff";
  createdAt: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
  notes?: string;
}

// Patient Types
export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  name: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  medications?: string[];
}

// Call Log Types
export interface CallLog {
  id: string;
  patientId: string;
  patientName: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: "active" | "completed" | "failed";
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  createdAt: string;
}

// Analytics Types
export interface DashboardAnalytics {
  totalPatients: number;
  totalAppointments: number;
  totalCalls: number;
  activeSessions: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  callsToday: number;
  averageCallDuration: number;
  patientGrowth: number;
}

export interface AnalyticsReport {
  period: "day" | "week" | "month" | "year";
  startDate: string;
  endDate: string;
  metrics: {
    appointments: number;
    calls: number;
    patients: number;
    averageDuration: number;
  };
  trends: {
    date: string;
    appointments: number;
    calls: number;
  }[];
}

// Session Types
export interface Session {
  id: string;
  patientId: string;
  patientName: string;
  status: "active" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  duration?: number;
  callLogId?: string;
}

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category: string;
  isActive?: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
