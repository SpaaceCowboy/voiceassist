import { describe, it, expect } from 'vitest';
import type { ToolContext } from '../../types/index';
import {
  tools,
  getTools,
  getToolByName,
  getSystemPrompt,
  validateToolArgs,
} from './tools';

// ==========================================
// Tool catalog
// ==========================================

describe('tools catalog', () => {
  it('returns the same array via getTools()', () => {
    expect(getTools()).toBe(tools);
  });

  it('every tool is type=function with name + description + parameters', () => {
    for (const t of tools) {
      expect(t.type).toBe('function');
      expect(t.function.name).toMatch(/^[a-z_]+$/);
      expect(t.function.description.length).toBeGreaterThan(0);
      expect(t.function.parameters.type).toBe('object');
      expect(Array.isArray(t.function.parameters.required)).toBe(true);
    }
  });

  it('tool names are unique', () => {
    const names = tools.map((t) => t.function.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every required param appears in the properties map', () => {
    for (const t of tools) {
      const props = t.function.parameters.properties || {};
      for (const required of t.function.parameters.required) {
        expect(props).toHaveProperty(required);
      }
    }
  });

  it('exposes the expected toolset for the voice assistant', () => {
    const names = tools.map((t) => t.function.name).sort();
    expect(names).toEqual(
      [
        'answer_faq',
        'book_appointment',
        'cancel_appointment',
        'check_availability',
        'end_call',
        'get_department_info',
        'get_patient_appointments',
        'reschedule_appointment',
        'transfer_to_staff',
        'update_patient_info',
      ].sort()
    );
  });
});

// ==========================================
// getToolByName
// ==========================================

describe('getToolByName', () => {
  it('returns the matching tool', () => {
    const t = getToolByName('book_appointment');
    expect(t?.function.name).toBe('book_appointment');
  });

  it('returns undefined for an unknown tool', () => {
    expect(getToolByName('definitely_not_a_tool')).toBeUndefined();
  });
});

// ==========================================
// validateToolArgs
// ==========================================

describe('validateToolArgs', () => {
  it('returns valid when all required args are present', () => {
    expect(
      validateToolArgs('check_availability', { date: '2026-05-21', time: '10:00' })
    ).toEqual({ valid: true });
  });

  it('rejects unknown tool', () => {
    const result = validateToolArgs('no_such_tool', {});
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unknown tool/i);
  });

  it('rejects when a required param is undefined', () => {
    const result = validateToolArgs('check_availability', { date: '2026-05-21' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('time');
  });

  it('rejects when a required param is null', () => {
    const result = validateToolArgs('cancel_appointment', { appointment_id: null });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('appointment_id');
  });

  it('rejects when a required param is an empty string', () => {
    const result = validateToolArgs('answer_faq', { question: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('question');
  });

  it('accepts tools with no required params (e.g. get_patient_appointments)', () => {
    expect(validateToolArgs('get_patient_appointments', {})).toEqual({ valid: true });
  });

  it('does not validate extraneous params (only checks required presence)', () => {
    expect(
      validateToolArgs('check_availability', {
        date: '2026-05-21',
        time: '10:00',
        bogus_extra: 'whatever',
      })
    ).toEqual({ valid: true });
  });
});

// ==========================================
// getSystemPrompt
// ==========================================

const baseCtx: ToolContext = {
  patientPhone: '+15551234567',
  patientName: 'Alice Smith',
  appointmentCount: 2,
  currentDate: '2026-05-21',
  openingHour: '08:00',
  closingHour: '17:00',
  locations: ['Palmdale', 'Sherman Oaks'],
  departments: ['Neurosurgery', 'Neurology'],
};

describe('getSystemPrompt', () => {
  it('substitutes all placeholders from the context', () => {
    const prompt = getSystemPrompt(baseCtx);

    expect(prompt).toContain('+15551234567');
    expect(prompt).toContain('Alice Smith');
    expect(prompt).toContain('2');
    expect(prompt).toContain('2026-05-21');
    expect(prompt).toContain('08:00');
    expect(prompt).toContain('17:00');
    expect(prompt).toContain('1. Palmdale');
    expect(prompt).toContain('2. Sherman Oaks');
    expect(prompt).toContain('1. Neurosurgery');
    expect(prompt).toContain('2. Neurology');

    // No unsubstituted placeholders should remain.
    expect(prompt).not.toMatch(/\{[a-z_]+\}/);
  });

  it('falls back to "Unknown" when patientName is missing', () => {
    const prompt = getSystemPrompt({ ...baseCtx, patientName: '' });
    expect(prompt).toContain('Patient name: Unknown');
  });

  it('falls back to default locations when none provided', () => {
    const prompt = getSystemPrompt({ ...baseCtx, locations: [] });
    expect(prompt).toContain('Palmdale, Sherman Oaks, Valencia, Thousand Oaks');
  });

  it('falls back to default departments when none provided', () => {
    const prompt = getSystemPrompt({ ...baseCtx, departments: [] });
    expect(prompt).toContain('Neurosurgery, Neurology, Pain Management');
  });
});
