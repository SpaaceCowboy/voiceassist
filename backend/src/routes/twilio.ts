/**
 * Two approaches supported:
 * 1. Simple: Using Twilio's Gather verb (higher latency)
 * 2. Advanced: Using media streams WebSocket (lowest latency)
 */
import { Router, Request, Response } from 'express'
import twilio from 'twilio'
import { WebSocket, WebSocketServer } from 'ws'
import conversationService from '../services/conversation'
import deepgramService from '../services/deepgram'
import ttsService from '../services/tts'
import redis from '../config/redis'
import logger from '../utils/logger'
import type {
    TwilioVoiceRequest,
    TwilioStatusRequest,
    TwilioMediaStreamMessage,
    DeepgramController
} from '../../types/index'
import type { Server } from 'http'
const router = Router()

//twilio client for outbound actions (lazy-initialized to avoid crash at import time)
let _twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> {
    if (!_twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !accountSid.startsWith('AC')) {
            throw new Error(
                `TWILIO_ACCOUNT_SID must start with "AC". Got: "${accountSid?.substring(0, 4) ?? '(empty)'}...". ` +
                'Find your Account SID at https://console.twilio.com/ (not an API Key SID which starts with "SK").'
            );
        }

        _twilioClient = twilio(accountSid, authToken);
    }
    return _twilioClient;
}

// VOICE WEBHOOK (MEDIA STREAMS)

//POST /twilio/voice, called when a call is recived, responds wuth twiml to connect to a media stream
router.post('/voice', async (req: Request, res: Response) => {
    const body = req.body as TwilioVoiceRequest;
    const callSid = body.CallSid;
    const from = body.From;
    const to = body.To

    logger.info('Incoming call', {callSid, from, to})

    try {
        await conversationService.initializeConversation(callSid, from, to)

        const twiml = new twilio.twiml.VoiceResponse();
        //start with a message while sets up
        twiml.say({ voice: 'Polly.Joanna'}, 'One moment please.')

        const connect = twiml.connect();
        const stream = connect.stream({
            url: `wss://${req.headers.host}/media-stream`,
        })

        stream.parameter({ name: 'callSid', value: callSid});
        stream.parameter({ name: 'from', value: from})

        res.type('text/xml');
        res.send(twiml.toString())
    } catch (error) {
        logger.error('Error handling voice webhook', error);

        //return error
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('We apologize, but we are experiencing technical difficulties. please try again later')
        twiml.hangup();

        res.type('text/xml')
        res.send(twiml.toString())
    }
})

//voice webhook
//post /twilio/voice-simple
//higher latancy
router.post('/voice-simple', async (req: Request, res: Response) => {
    const body = req.body as TwilioVoiceRequest;
    const callSid = body.CallSid;
    const from = body.From;
    const to = body.To;
    const speechResult = body.SpeechResult;
    
    logger.info('Voice simple webhook', {callSid, speechResult: speechResult?.substring(0, 50)});

    try {
        const twiml = new twilio.twiml.VoiceResponse()

        if (!speechResult) {
            await conversationService.initializeConversation(callSid, from, to);
            const greeting = await conversationService.generateGreeting(callSid);

            //greeting and gather response
            const gather = twiml.gather({
                input: ['speech'],
                speechTimeout: 'auto',
                action: '/twilio/voice-simple',
                method: 'POST',
            })
            gather.say({ voice: 'Polly.Joanna'}, greeting.text);

            //if no input prompt again
            twiml.redirect('/twilio/voice-simple');
        } else {
            //process users speech
            const response = await conversationService.processInput(callSid, speechResult)

            if (response.shouldTransfer) {
                const transferNumber = process.env.TRANSFER_NUMBER;
                if (transferNumber) {
                    twiml.say({voice: 'Polly.Joanna'}, 'transferring you now');
                    twiml.dial(transferNumber);
                } else {
                    twiml.say({ voice: 'Polly.Joanna'}, 'I apologize, but no one is available to take your call right now')
                }
            } else if (response.shouldEnd) {
                twiml.say({ voice: 'Polly.Joanna'}, response.text);
                twiml.hangup()
            } else {
                //cuntinue conversation
                const gather = twiml.gather({
                    input: ['speech'],
                    speechTimeout: 'auto',
                    action: '/twilio/voice-simple',
                    method: 'POST',
                })
                gather.say({ voice: 'Polly.Joanna'}, response.text)

                twiml.redirect('/twilio/voice-simple')
            }
        }

        res.type('text/xml');
        res.send(twiml.toString())
    } catch (error) {
        logger.error('Error in voice-simple',  error);

        const twiml = new twilio.twiml.VoiceResponse()
        twiml.say('Sorry, something went wrong please try again');
        twiml.hangup();

        res.type('text/xml');
        res.send(twiml.toString())
    }
})

