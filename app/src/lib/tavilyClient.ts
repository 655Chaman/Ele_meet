/**
 * tavilyClient.ts
 *
 * Typed client for interacting with the Tavily Search API.
 * Used by the strategic reasoning engine to pull live web intel about
 * the prospect's company.
 */

const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilySearchRequest {
  api_key: string;
  query: string;
  search_depth?: 'basic' | 'advanced';
  include_answer?: boolean;
  max_results?: number;
}

export interface TavilySearchResponse {
  answer?: string;
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    published_date?: string;
  }>;
}

export async function searchTavily(query: string, maxResults = 5): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set');
  }

  const payload: TavilySearchRequest = {
    api_key: apiKey,
    query,
    search_depth: 'advanced',
    include_answer: true,
    max_results: maxResults,
  };

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API Error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as TavilySearchResponse;
}
