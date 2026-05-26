import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Session, Patient, Appointment } from '../../types/index';

// ==========================================
// Hoisted mocks
// ==========================================

const m = vi.hoisted(() => ({
  redis: {
    setSession: vi.fn(),
    getSession: vi.fn(),
    addMessage: vi.fn(),
    updateSessionState: vi.fn(),
    deleteSession: vi.fn(),
  },
  db: { query: vi.fn() },
  patientModel: { findOrCreate: vi.fn() },
  callLogModel: {
    create: vi.fn(),
    appendToTranscript: vi.fn(),
    completeCall: vi.fn(),
    markTransferred: vi.fn(),
  },
  sessionModel: { upsertSession: vi.fn(), markInactive: vi.fn() },
  appointmentModel: { findUpcomingByPatient: vi.fn() },
  faqModel: { findMatch: vi.fn() },
  openaiService: {
    chat: vi.fn(),
    continueAfterFunctionCall: vi.fn(),
    generateCallSummary: vi.fn(),
    detectIntent: vi.fn(),
    analyzeSentiment: vi.fn(),
  },
  ttsService: { textToSpeech: vi.fn() },
}));

vi.mock('../config/redis', () => ({
  default: m.redis,
  ...m.redis,
}));

vi.mock('../config/database', () => ({
  default: m.db,
  query: m.db.query,
}));

vi.mock('../models', () => ({
  patientModel: m.patientModel,
  callLogModel: m.callLogModel,
  sessionModel: m.sessionModel,
  appointmentModel: m.appointmentModel,
  faqModel: m.faqModel,
}));

vi.mock('./openai', () => ({ default: m.openaiService }));
vi.mock('./tts', () => ({ default: m.ttsService }));

import {
  initializeConversation,
  generateGreeting,
  processInput,
  handleCallEnded,
} from './conversation';

// ==========================================
// Fixtures
// ==========================================

const patient: Patient = {
  id: 42,
  phone: '+15551234567',
  full_name: 'Alice Smith',
  total_appointments: 2,
} as Patient;

const upcomingAppt: Appointment = {
  id: 1,
  appointment_date: '2026-06-01',
  appointment_time: '10:00',
} as Appointment;

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    callSid: 'CA123',
    patient,
    upcomingAppointments: [upcomingAppt],
    state: {
      currentStep: 'greeting',
      confirmationPending: false,
      pendingAppointment: null,
      transferRequested: false,
      endRequested: false,
    },
    messageHistory: [],
    collectedData: {},
    createdAt: new Date(),
    ...overrides,
  };
}

function resetAllMocks() {
  Object.values(m).forEach((group: any) => {
    Object.values(group).forEach((fn: any) => fn.mockReset?.());
  });
}

beforeEach(() => {
  resetAllMocks();
  // Sensible defaults so every test doesn't redeclare them.
  m.db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  m.ttsService.textToSpeech.mockResolvedValue(Buffer.from('audio'));
  m.openaiService.generateCallSummary.mockResolvedValue('summary');
  m.openaiService.detectIntent.mockResolvedValue('booking');
  m.openaiService.analyzeSentiment.mockResolvedValue({ sentiment: 'positive', score: 0.8 });
});

// ==========================================
// initializeConversation
// ==========================================

describe('initializeConversation', () => {
  it('creates patient + call log + session and persists to redis & db', async () => {
    m.patientModel.findOrCreate.mockResolvedValueOnce(patient);
    m.appointmentModel.findUpcomingByPatient.mockResolvedValueOnce([upcomingAppt]);
    m.callLogModel.create.mockResolvedValueOnce(undefined);
    m.redis.setSession.mockResolvedValueOnce(undefined);
    m.sessionModel.upsertSession.mockResolvedValueOnce(undefined);

    const session = await initializeConversation('CA123', '+15551234567', '+15557654321');

    expect(m.patientModel.findOrCreate).toHaveBeenCalledWith('+15551234567');
    expect(m.appointmentModel.findUpcomingByPatient).toHaveBeenCalledWith(42);
    expect(m.callLogModel.create).toHaveBeenCalledWith('CA123', '+15551234567', '+15557654321', 42);

    expect(session.callSid).toBe('CA123');
    expect(session.patient).toBe(patient);
    expect(session.upcomingAppointments).toEqual([upcomingAppt]);
    expect(session.state.currentStep).toBe('greeting');
    expect(session.messageHistory).toEqual([]);

    expect(m.redis.setSession).toHaveBeenCalledWith('CA123', session);
    expect(m.sessionModel.upsertSession).toHaveBeenCalledWith(
      'CA123', session.state, session.messageHistory, session.collectedData, true,
    );
  });
});

// ==========================================
// generateGreeting — branches by patient state
// ==========================================

