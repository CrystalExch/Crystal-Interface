// src/hooks/useNadTokens.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Token } from '../TokenExplorer/TokenExplorer';
import {
  fetchNadTokens,
  fetchRecentlyCreatedTokens,
} from '../services/nadfunApi';
//import { fetchAndTransformTokens } from '../services/nadfunTransformer';

interface UseNadTokensOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  limit?: number;
  listed_only?: boolean;
  unlisted_only?: boolean;
}

export function useNadTokens(options: UseNadTokensOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 10000, // 10 seconds
    limit = 100,
    listed_only,
    unlisted_only,
  } = options;

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch token addresses
      const { tokens: tokenAddresses } = await fetchNadTokens({
        limit,
        listed_only,
        unlisted_only,
      });

      // Fetch and transform token details
      //const transformedTokens = await fetchAndTransformTokens(tokenAddresses);
      
      // Sort by most recent
      //transformedTokens.sort((a: any, b: any) => b.created - a.created);
      
      //setTokens(transformedTokens);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch nad.fun tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, listed_only, unlisted_only]);

  useEffect(() => {
    fetchTokens();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTokens, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTokens, autoRefresh, refreshInterval]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}

/**
 * Hook for recently created tokens (for "New Pairs" section)
 */
export function useRecentNadTokens(limit: number = 20) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const recentTokens = await fetchRecentlyCreatedTokens(limit);
      
      // Transform to Token format
      const tokenAddresses = recentTokens.map(t => t.token);
      //const transformedTokens = await fetchAndTransformTokens(tokenAddresses);
      
      //setTokens(transformedTokens);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch recent tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTokens();
    
    // Refresh every 30 seconds for "New Pairs"
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  return { tokens, loading, error, refetch: fetchTokens };
}