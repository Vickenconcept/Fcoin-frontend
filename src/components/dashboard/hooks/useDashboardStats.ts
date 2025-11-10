import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient, type ApiResponse } from '@/lib/apiClient';

export type DashboardStats = {
  walletBalance: number;
  walletCurrency: string;
  earnedCoinsTotal: number;
  followerCount: number | null;
  followingCount: number | null;
  isLoading: boolean;
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractCount = (response: ApiResponse<any>): number | null => {
  if (!response?.ok) {
    return null;
  }

  if (Array.isArray(response.data)) {
    return response.data.length;
  }

  const meta = response.meta ?? {};

  if (typeof meta.total === 'number') {
    return meta.total;
  }

  if (typeof meta.count === 'number') {
    return meta.count;
  }

  return null;
};

export const useDashboardStats = (userId?: string, defaultCurrency = 'FCN'): DashboardStats => {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletCurrency, setWalletCurrency] = useState<string>(defaultCurrency);
  const [earnedCoinsTotal, setEarnedCoinsTotal] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);

    try {
      const [walletResponse, followersResponse, followingResponse] = await Promise.all([
        apiClient.request<any>('/v1/wallets/me'),
        apiClient.request<any>(`/v1/users/${userId}/followers`),
        apiClient.request<any>(`/v1/users/${userId}/following`),
      ]);

      if (walletResponse.ok && walletResponse.data) {
        const balanceValue = normalizeNumber(walletResponse.data.balance);
        setWalletBalance(balanceValue);
        setWalletCurrency(walletResponse.data.currency ?? defaultCurrency);

        const transactions = Array.isArray(walletResponse.data.transactions)
          ? walletResponse.data.transactions
          : [];

        const totalCredit = transactions.reduce((sum: number, transaction: any) => {
          const type = (transaction.type ?? '').toString().toUpperCase();
          if (type === 'CREDIT' || type === 'TOPUP') {
            return sum + normalizeNumber(transaction.amount);
          }

          return sum;
        }, 0);

        setEarnedCoinsTotal(totalCredit || balanceValue);
      } else if (!walletResponse.ok && walletResponse.errors) {
        toast.error('Unable to load wallet details.');
      }

      const followersValue = extractCount(followersResponse);
      const followingValue = extractCount(followingResponse);

      if (followersValue === null && !followersResponse.ok) {
        toast.error('Unable to load follower data.');
      }

      if (followingValue === null && !followingResponse.ok) {
        toast.error('Unable to load following data.');
      }

      setFollowerCount(followersValue);
      setFollowingCount(followingValue);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, defaultCurrency]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    fetchStats().catch((error) => {
      console.error(error);
    });
  }, [userId, fetchStats]);

  return {
    walletBalance,
    walletCurrency,
    earnedCoinsTotal,
    followerCount,
    followingCount,
    isLoading,
  };
};