//STATUS CALBACKK

//POST /twilio/status / called when call status changes (ringing, in-progress, completed)
router.post('/status', async (req:Request, res: Response) => {
    const body = req.body as TwilioStatusRequest;
    const callSid = body.CallSid;
    const status = body.CallStatus;
    const duration = parseInt(body.CallDuration || '0')

    logger.info('Call status update', {callSid, status, duration})

    try {
        if ( status === 'completed' || status === 'failed' || status === 'no-answer' || status ==='busy') {
            await conversationService.handleCallEnded(callSid, {status, duration});
        }
        
        res.sendStatus(200)
    } catch (error) {
        logger.error('Error handling status callback', error);
        res.sendStatus(500)
    }
})

//MEDIA STREAM WEBSOCKET

//websocket setup for twilio media stream

export function setupMediaStreamWebSocket(server: Server): void {
    const wss = new WebSocketServer({ noServer: true });
    
    // Handle upgrade requests
    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url;
      
      if (pathname === '/media-stream') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
    
    // Handle connections
    wss.on('connection', (ws: WebSocket) => {
      let callSid: string | null = null;
      let streamSid: string | null = null;
      let deepgramController: DeepgramController | null = null;
      let isProcessing = false;
      let isSpeaking = false;
      let lastTranscript = '';
      let callEnded = false;
      let pendingFragment = '';
      let pendingFragmentStartedAt = 0;
      let transcriptQueue: string[] = [];
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let debounceBuffer = '';
      // Wait this long for more speech before processing. Shorter when the
      // utterance already ends in sentence-final punctuation (likely complete),
      // longer otherwise to give trailing fragments time to arrive and merge.
      const DEBOUNCE_MS = 800;
      const DEBOUNCE_MS_COMPLETE = 300;
      const MAX_PENDING_FRAGMENT_CHARS = 240;
      const MAX_PENDING_FRAGMENT_AGE_MS = 8000;
      const MAX_DEBOUNCE_BUFFER_CHARS = 500;
      const MAX_TRANSCRIPT_QUEUE = 4;
      const MAX_DEEPGRAM_RESTARTS = 2;
      let deepgramRestartAttempts = 0;

      function appendPendingFragment(text: string): void {
        const now = Date.now();
        if (!pendingFragment || now - pendingFragmentStartedAt > MAX_PENDING_FRAGMENT_AGE_MS) {
          pendingFragment = text;
          pendingFragmentStartedAt = now;
        } else {
          pendingFragment += ` ${text}`;
        }

        if (pendingFragment.length > MAX_PENDING_FRAGMENT_CHARS) {
          if (callSid) {
            logger.call(callSid, 'warn', 'Dropping stale transcript fragment buffer', {
              length: pendingFragment.length,
            });
          }
          pendingFragment = '';
          pendingFragmentStartedAt = 0;
        }
      }

      function queueTranscript(text: string): void {
        if (transcriptQueue.length >= MAX_TRANSCRIPT_QUEUE) {
          const dropped = transcriptQueue.shift();
          if (callSid) {
            logger.call(callSid, 'warn', 'Transcript queue full, dropping oldest item', {
              dropped,
              queueSize: transcriptQueue.length,
            });
          }
        }
        transcriptQueue.push(text);
      }

      function createDeepgramSession(): DeepgramController {
        return deepgramService.createLiveTranscription({
          onTranscript: async (text: string, confidence: number) => {
            if (!callSid || callEnded) return;

            // Skip duplicate transcripts
            if (text === lastTranscript) return;
            lastTranscript = text;

            logger.call(callSid, 'info', 'Transcript', { text, confidence });

            await redis.appendConfidenceScore(callSid, confidence);

            // Buffer low-confidence fragments and merge with next transcript
            const MIN_CONFIDENCE = 0.6;
            if (confidence < MIN_CONFIDENCE) {
              appendPendingFragment(text);
              logger.call(callSid, 'warn', 'Low confidence transcript buffered', { text, confidence, threshold: MIN_CONFIDENCE });
              return;
            }

            const wordCount = text.trim().split(/\s+/).length;
            if (isSpeaking && wordCount <= 2 && text.trim().length < 8) {
              logger.call(callSid, 'debug', 'Ignoring short transcript during playback', { text, wordCount });
              return;
            }

            const looksComplete = /[.!?]$/.test(text.trim()) || wordCount >= 4;
            if (!looksComplete) {
              appendPendingFragment(text);
              logger.call(callSid, 'info', 'Short incomplete utterance buffered', { text, wordCount });
              return;
            }

            let fullText = text;
            if (pendingFragment) {
              fullText = pendingFragment + ' ' + text;
              logger.call(callSid, 'debug', 'Merged buffered fragment', { fragment: pendingFragment, merged: fullText });
              pendingFragment = '';
              pendingFragmentStartedAt = 0;
            }

            // Barge-in: a real utterance arrived while the assistant is talking
            // (or generating). Stop playback immediately so we don't talk over
            // the caller. The interim handler catches most cases earlier; this
            // covers finals that arrive without a qualifying interim.
            if (isSpeaking && streamSid) {
              ws.send(JSON.stringify({ event: 'clear', streamSid }));
              isSpeaking = false;
              logger.call(callSid, 'debug', 'Barge-in (final): cleared audio', { text: fullText });
            }

            if (isProcessing) {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
                fullText = debounceBuffer + ' ' + fullText;
                debounceBuffer = '';
                debounceTimer = null;
              }
              if (transcriptQueue.length > 0) {
                transcriptQueue[transcriptQueue.length - 1] += ' ' + fullText;
                logger.call(callSid, 'info', 'Transcript merged into queue', { input: transcriptQueue[transcriptQueue.length - 1], queueSize: transcriptQueue.length });
              } else {
                queueTranscript(fullText);
                logger.call(callSid, 'info', 'Transcript queued (processing busy)', { input: fullText, queueSize: transcriptQueue.length });
              }
            } else {
              debounceBuffer += (debounceBuffer ? ' ' : '') + fullText;
              if (debounceBuffer.length > MAX_DEBOUNCE_BUFFER_CHARS) {
                logger.call(callSid, 'warn', 'Debounce buffer exceeded max size, flushing', {
                  length: debounceBuffer.length,
                });
                queueTranscript(debounceBuffer);
                debounceBuffer = '';
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                  debounceTimer = null;
                }
                drainQueue();
                return;
              }
              if (debounceTimer) clearTimeout(debounceTimer);
              const delay = /[.!?]$/.test(debounceBuffer.trim())
                ? DEBOUNCE_MS_COMPLETE
                : DEBOUNCE_MS;
              debounceTimer = setTimeout(() => {
                const merged = debounceBuffer;
                debounceBuffer = '';
                debounceTimer = null;
                if (merged && callSid && !callEnded) {
                  logger.call(callSid!, 'debug', 'Debounce fired', { input: merged });
                  queueTranscript(merged);
                  drainQueue();
                }
              }, delay);
            }
          },
          onInterim: (text: string) => {
            const words = text.trim().split(/\s+/);
            if (isSpeaking && streamSid && words.length >= 2 && text.trim().length >= 5) {
              ws.send(JSON.stringify({ event: 'clear', streamSid }));
              isSpeaking = false;
              if (callSid) logger.call(callSid, 'debug', 'Barge-in (interim): cleared audio', { text });
            }
          },
          onError: async (error: Error) => {
            logger.error('Deepgram error', error);
            if (!callSid || callEnded) return;

            if (deepgramRestartAttempts < MAX_DEEPGRAM_RESTARTS) {
              deepgramRestartAttempts += 1;
              logger.call(callSid, 'warn', 'Restarting Deepgram live transcription', {
                attempt: deepgramRestartAttempts,
              });
              setTimeout(() => {
                if (!callEnded) {
                  deepgramController = createDeepgramSession();
                }
              }, 300 * deepgramRestartAttempts);
              return;
            }

            logger.call(callSid, 'error', 'Deepgram live transcription unavailable after retries');
            if (streamSid) {
              await streamTTSResponse(
                ws,
                streamSid,
                "I'm having trouble hearing you clearly. Let me transfer you to our staff.",
                callSid,
                () => !callEnded
              );
              await transferCall(callSid);
              callEnded = true;
            }
          },
        });
      }

      // Process a single transcript through LLM + TTS
      async function handleTranscript(input: string): Promise<void> {
        if (!callSid || callEnded) return;

        // Barge-in: if assistant is speaking, clear the audio
        if (isSpeaking && streamSid) {
          ws.send(JSON.stringify({ event: 'clear', streamSid }));
          isSpeaking = false;
          logger.call(callSid, 'debug', 'Barge-in: cleared audio');
        }

        try {
          // Stream assistant text into TTS sentence-by-sentence. Mark speaking
          // up front so a barge-in during generation/playback can interrupt.
          isSpeaking = true;
          const speaker = streamSid
            ? createSentenceSpeaker(ws, streamSid, callSid, () => !callEnded && isSpeaking)
            : null;

          const response = await conversationService.processInput(
            callSid,
            input,
            speaker ? (delta) => speaker.push(delta) : undefined,
          );

          if (callEnded) {
            logger.call(callSid, 'debug', 'Call ended during processing, skipping response');
            return;
          }

          if (speaker) {
            await speaker.done();
          }

          if (response.shouldEnd && callSid) {
            transcriptQueue.length = 0;
            await hangupCall(callSid);
          } else if (response.shouldTransfer && callSid) {
            transcriptQueue.length = 0;
            await transferCall(callSid);
          }
        } catch (error) {
          logger.error('Error processing transcript', error);
        }
      }

      // Drain the transcript queue sequentially
      async function drainQueue(): Promise<void> {
        if (isProcessing) return;
        isProcessing = true;

        try {
          while (transcriptQueue.length > 0 && !callEnded) {
            const next = transcriptQueue.shift()!;
            if (callSid) {
              logger.call(callSid, 'info', 'Processing queued transcript', { input: next, remaining: transcriptQueue.length });
            }
            await handleTranscript(next);
          }
        } finally {
          isProcessing = false;
        }
      }

      logger.info('Media stream WebSocket connected');

      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString()) as TwilioMediaStreamMessage;

          switch (data.event) {
            case 'connected':
              logger.debug('Media stream connected');
              break;

            case 'start':
              // Extract call metadata
              callSid = data.start?.customParameters?.callSid || data.start?.callSid || null;
              streamSid = data.start?.streamSid || null;

              // Authenticate: a Redis session must exist for this callSid,
              // created by the Twilio-signature-validated /voice webhook.
              // Without this check, anyone can open a stream and burn credits.
              if (!callSid) {
                logger.warn('Media stream start without callSid — closing');
                ws.close(1008, 'missing callSid');
                return;
              }
              {
                const session = await redis.getSession(callSid);
                if (!session) {
                  logger.warn('Media stream start with unknown callSid — closing', { callSid });
                  ws.close(1008, 'unauthorized');
                  return;
                }
              }

              logger.info('Media stream started', { callSid, streamSid });

              // Initialize Deepgram for transcription
              deepgramController = createDeepgramSession();
              
              // Generate and send greeting
              if (callSid) {
                try {
                  const greeting = await conversationService.generateGreeting(callSid);
                  if (greeting.audio && streamSid) {
                    await sendAudioResponse(ws, streamSid, greeting.audio);
                  }
                } catch (error) {
                  logger.error('Error generating greeting', error);
                }
              }
              break;
              
            case 'media':
              // Forward audio to Deepgram
              if (data.media?.payload && deepgramController) {
                const audioData = Buffer.from(data.media.payload, 'base64');
                deepgramController.send(audioData);
              }
              break;
              
            case 'mark':
              if (data.mark?.name === 'playback_done') {
                isSpeaking = false;
              }
              break;

            case 'stop':
              callEnded = true;
              if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
              debounceBuffer = '';
              pendingFragment = '';
              pendingFragmentStartedAt = 0;
              logger.info('Media stream stopped', { callSid });
              break;
          }
          
        } catch (error) {
          logger.error('Error processing media message', error);
        }
      });
      
      ws.on('close', () => {
        logger.info('Media stream WebSocket closed', { callSid });
        
        // Clean up
        if (deepgramController) {
          deepgramController.close();
        }
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket error', error);
      });
    });
    
    logger.info('Media stream WebSocket server initialized');
  }

  // send audio back through the media stream in 20ms chunks (160 bytes at 8kHz mulaw)