describe('generateGreeting', () => {
  it('throws if session is missing', async () => {
    m.redis.getSession.mockResolvedValueOnce(null);
    await expect(generateGreeting('missing')).rejects.toThrow(/Session not found/);
  });

  it('uses returning-customer-with-appointment greeting', async () => {
    m.redis.getSession.mockResolvedValueOnce(makeSession());

    const result = await generateGreeting('CA123');

    expect(result.text).toMatch(/Alice Smith/);
    expect(result.text).toMatch(/appointment coming up/);
    expect(result.audio).toBeInstanceOf(Buffer);
    expect(m.redis.addMessage).toHaveBeenCalledWith(
      'CA123',
      expect.objectContaining({ role: 'assistant', content: result.text }),
    );
    expect(m.redis.updateSessionState).toHaveBeenCalledWith('CA123', { currentStep: 'listening' });
  });

  it('uses returning-customer-no-appointment greeting', async () => {
    m.redis.getSession.mockResolvedValueOnce(makeSession({ upcomingAppointments: [] }));

    const result = await generateGreeting('CA123');

    expect(result.text).toMatch(/Alice Smith/);
    expect(result.text).not.toMatch(/coming up/);
  });

  it('uses new-customer greeting when patient has no name', async () => {
    const newPatient = { ...patient, full_name: null } as Patient;
    m.redis.getSession.mockResolvedValueOnce(
      makeSession({ patient: newPatient, upcomingAppointments: [] }),
    );

    const result = await generateGreeting('CA123');

    expect(result.text).toMatch(/AI assistant/);
    expect(result.text).not.toMatch(/Alice/);
  });

  it('returns text even when TTS fails', async () => {
    m.redis.getSession.mockResolvedValueOnce(makeSession({ upcomingAppointments: [] }));
    m.ttsService.textToSpeech.mockRejectedValueOnce(new Error('tts down'));

    const result = await generateGreeting('CA123');

    expect(result.text.length).toBeGreaterThan(0);
    expect(result.audio).toBeUndefined();
    // Greeting still added to history even though audio failed.
    expect(m.redis.addMessage).toHaveBeenCalled();
  });

  it('honors BUSINESS_NAME env var', async () => {
    process.env.BUSINESS_NAME = 'TestClinic';
    m.redis.getSession.mockResolvedValueOnce(makeSession({ upcomingAppointments: [] }));

    const result = await generateGreeting('CA123');
    expect(result.text).toContain('TestClinic');

    delete process.env.BUSINESS_NAME;
  });
});

// ==========================================
// processInput
// ==========================================

