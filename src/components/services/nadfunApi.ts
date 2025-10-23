// src/services/nadfunApi.ts

const API_BASE_URL = 'http://localhost:8000'; // Your backend URL

export interface NadTokenRaw {
  token: string;
  name: string;
  symbol: string;
  creator: string;
  pool: string;
  is_listed: boolean;
  is_locked: boolean;
  created_block: number;
  listed_block?: number;
  token_uri: string;
  stats: {
    total_buys: number;
    total_sells: number;
    total_buy_volume: number;
    total_sell_volume: number;
    unique_traders: number;
    bonding_trades: number;
    dex_trades: number;
    last_price: number;
    last_trade_block: number;
  };
  reserves: {
    real_mon: number;
    real_token: number;
    virtual_mon: number;
    virtual_token: number;
  };
  virtual_mon: number;
  virtual_token: number;
  target_token_amount: number;
}

export interface NadTokenMetadata {
  token: string;
  name: string;
  symbol: string;
  token_uri: string;
  metadata?: {
    image?: string;
    description?: string;
    external_url?: string;
    social?: {
      twitter?: string;
      discord?: string;
      telegram?: string;
      website?: string;
    };
  };
}

// Fetch all nad.fun tokens
export async function fetchNadTokens(params?: {
  listed_only?: boolean;
  unlisted_only?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; tokens: string[] }> {
  const queryParams = new URLSearchParams();
  if (params?.listed_only) queryParams.append('listed_only', 'true');
  if (params?.unlisted_only) queryParams.append('unlisted_only', 'true');
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/nad/tokens?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch nad.fun tokens');
  return response.json();
}

// Fetch single token details
export async function fetchNadTokenDetails(tokenAddress: string): Promise<NadTokenRaw> {
  const response = await fetch(`${API_BASE_URL}/nad/token/${tokenAddress.toLowerCase()}`);
  if (!response.ok) throw new Error(`Token ${tokenAddress} not found`);
  return response.json();
}

// Fetch token metadata (image, socials, etc)
export async function fetchNadTokenMetadata(tokenAddress: string): Promise<NadTokenMetadata> {
  const response = await fetch(`${API_BASE_URL}/nad/token/${tokenAddress.toLowerCase()}/metadata`);
  if (!response.ok) throw new Error(`Metadata for ${tokenAddress} not found`);
  return response.json();
}

// Fetch trending tokens
export async function fetchTrendingTokens(params?: {
  metric?: 'volume' | 'trades' | 'traders';
  limit?: number;
  listed?: boolean;
}): Promise<Array<NadTokenRaw & { score: number }>> {
  const queryParams = new URLSearchParams();
  if (params?.metric) queryParams.append('metric', params.metric);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.listed !== undefined) queryParams.append('listed', params.listed.toString());

  const response = await fetch(`${API_BASE_URL}/nad/tokens/trending?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch trending tokens');
  return response.json();
}

// Fetch recently created tokens
export async function fetchRecentlyCreatedTokens(limit: number = 20): Promise<Array<{
  token: string;
  name: string;
  symbol: string;
  creator: string;
  created_block: number;
  is_listed: boolean;
  total_trades: number;
  total_volume: number;
}>> {
  const response = await fetch(`${API_BASE_URL}/nad/tokens/recently-created?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch recently created tokens');
  return response.json();
}

// Fetch platform summary
export async function fetchPlatformSummary(): Promise<{
  total_tokens: number;
  listed_tokens: number;
  unlisted_tokens: number;
  total_volume: number;
  total_trades: number;
  unique_traders: number;
}> {
  const response = await fetch(`${API_BASE_URL}/nad/stats/summary`);
  if (!response.ok) throw new Error('Failed to fetch platform summary');
  return response.json();
}

// WebSocket connection for real-time updates
export function connectToTokenUpdates(
  tokenAddress: string,
  onUpdate: (data: any) => void,
): WebSocket {
  const ws = new WebSocket(`ws://localhost:8000/ws/stats/${tokenAddress.toLowerCase()}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'stats') {
      onUpdate(data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
}