async function sendAudioResponse(
  ws: WebSocket,
  streamSid: string,
  audioBuffer: Buffer,
  sendMark: boolean = true,
): Promise<void> {
  const CHUNK_SIZE = 160;

  for (let offset = 0; offset < audioBuffer.length; offset += CHUNK_SIZE) {
    const chunk = audioBuffer.subarray(offset, offset + CHUNK_SIZE);
    const message = {
      event: 'media',
      streamSid,
      media: {
        payload: chunk.toString('base64'),
      },
    };
    ws.send(JSON.stringify(message));
  }

  if (sendMark) {
    ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'playback_done' } }));
  }
}

// Speaks assistant text as it streams in from the LLM. Sentences are detected
// incrementally; TTS for each sentence is kicked off the moment the sentence
// completes (so generation overlaps), but audio is sent to Twilio strictly in
// order via a sequential chain. This lets the first sentence start playing
// while the rest of the response is still being generated.
function createSentenceSpeaker(
  ws: WebSocket,
  streamSid: string,
  callSid: string,
  isActive: () => boolean,
) {
  let buffer = '';
  let sendChain: Promise<void> = Promise.resolve();
  let sentenceCount = 0;
  const startTime = Date.now();

  function speak(rawSentence: string): void {
    const sentence = rawSentence.trim();
    if (!sentence) return;
    sentenceCount += 1;

    // Start generating immediately so chunks render in parallel.
    const ttsPromise = ttsService
      .textToSpeech(sentence)
      .catch((error) => {
        logger.call(callSid, 'error', 'TTS chunk failed', { sentence, error });
        return null;
      });

    // But send strictly in order.
    sendChain = sendChain.then(async () => {
      if (!isActive()) return;
      const audio = await ttsPromise;
      if (audio && isActive()) {
        await sendAudioResponse(ws, streamSid, audio, false);
      }
    });
  }

  return {
    push(delta: string): void {
      buffer += delta;
      // Flush every complete sentence (ends with . ! or ?).
      let boundary: number;
      while ((boundary = buffer.search(/[.!?]/)) !== -1) {
        const sentence = buffer.slice(0, boundary + 1);
        buffer = buffer.slice(boundary + 1);
        speak(sentence);
      }
    },
    async done(): Promise<void> {
      if (buffer.trim()) {
        speak(buffer);
        buffer = '';
      }
      await sendChain;
      if (isActive()) {
        ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'playback_done' } }));
      }
      const duration = Date.now() - startTime;
      logger.call(callSid, 'info', 'Streaming TTS complete', {
        duration: `${duration}ms`,
        chunks: sentenceCount,
      });
      if (sentenceCount > 0) {
        redis.incrementTtsChunks(callSid, sentenceCount).catch(() => {});
      }
    },
  };
}

