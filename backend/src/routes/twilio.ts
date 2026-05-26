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
      let transcriptQueue: string[] = [];

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
          const response = await conversationService.processInput(callSid, input);

          if (callEnded) {
            logger.call(callSid, 'debug', 'Call ended during processing, skipping response');
            return;
          }

          if (response.text && streamSid) {
            isSpeaking = true;
            await streamTTSResponse(ws, streamSid, response.text, callSid, () => !callEnded);
          }

          if (response.shouldEnd && callSid) {
            await hangupCall(callSid);
          } else if (response.shouldTransfer && callSid) {
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
              deepgramController = deepgramService.createLiveTranscription({
                onTranscript: async (text: string, confidence: number) => {
                  if (!callSid || callEnded) return;

                  // Skip duplicate transcripts
                  if (text === lastTranscript) return;
                  lastTranscript = text;

                  logger.call(callSid, 'info', 'Transcript', { text, confidence });

                  // Buffer low-confidence fragments and merge with next transcript
                  const MIN_CONFIDENCE = 0.6;
                  if (confidence < MIN_CONFIDENCE) {
                    pendingFragment += (pendingFragment ? ' ' : '') + text;
                    logger.call(callSid, 'warn', 'Low confidence transcript buffered', { text, confidence, threshold: MIN_CONFIDENCE });
                    return;
                  }

                  // Prepend any buffered fragments
                  let fullText = text;
                  if (pendingFragment) {
                    fullText = pendingFragment + ' ' + text;
                    logger.call(callSid, 'debug', 'Merged buffered fragment', { fragment: pendingFragment, merged: fullText });
                    pendingFragment = '';
                  }

                  // Queue transcript and drain
                  transcriptQueue.push(fullText);
                  if (isProcessing) {
                    logger.call(callSid, 'info', 'Transcript queued (processing busy)', { input: fullText, queueSize: transcriptQueue.length });
                  } else {
                    drainQueue();
                  }
                },
                onInterim: (text: string) => {
                  // Barge-in on interim speech too
                  if (isSpeaking && streamSid) {
                    ws.send(JSON.stringify({ event: 'clear', streamSid }));
                    isSpeaking = false;
                    if (callSid) logger.call(callSid, 'debug', 'Barge-in (interim): cleared audio');
                  }
                },
                onError: (error: Error) => {
                  logger.error('Deepgram error', error);
                },
              });
              
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
  audioBuffer: Buffer
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

  ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'playback_done' } }));
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
