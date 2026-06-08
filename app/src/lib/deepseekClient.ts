/**
 * deepseekClient.ts
 *
 * Typed client for interacting with the DeepSeek API.
 * Supports both the fast `deepseek-chat` model (Engine A) and the deep
 * `deepseek-reasoner` model (Engine B).
 *
 * API Docs: https://api-docs.deepseek.com/
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekRequest {
  model: DeepSeekModel;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' };
}

export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export async function callDeepSeek(payload: DeepSeekRequest): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as DeepSeekResponse;

  if (!response.ok || data.error) {
    throw new Error(`DeepSeek API Error: ${data.error?.message || response.statusText}`);
  }

  return data.choices[0]?.message.content || '';
}

/**
 * Fast chat for real-time copilot reactions.
 * Uses `deepseek-chat` and requests JSON output.
 */
export async function fastChatJson<T>(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.3
): Promise<T> {
  const rawResponse = await callDeepSeek({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    response_format: { type: 'json_object' },
  });

  try {
    return JSON.parse(rawResponse) as T;
  } catch (err) {
    console.error('Failed to parse DeepSeek JSON response:', rawResponse);
    throw new Error('DeepSeek returned invalid JSON');
  }
}

/**
 * Deep reasoning for strategic briefs.
 * Uses `deepseek-reasoner`. (Note: reasoner doesn't officially support json_object format,
 * so we parse the markdown JSON block).
 */
export async function deepReasoningJson<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const rawResponse = await callDeepSeek({
    model: 'deepseek-reasoner',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    // Reasoner handles temperature internally usually, keeping it default
  });

  // Extract JSON from markdown block if present
  let jsonString = rawResponse;
  const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (err) {
    console.error('Failed to parse DeepSeek Reasoner response:', rawResponse);
    throw new Error('DeepSeek Reasoner returned invalid JSON');
  }
}

/**
 * Streaming chat for real-time tactical overrides.
 * Uses `deepseek-chat` and streams back the tokens.
 */
export async function streamChat(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.5
): Promise<Response> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const payload: DeepSeekRequest = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    stream: true,
  };

  return fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
}
