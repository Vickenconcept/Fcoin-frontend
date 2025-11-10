import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type CreatorCoin = {
  id: string;
  symbol: string;
  name: string | null;
  description: string | null;
  balance: number;
  created_at?: string | null;
};

type CoinsResponse = {
  coins: CreatorCoin[];
};

export function useCoins() {
  const [coins, setCoins] = useState<CreatorCoin[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<CoinsResponse>('/v1/coins');
      if (response.ok && response.data?.coins) {
        setCoins(response.data.coins);
      } else if (!response.ok) {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to load coins.');
      }
    } catch (error) {
      console.error('[useCoins] load error', error);
      toast.error('Failed to load coins.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch((error) => {
      console.error('[useCoins] initial load error', error);
    });
  }, [load]);

  return {
    coins,
    isLoading,
    reload: load,
  };
}

