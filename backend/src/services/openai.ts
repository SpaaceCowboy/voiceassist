import OpenAI from 'openai'
import logger from '../utils/logger'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

import { chat, continueAfterFunctionCall } from './llm';
export { chat, continueAfterFunctionCall };

  // analysis function

  export async function generateCallSummary(transcript: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Summarize this medical clinic phone call transcript in 2-3 sentences. Focus on the main topic, outcome, and any appointments booked or actions taken.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      });
  
      return response.choices[0].message.content || 'Unable to generate summary';
    } catch (error) {
      logger.error('Failed to generate call summary', error);
      return 'Unable to generate summary';
    }
  }

  // detect the primary intent of a call

  export async function detectIntent(transcript: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Classify the primary intent of this medical clinic phone call into one of these categories:
  - new_appointment: Patient wants to schedule a new appointment
  - reschedule_appointment: Patient wants to change an existing appointment
  - cancel_appointment: Patient wants to cancel an appointment
  - appointment_inquiry: Patient asking about their existing appointments
  - department_inquiry: Patient asking about departments, doctors, or services
  - insurance_question: Patient asking about insurance or billing
  - faq: General questions about hours, location, what to bring, etc.
  - medical_concern: Patient describing symptoms or asking medical questions
  - complaint: Patient has a complaint
  - other: Doesn't fit other categories
  Respond with only the category name.`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0,
        max_tokens: 20,
      });
  
      return response.choices[0].message.content?.toLowerCase().trim() || 'other';
    } catch (error) {
      logger.error('Failed to detect intent', error);
      return 'unknown';
    }
  }

  export async function analyzeSentiment(
    transcript: string
  ): Promise<{ sentiment: string; score: number }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the patient's sentiment in this medical clinic phone call.
  Consider that patients calling a neurosurgery clinic may be in pain or anxious.
  Respond with a JSON object containing:
  - sentiment: "positive", "neutral", or "negative"
  - score: a number from -1.0 (very negative) to 1.0 (very positive)
  Example: {"sentiment": "positive", "score": 0.7}`,
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0,
        max_tokens: 50,
      });
  
      const raw = response.choices[0].message.content || '';
      const content = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(content);
  
      return {
        sentiment: parsed.sentiment || 'neutral',
        score: typeof parsed.score === 'number' ? parsed.score : 0,
      };
    } catch (error) {
      logger.error('Failed to analyze sentiment', error);
      return { sentiment: 'neutral', score: 0 };
    }
  }

  export default {
    chat,
    continueAfterFunctionCall,
    generateCallSummary,
    detectIntent,
    analyzeSentiment,
  };