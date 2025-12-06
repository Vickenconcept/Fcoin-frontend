import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type RecentEngagement = {
  id: string;
  fanName: string;
  fanUsername: string | null;
  platform: string;
  pageName?: string | null;
  postTitle: string | null;
  type: string;
  loggedAt: string | null;
  rewardGiven: boolean;
  rewardAmount: number | null;
  status?: string;
  status_reason?: string;
};

type UseRecentEngagementsReturn = {
  engagements: RecentEngagement[];
  isLoading: boolean;
  reload: () => Promise<void>;
};

export function useRecentEngagements(limit = 6): UseRecentEngagementsReturn {
  const [engagements, setEngagements] = useState<RecentEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (limit === 0) {
      setEngagements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.request<{ data: any[] }>(
        `/v1/engagements/recent?limit=${encodeURIComponent(limit)}`,
      );

      if (!response.ok || !Array.isArray(response.data)) {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to load recent engagements.');
        return;
      }

      const mapped: RecentEngagement[] = response.data.map((item) => {
        const fanName =
          item?.fan?.display_name ??
          item?.fan?.username ??
          item?.metadata?.user?.name ??
          'Fan supporter';

        const platform = (item?.post?.platform ?? item?.provider ?? 'unknown')
          .toString()
          .toLowerCase();
        const pageName = item?.post?.page_name ?? null;

        const fallbackId = `${item?.post?.id ?? 'post'}-${item?.fan?.id ?? Math.random()
          .toString(36)
          .slice(2, 8)}`;

        return {
          id: typeof item?.id === 'string' && item.id.length > 0 ? item.id : fallbackId,
          fanName,
          fanUsername: item?.fan?.username ?? null,
          platform,
          pageName,
          postTitle: item?.post?.title ?? null,
          type: (item?.type ?? '').toString().toUpperCase(),
          loggedAt: item?.logged_at ?? null,
          rewardGiven: Boolean(item?.reward_given),
          rewardAmount:
            typeof item?.reward_amount === 'number'
              ? item.reward_amount
              : item?.reward_amount
              ? Number(item.reward_amount)
              : null,
          status: item?.status || (item?.reward_given ? 'rewarded' : 'pending'),
          status_reason: item?.status_reason || null,
        };
      });

      setEngagements(mapped);
    } catch (error) {
      console.error('[useRecentEngagements] load error', error);
      toast.error('Failed to load recent engagements.');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load().catch((error) => console.error(error));
  }, [load]);

  return {
    engagements,
    isLoading,
    reload: load,
  };
}


