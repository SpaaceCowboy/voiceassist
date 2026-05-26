import OpenAI from 'openai'
import crypto from 'crypto'
import { cleanTextForSpeech } from '../utils/helpers'
import redis from '../config/redis'
import logger from '../utils/logger';
import type { TTSProvider, OpenAIVoice, OpenAITTSModel} from '../../types/index';

// configuration

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const TTS_PROVIDER: TTSProvider = (process.env.TTS_PROVIDER as TTSProvider) || 'openai'
const OPENAI_VOICE: OpenAIVoice = (process.env.OPENAI_TTS_VOICE as OpenAIVoice) || 'nova';
const OPENAI_MODEL: OpenAITTSModel = ((process.env.OPENAI_TTS_MODEL as string) || 'tts-1').toLowerCase() as OpenAITTSModel
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

// --- TTS cache ---
const TTS_CACHE_PREFIX = 'tts:';
const TTS_CACHE_TTL = 86400; // 24 hours

function getCacheKey(text: string): string {
  const cleaned = cleanTextForSpeech(text);
  const hash = crypto.createHash('sha256').update(`${TTS_PROVIDER}:${OPENAI_VOICE}:${OPENAI_MODEL}:${cleaned}`).digest('hex').slice(0, 16);
  return `${TTS_CACHE_PREFIX}${hash}`;
}

async function getCached(text: string): Promise<Buffer | null> {
  try {
    const key = getCacheKey(text);
    const data = await redis.client.getBuffer(key);
    if (data) {
      logger.debug('TTS cache hit', { key });
      return data;
    }
  } catch {
    // cache miss or error — fall through to generation
  }
  return null;
}

async function setCache(text: string, audio: Buffer): Promise<void> {
  try {
    const key = getCacheKey(text);
    await redis.client.setex(key, TTS_CACHE_TTL, audio);
  } catch {
    // non-critical — log nothing, just skip caching
  }
}

// --- Mulaw encoding utilities ---

const MULAW_BIAS = 0x84;
const MULAW_CLIP = 32635;
const MULAW_MAX = 0x1FFF;

function linearToMulaw(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MULAW_CLIP) sample = MULAW_CLIP;
  sample += MULAW_BIAS;

  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1) {
    /* find segment */
  }
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulawByte;
}

function pcm24kToMulaw8k(pcmBuffer: Buffer): Buffer {
  const sampleCount = pcmBuffer.length / 2;
  const ratio = 3; // 24000 / 8000
  const outputLength = Math.floor(sampleCount / ratio);
  const output = Buffer.alloc(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const offset = srcIndex * 2;
    if (offset + 1 < pcmBuffer.length) {
      const sample = pcmBuffer.readInt16LE(offset);
      output[i] = linearToMulaw(sample);
    }
  }

  return output;
}

// openai tts

export async function openaiTTS(text: string): Promise<Buffer> {
    const startTime = Date.now();
    const cleanedText = cleanTextForSpeech(text);

    try {
        const pcmResponse = await openai.audio.speech.create({
            model: OPENAI_MODEL,
            voice: OPENAI_VOICE,
            input: cleanedText,
            response_format: 'pcm'
        });

        const arrayBuffer = await pcmResponse.arrayBuffer();
        const pcmBuffer = Buffer.from(arrayBuffer);
        const mulawBuffer = pcm24kToMulaw8k(pcmBuffer);

        const duration = Date.now() - startTime;
        logger.apiTiming('OpenAI', 'TTS', duration, true);

        return mulawBuffer;
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.apiTiming('OpenAI', 'TTS', duration, false);
        logger.error('OpenAI TTS error', error);
        throw error;
    }
}

// stream speech generation from OpenAI (for low latancy)

export async function openaiTTSStream(text: string): Promise<NodeJS.ReadableStream> {
    const cleanedText = cleanTextForSpeech(text);

    const response = await openai.audio.speech.create({
        model: OPENAI_MODEL,
        voice: OPENAI_VOICE,
        input: cleanedText,
        response_format: 'pcm'
    });

    return response.body as unknown as NodeJS.ReadableStream;
}

// Elevenlabs tts

export async function elevenLabsTTS(text: string): Promise<Buffer> {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('Elevenlabs API key not configured')
    }

    const startTime = Date.now();
    const cleanedText = cleanTextForSpeech(text)

    try {
        const response  = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text: cleanedText,
                    model_id: 'eleven_turbo_v2', //fastest model
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        )
        if (!response.ok) {
            throw new Error(`ElevenlLabs API error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const duration = Date.now() - startTime;
        logger.apiTiming('ElevenLabs', 'TTS', duration, true);

        return buffer;
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.apiTiming('ElevenLabs', 'TTS', duration, false);
        logger.error('ElevenLabs TTS error', error);
        throw error;
    }
}

//stream speech generation from Elevenlab
export async function elevenLabsTTSStream(text: string): Promise<NodeJS.ReadableStream> {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured');
    }

    const cleanedText = cleanTextForSpeech(text);

    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: cleanedText,
                model_id: 'eleven_turbo_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        }
    )

    if (!response.ok) {
        throw new Error(`ElevenLabs stream error: ${response.status}`);
    }

    return response.body as unknown as NodeJS.ReadWriteStream
}

// unified interface

// generate speech using the configured provider

export async function textToSpeech(text: string): Promise<Buffer> {
    const cached = await getCached(text);
    if (cached) return cached;

    const audio = TTS_PROVIDER === 'elevenlabs'
        ? await elevenLabsTTS(text)
        : await openaiTTS(text);

    await setCache(text, audio);
    return audio;
}

//stream generated speech

export async function textToSpeechStream(text: string): Promise<NodeJS.ReadableStream> {
    if (TTS_PROVIDER === 'elevenlabs') {
        return elevenLabsTTSStream(text);
    }
    return openaiTTSStream(text)
}

// utility
//split text into chunks for faster initial paybacks and return as array

export function splitTextForStreaming(text: string, maxLength: number = 100): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks: string[] = [];
    let currentChunk = '';

    for ( const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
            currentChunk += sentence;
        } else {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim())
    }

    return chunks
}

// get available voices for a provider

export function getAvailableVoices(provider: TTSProvider): string[] {
    if (provider === 'openai') {
        return ['alloy', 'echo', 'fable','onyx', 'nova', 'shimmer']
    }
    
    return [];
}

export async function convertToMulaw(audioBuffer: Buffer): Promise<Buffer> {
    return audioBuffer;
  }

  export default {
    textToSpeech,
    textToSpeechStream,
    openaiTTS,
    openaiTTSStream,
    elevenLabsTTS,
    elevenLabsTTSStream,
    splitTextForStreaming,
    getAvailableVoices,
    convertToMulaw,
  };