// Split text into sentences, generate TTS per-sentence, and stream each
// to the caller as soon as it's ready. First sentence plays while the
// rest are still being generated — cuts perceived latency significantly.
async function streamTTSResponse(
  ws: WebSocket,
  streamSid: string,
  text: string,
  callSid: string,
  isActive: () => boolean,
): Promise<void> {
  const sentences = ttsService.splitTextForStreaming(text);
  const startTime = Date.now();

  if (sentences.length <= 1) {
    // Short response — no benefit from splitting, just generate and send
    if (!isActive()) return;
    try {
      const audio = await ttsService.textToSpeech(text);
      if (!isActive()) return;
      await sendAudioResponse(ws, streamSid, audio);
    } catch (error) {
      logger.call(callSid, 'error', 'TTS generation failed', error);
    }
    const duration = Date.now() - startTime;
    logger.call(callSid, 'info', 'Streaming TTS complete', { duration: `${duration}ms`, chunks: 1 });
    return;
  }

  // Multi-sentence: generate first sentence immediately, start remaining in parallel
  logger.call(callSid, 'debug', 'Streaming TTS', { sentences: sentences.length });

  // Kick off TTS for all sentences concurrently
  const ttsPromises = sentences.map((sentence) => ttsService.textToSpeech(sentence));

  for (let i = 0; i < ttsPromises.length; i++) {
    if (!isActive()) return;
    try {
      const audio = await ttsPromises[i];
      if (!isActive()) return;
      await sendAudioResponse(ws, streamSid, audio);
    } catch (error) {
      logger.call(callSid, 'error', 'TTS chunk failed', { sentence: i, error });
    }
  }

  const duration = Date.now() - startTime;
  logger.call(callSid, 'info', 'Streaming TTS complete', { duration: `${duration}ms`, chunks: sentences.length });

  // Track TTS chunks in session metrics
  redis.incrementTtsChunks(callSid, sentences.length).catch(() => {});
}

//hang up a call
async function hangupCall(callSid: string): Promise<void> {
  try {
    await getTwilioClient().calls(callSid).update({ status: 'completed'});
    logger.info('Call hung up', {callSid});
  } catch (error) {
    logger.error('Failed to hang up call', error)
  }
}

//transfer a call to a human
async function transferCall(callSid: string): Promise<void> {
  const transferNumber = process.env.TRANSFER_NUMBER;

  if (!transferNumber) {
    logger.warn('No transfer number configured');
    return;
  }
  
try {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice: 'Polly.Joanna'}, 'Transferring you now. Please hold.');
  twiml.dial(transferNumber);

  await getTwilioClient().calls(callSid).update({
    twiml: twiml.toString(),
  })

  logger.info('Call transferred', { callSid, to: transferNumber });
} catch (error) {
  logger.error('Failed to transfer call', error)
}
}

export async function updateCall(callSid: string, twimlString: string): Promise<void> {
  await getTwilioClient().calls(callSid).update({ twiml: twimlString });
}

export default router;
