import Anthropic from '@anthropic-ai/sdk';
import { getTools, getSystemPrompt } from '../functions/tools';
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

const MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-6';

function convertToolsForClaude(tools: ToolDefinition[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters as Anthropic.Tool.InputSchema,
  }));
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
  context: ToolContext
): Promise<OpenAIChatResponse> {
  const startTime = Date.now();

  try {
    const systemPrompt = getSystemPrompt(context);
    const claudeMessages = convertMessagesForClaude(messages);
    const claudeTools = convertToolsForClaude(getTools());

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: claudeMessages,
      tools: claudeTools,
    });

    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'chat', duration, true);

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
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'chat', duration, false);
    logger.error('Claude chat error', error);
    throw error;
  }
}

export async function continueAfterFunctionCall(
  messages: Message[],
  functionName: string,
  functionResult: unknown,
  toolCallId: string,
  context: ToolContext
): Promise<string> {
  const startTime = Date.now();

  try {
    const systemPrompt = getSystemPrompt(context);
    const claudeMessages = convertMessagesForClaude(messages);

    // Append the assistant tool_use and user tool_result directly in Claude format
    claudeMessages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: toolCallId,
          name: functionName,
          input: {},
        },
      ],
    });

    claudeMessages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolCallId,
          content: JSON.stringify(functionResult),
        },
      ],
    });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const duration = Date.now() - startTime;
    logger.apiTiming('Claude', 'continueAfterFunctionCall', duration, true);

    for (const block of response.content) {
      if (block.type === 'text') {
        return block.text;
      }
    }

    return '';
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
