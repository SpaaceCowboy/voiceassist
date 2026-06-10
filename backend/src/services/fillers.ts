// Short "stall" phrases played to the caller when the assistant takes longer
// than a couple of seconds to produce its first words. The text is drawn from
// memory (no LLM call) and the audio is served from the Redis TTS cache, so
// the caller hears something within the same beat instead of dead air.

import ttsService from './tts';
import logger from '../utils/logger';

export const FILLER_PHRASES: readonly string[] = [
  'One moment please.',
  'Let me check that for you.',
  'Just a second while I look that up.',
  'Hold on while I pull that up.',
  'Give me a moment, please.',
  'Bear with me one second.',
  'Let me look into that.',
  'Just pulling that information now.',
];

export type PickedFiller = { index: number; text: string };

// Returns a phrase that hasn't been used yet in this call, or null if every
// phrase has already been played (in which case stay silent rather than
// repeat — a duplicate "one moment" would be more jarring than dead air).
export function pickFiller(used: Set<number>): PickedFiller | null {
  const available: number[] = [];
  for (let i = 0; i < FILLER_PHRASES.length; i++) {
    if (!used.has(i)) available.push(i);
  }
  if (available.length === 0) return null;
  const index = available[Math.floor(Math.random() * available.length)];
  return { index, text: FILLER_PHRASES[index] };
}

// Generate + cache every filler at boot so the first playback is a cache hit.
export async function prewarmFillerCache(): Promise<void> {
  let generated = 0;
  for (const phrase of FILLER_PHRASES) {
    try {
      await ttsService.textToSpeech(phrase);
      generated++;
    } catch {
      // non-critical
    }
  }
  logger.info('Filler TTS prewarm complete', { generated, total: FILLER_PHRASES.length });
}

export default {
  FILLER_PHRASES,
  pickFiller,
  prewarmFillerCache,
};
