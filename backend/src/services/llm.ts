import Anthropic from '@anthropic-ai/sdk';
import { getTools, getSystemPromptBlocks } from '../functions/tools';
import logger from '../utils/logger';
import type {
  Message,
  ToolContext,
  OpenAIChatResponse,
  FunctionCallResult,
  ToolDefinition,
} from '../../types/index';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5';

// Optional callback to receive assistant text as it streams from Claude.
// When provided, the request is streamed so the caller can start TTS on the
// first sentence before the full response is generated.
export type TextDeltaHandler = (delta: string) => void;

function convertToolsForClaude(tools: ToolDefinition[]): Anthropic.Tool[] {
  const converted: Anthropic.Tool[] = tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
  }));
  // Tool definitions are static across every call — mark the last one with a
  // cache breakpoint so the whole tools block is served from Anthropic's
  // prompt cache instead of being re-tokenized each turn.
  if (converted.length > 0) {
    converted[converted.length - 1].cache_control = { type: 'ephemeral' };
  }
  return converted;
}

// System split into a cached static block + an uncached per-call context block.
function buildSystemBlocks(context: ToolContext): Anthropic.TextBlockParam[] {
  const { staticPrompt, dynamicContext } = getSystemPromptBlocks(context);
  return [
    { type: 'text', text: staticPrompt, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicContext },
  ];
}

// Run a Claude request, optionally streaming text deltas to onTextDelta.
// Returns the fully assembled message either way.
async function runClaude(
  messages: Message[],
  context: ToolContext,
  onTextDelta?: TextDeltaHandler
): Promise<Anthropic.Message> {
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: MODEL,
    max_tokens: 200,
    system: buildSystemBlocks(context),
    messages: convertMessagesForClaude(messages),
    tools: convertToolsForClaude(getTools()),
  };

  if (onTextDelta) {
    const stream = anthropic.messages.stream(params);
    stream.on('text', (delta) => onTextDelta(delta));
    return stream.finalMessage();
  }

  return anthropic.messages.create(params);
}

// Pull the text + tool call out of an assembled Claude message.
function parseClaudeResponse(response: Anthropic.Message): OpenAIChatResponse {
  let content: string | null = null;
  let functionCall: FunctionCallResult | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      content = block.text;
    } else if (block.type === 'tool_use') {
      functionCall = {
        name: block.name,
        arguments: block.input as Record<string, unknown>,
        id: block.id,
      };
    }
  }

  return {
    content,
    functionCall,
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        }
      : null,
  };
}

function convertMessagesForClaude(
  messages: Message[]
): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const content: Anthropic.ContentBlockParam[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          let parsedInput: Record<string, unknown>;
          try {
            parsedInput =
              typeof tc.function.arguments === 'string'
                ? JSON.parse(tc.function.arguments)
                : (tc.function.arguments as Record<string, unknown>);
          } catch {
            parsedInput = {};
          }
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: parsedInput,
          });
        }
        result.push({ role: 'assistant', content });
      } else {
        result.push({ role: 'assistant', content: msg.content || '' });
      }
    } else if (msg.role === 'tool') {
      result.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.tool_call_id || '',
            content: msg.content,
          },
        ],
      });
    }
  }

  return result;
}

export async function chat(
  messages: Message[],
  context: ToolContext,
  onTextDelta?: TextDeltaHandler
): Promise<OpenAIChatResponse> {
  const startTime = Date.now();

  try {
    const response = await runClaude(messages, context, onTextDelta);
    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'chat', duration, true);
    return parseClaudeResponse(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'chat', duration, false);
    logger.error('Claude chat error', error);
    throw error;
  }
}

export async function continueAfterFunctionCall(
  messages: Message[],
  _functionName: string,
  _functionResult: unknown,
  _toolCallId: string,
  context: ToolContext,
  onTextDelta?: TextDeltaHandler
): Promise<OpenAIChatResponse> {
  const startTime = Date.now();

  try {
    const response = await runClaude(messages, context, onTextDelta);
    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'continueAfterFunctionCall', duration, true);
    return parseClaudeResponse(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'continueAfterFunctionCall', duration, false);
    logger.error('Claude continue error', error);
    throw error;
  }
}

export default {
  chat,
  continueAfterFunctionCall,
};
