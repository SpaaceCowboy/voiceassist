// lib/api/voiceAssistantApi.ts

import { toQuery } from "@/lib/query";

import {
  backendGet,
  backendPost,
  backendPatch,
  backendDelete,
} from "../backend";
import type {
  Appointment,
  Patient,
  CallLogDetail,
  SessionStats,
  IntentAnalytics,
  HourlyAnalytics,
  FaqItem,
  User,
  ReservationListItem,
  ReservationDetail,
} from "../types";

// ============ Health Check ============
export const getHealth = () => backendGet("/api/health");

// ============ Appointments ============
export type ApiList<T> = { success: boolean; data: T[]; count: number };
export type ApiOne<T> = { success: boolean; data: T };

// GET /api/appointments?date=&status=&limit=&offset=
export const getAppointments = (params?: {
  date?: string; // YYYY-MM-DD
  status?: string; // scheduled, confirmed, ...
  limit?: number;
  offset?: number;
}) => {
  const query = toQuery({
    date: params?.date || undefined,
    status: params?.status || undefined,
    limit: params?.limit,
    offset: params?.offset,
  });
  return backendGet<ApiList<Appointment>>(`/api/appointments${query}`);
};

export const getAppointment = (id: string) =>
  backendGet<ApiOne<Appointment>>(`/api/appointments/${id}`);

export const updateAppointment = (id: string, data: Partial<Appointment>) =>
  backendPatch<ApiOne<Appointment>>(`/api/appointments/${id}`, data);

export const deleteAppointment = (id: string) =>
  backendDelete<{ success: boolean; message?: string }>(
    `/api/appointments/${id}`,
  );

// ============ Reservations ============
// GET /api/reservations
export const getReservations = () =>
  backendGet<{ success: boolean; data: ReservationListItem[]; count?: number }>(
    `/api/reservations`,
  );

export const getReservation = (id: string | number) =>
  backendGet<{ success: boolean; data: ReservationDetail }>(
    `/api/reservations/${id}`,
  );

// ============ Patients ============
export const searchPatients = (params: {
  q?: string;
  phone?: string;
  limit?: number;
  offset?: number;
}) => {
  const query = toQuery({
    q: params.q,
    phone: params.phone,
    limit: params.limit,
    offset: params.offset,
  });
  return backendGet<ApiList<Patient>>(`/api/patients/search${query}`);
};

export const getPatient = (id: string) =>
  backendGet<ApiOne<Patient>>(`/api/patients/${id}`);

export const updatePatient = (id: string, data: Partial<Patient>) =>
  backendPatch<ApiOne<Patient>>(`/api/patients/${id}`, data);

// Calls
export const getCalls = (params?: { limit?: number; offset?: number }) => {
  const query = toQuery({
    limit: params?.limit,
    offset: params?.offset,
  });
  return backendGet<{ success: boolean; data: CallLogDetail[]; count: number }>(
    `/api/calls${query}`,
  );
};

export const getCall = (callSid: string) =>
  backendGet<{ success: boolean; data: CallLogDetail }>(
    `/api/calls/${callSid}`,
  );

// Analytics
export const getAnalyticsOverview = () =>
  backendGet<{ success: boolean; data: IntentAnalytics }>(
    `/api/analytics/overview`,
  );

export const getIntentAnalytics = () =>
  backendGet<{ success: boolean; data: IntentAnalytics[] }>(
    `/api/analytics/intents`,
  );

export const getHourlyAnalytics = () =>
  backendGet<{ success: boolean; data: HourlyAnalytics[] }>(
    `/api/analytics/hourly`,
  );

// FAQs

export const getFaqs = (params?: { category?: string }) => {
  const query = toQuery({ category: params?.category });
  return backendGet<{ success: boolean; data: FaqItem[]; count?: number }>(
    `/api/faqs${query}`,
  );
};

export const getFaqCategories = () =>
  backendGet<{ success: boolean; data: string[] }>(`/api/faqs/categories`);

export const createFaq = (payload: {
  questionPattern: string;
  questionVariations?: string[];
  answer: string;
  answerShort?: string;
  category?: string;
  priority?: number;
  isActive?: boolean;
}) =>
  backendPost<{ success: boolean; data: FaqItem }>(`/api/faqs`, payload);

export const updateFaq = (
  id: string | number,
  payload: {
    questionPattern?: string;
    questionVariations?: string[];
    answer?: string;
    answerShort?: string;
    category?: string;
    priority?: number;
    isActive?: boolean;
  },
) =>
  backendPatch<{ success: boolean; data: FaqItem }>(
    `/api/faqs/${id}`,
    payload,
  );

export const deleteFaq = (id: string | number) =>
  backendDelete<{ success: boolean; message?: string }>(`/api/faqs/${id}`);

// Sessions
export const getSessionStats = () =>
  backendGet<{ success: boolean; data: SessionStats }>(`/api/sessions/stats`);

export const cleanupSessions = () =>
  backendPost<{ success: boolean; deleted: number; message: string }>(
    `/api/sessions/cleanup`,
    {},
  );