describe('processInput', () => {
  it('throws if session is missing', async () => {
    m.redis.getSession.mockResolvedValueOnce(null);
    await expect(processInput('missing', 'hi')).rejects.toThrow(/Session not found/);
  });

  it('handles a plain (non-function-call) response: history, transcript, no TTS', async () => {
    const session = makeSession();
    // session lookups: initial, refresh after addMessage
    m.redis.getSession
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session);
    m.openaiService.chat.mockResolvedValueOnce({ content: 'Sure, I can help.', functionCall: null });

    const result = await processInput('CA123', 'I need an appointment');

    expect(result.text).toBe('Sure, I can help.');
    expect(result.shouldEnd).toBe(false);
    expect(result.shouldTransfer).toBe(false);
    // TTS is now handled by the route layer, not processInput
    expect(m.ttsService.textToSpeech).not.toHaveBeenCalled();

    // User input added to message history first.
    expect(m.redis.addMessage).toHaveBeenCalledWith(
      'CA123',
      expect.objectContaining({ role: 'user', content: 'I need an appointment' }),
    );
    // Assistant response added afterward.
    expect(m.redis.addMessage).toHaveBeenCalledWith(
      'CA123',
      expect.objectContaining({ role: 'assistant', content: 'Sure, I can help.' }),
    );
    // Transcript persisted (both sides).
    expect(m.callLogModel.appendToTranscript).toHaveBeenCalledWith('CA123', 'user', 'I need an appointment');
    expect(m.callLogModel.appendToTranscript).toHaveBeenCalledWith('CA123', 'assistant', 'Sure, I can help.');
    // continueAfterFunctionCall never invoked on the no-function path.
    expect(m.openaiService.continueAfterFunctionCall).not.toHaveBeenCalled();
  });

  it('executes a function call and propagates shouldTransfer', async () => {
    const session = makeSession();
    // session reads: initial, refresh, executeFunctionCall lookup
    m.redis.getSession
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session);

    m.openaiService.chat.mockResolvedValueOnce({
      content: null,
      functionCall: {
        id: 'tool-1',
        name: 'transfer_to_staff',
        arguments: { reason: 'complex_request' },
      },
    });
    m.openaiService.continueAfterFunctionCall.mockResolvedValueOnce({
      content: 'Transferring you now.',
      functionCall: null,
      usage: null,
    });

    const result = await processInput('CA123', 'speak to a person please');

    expect(result.shouldTransfer).toBe(true);
    expect(result.transferReason).toBe('complex_request');
    expect(result.shouldEnd).toBe(false);
    expect(result.text).toBe('Transferring you now.');

    expect(m.openaiService.continueAfterFunctionCall).toHaveBeenCalledWith(
      session.messageHistory,
      'transfer_to_staff',
      expect.objectContaining({ shouldTransfer: true, transferReason: 'complex_request' }),
      'tool-1',
      expect.any(Object),
    );
  });

  it('executes end_call and propagates shouldEnd', async () => {
    const session = makeSession();
    m.redis.getSession
      .mockResolvedValueOnce(session)   // initial
      .mockResolvedValueOnce(session)   // refresh after addMessage
      .mockResolvedValueOnce(session)   // executeFunctionCall
      .mockResolvedValueOnce(session);  // handleEndCall refresh

    m.openaiService.chat.mockResolvedValueOnce({
      content: null,
      functionCall: { id: 't', name: 'end_call', arguments: { reason: 'patient_goodbye' } },
    });
    m.openaiService.continueAfterFunctionCall.mockResolvedValueOnce({
      content: 'Have a great day!',
      functionCall: null,
      usage: null,
    });

    const result = await processInput('CA123', 'bye');

    expect(result.shouldEnd).toBe(true);
    expect(result.text).toBe('Have a great day!');
    // end_call invokes call-log completion + session cleanup
    expect(m.callLogModel.completeCall).toHaveBeenCalled();
    expect(m.sessionModel.markInactive).toHaveBeenCalledWith('CA123');
    expect(m.redis.deleteSession).toHaveBeenCalledWith('CA123');
  });

  it('breaks tool loop on duplicate back-to-back tool calls', async () => {
    const session = makeSession();
    m.redis.getSession
      .mockResolvedValueOnce(session)   // initial
      .mockResolvedValueOnce(session)   // refresh
      .mockResolvedValueOnce(session);  // executeFunctionCall (round 0)

    const toolCall = {
      id: 'tool-1',
      name: 'check_availability',
      arguments: { date: '2026-05-28', time: '10:00', doctor_name: 'Dr. Parsa' },
    };

    // Initial LLM response triggers tool call
    m.openaiService.chat.mockResolvedValueOnce({
      content: null,
      functionCall: toolCall,
    });
    // After first tool execution, Claude returns the same tool call again
    m.openaiService.continueAfterFunctionCall.mockResolvedValueOnce({
      content: null,
      functionCall: { ...toolCall, id: 'tool-2' },
      usage: null,
    });

    m.db.query.mockResolvedValue({ rows: [{ slot_time: '10:00', is_available: true }], rowCount: 1 });

    const result = await processInput('CA123', 'check availability');

    expect(result.text).toContain("didn't quite catch that");
    // Only one tool execution — the duplicate was caught before executing
    expect(m.openaiService.continueAfterFunctionCall).toHaveBeenCalledTimes(1);
  });

  it('returns text without generating TTS (route layer handles TTS)', async () => {
    const session = makeSession();
    m.redis.getSession
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(session);
    m.openaiService.chat.mockResolvedValueOnce({ content: 'Here is your info.', functionCall: null });

    const result = await processInput('CA123', 'what appointments do I have');

    expect(result.text).toBe('Here is your info.');
    expect(m.ttsService.textToSpeech).not.toHaveBeenCalled();
    expect(m.redis.addMessage).toHaveBeenCalledWith(
      'CA123',
      expect.objectContaining({ role: 'assistant', content: 'Here is your info.' }),
    );
  });

  it('omits TTS + history append when response text is empty', async () => {
    const session = makeSession();
    m.redis.getSession.mockResolvedValueOnce(session).mockResolvedValueOnce(session);
    m.openaiService.chat.mockResolvedValueOnce({ content: '', functionCall: null });

    const result = await processInput('CA123', 'hello');

    expect(result.text).toBe('');
    expect(result.audio).toBeUndefined();
    expect(m.ttsService.textToSpeech).not.toHaveBeenCalled();
    // Only the *user* message got added (no assistant message for empty response).
    const assistantAdds = m.redis.addMessage.mock.calls.filter(
      ([, msg]: any) => msg.role === 'assistant',
    );
    expect(assistantAdds).toHaveLength(0);
  });
});

// ==========================================
// handleCallEnded — Twilio status callback path
// ==========================================

describe('handleCallEnded', () => {
  it('persists transcript + cleans up when session exists', async () => {
    const session = makeSession({
      messageHistory: [
        { role: 'user', content: 'hi', timestamp: new Date() } as any,
        { role: 'assistant', content: 'hello!', timestamp: new Date() } as any,
      ],
    });
    m.redis.getSession.mockResolvedValueOnce(session);

    await handleCallEnded('CA123', { status: 'completed', duration: 42 });

    expect(m.callLogModel.completeCall).toHaveBeenCalledWith('CA123', {
      status: 'completed',
      durationSeconds: 42,
      transcript: '[user]: hi\n[assistant]: hello!',
    });
    expect(m.sessionModel.markInactive).toHaveBeenCalledWith('CA123');
    expect(m.redis.deleteSession).toHaveBeenCalledWith('CA123');
  });

  it('still cleans up when no session is in redis', async () => {
    m.redis.getSession.mockResolvedValueOnce(null);

    await handleCallEnded('CA123', { status: 'completed', duration: 0 });

    expect(m.callLogModel.completeCall).not.toHaveBeenCalled();
    expect(m.sessionModel.markInactive).toHaveBeenCalledWith('CA123');
    expect(m.redis.deleteSession).toHaveBeenCalledWith('CA123');
  });
});
