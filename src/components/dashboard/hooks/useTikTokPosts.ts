import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import type { SocialPost } from './useFacebookPagePosts';

type TikTokAccountMeta = {
  id: string;
  social_account_id: string;
  social_page_id?: string | null;
  tiktok_open_id: string | null;
  tiktok_username: string | null;
  connected_at?: string | null;
  last_synced_at?: string | null;
  page?: {
    id: string;
    name: string | null;
    picture_url: string | null;
    connected_at: string | null;
    last_synced_at: string | null;
    reward_coin_symbol: string | null;
  } | null;
};

type TikTokPostsResponse = {
  data: SocialPost[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    account?: TikTokAccountMeta | null;
    accounts?: TikTokAccountMeta[];
    selected_account_id?: string | null;
  };
};

export function useTikTokPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [meta, setMeta] = useState<TikTokPostsResponse['meta']>({});
  const [account, setAccount] = useState<TikTokAccountMeta | null>(null);
  const [accounts, setAccounts] = useState<TikTokAccountMeta[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdatingRewardCoin, setIsUpdatingRewardCoin] = useState(false);

  const load = useCallback(async (accountId?: string | null) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const targetAccountId = accountId ?? selectedAccountId ?? null;

      if (targetAccountId) {
        params.set('account_id', targetAccountId);
      }

      const endpoint =
        params.size > 0 ? `/v1/oauth/tiktok/posts?${params.toString()}` : '/v1/oauth/tiktok/posts';

      const response = await apiClient.request<TikTokPostsResponse>(endpoint);

      if (response.ok && Array.isArray(response.data)) {
        setPosts(response.data);
        setMeta(response.meta ?? {});

        const accountMeta = (response.meta?.account ?? null) as TikTokAccountMeta | null;
        const accountsMeta = Array.isArray(response.meta?.accounts)
          ? (response.meta?.accounts as TikTokAccountMeta[])
          : [];

        setAccount(accountMeta);
        setAccounts(accountsMeta);

        const nextSelected =
          (response.meta?.selected_account_id as string | null | undefined) ??
          accountMeta?.id ??
          accountMeta?.social_account_id ??
          targetAccountId ??
          null;

        setSelectedAccountId(nextSelected ?? null);
      } else if (response.status === 404) {
        setPosts([]);
        setAccount(null);
        setAccounts([]);
        setSelectedAccountId(null);
      } else {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to load TikTok posts.');
      }
    } catch (error) {
      console.error('[useTikTokPosts] load error', error);
      setPosts([]);
      setAccount(null);
      setAccounts([]);
      setSelectedAccountId(null);
      toast.error('Failed to load TikTok posts.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  const sync = useCallback(
    async (immediate = true, limit?: number, accountId?: string | null) => {
      setIsSyncing(true);
      try {
        const response = await apiClient.request('/v1/oauth/tiktok/posts/sync', {
          method: 'POST',
          body: {
            mode: immediate ? 'immediate' : 'async',
            limit,
            account_id: accountId ?? selectedAccountId ?? undefined,
          } as any,
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to sync TikTok posts.');
          return;
        }

        toast.success(
          response.meta?.message ??
            (immediate ? 'TikTok account synced successfully.' : 'TikTok sync scheduled.'),
        );

        if (immediate) {
          await load(accountId ?? selectedAccountId ?? null);
        }
      } catch (error) {
        console.error('[useTikTokPosts] sync error', error);
        toast.error('Failed to sync TikTok account.');
      } finally {
        setIsSyncing(false);
      }
    },
    [load, selectedAccountId],
  );

  const updateRewardCoin = useCallback(
    async (pageId: string, coinSymbol: string) => {
      if (!pageId) {
        return;
      }

      setIsUpdatingRewardCoin(true);
      try {
        const response = await apiClient.request(`/v1/oauth/tiktok/pages/${pageId}/reward-coin`, {
          method: 'PUT',
          body: {
            coin_symbol: coinSymbol,
          } as any,
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to update reward coin.');
          return;
        }

        toast.success('TikTok reward coin updated.');

        let targetAccountId: string | null = selectedAccountId ?? account?.id ?? null;

        if (response.meta?.account) {
          const nextMeta = response.meta.account as TikTokAccountMeta;
          setAccount(nextMeta);

          setAccounts((previous) => {
            const next = previous.map((item) => (item.id === nextMeta.id ? nextMeta : item));
            const exists = next.some((item) => item.id === nextMeta.id);
            return exists ? next : [...next, nextMeta];
          });

          targetAccountId = nextMeta.id ?? nextMeta.social_account_id ?? targetAccountId;
          setSelectedAccountId(targetAccountId);
        }

        await load(targetAccountId);
      } catch (error) {
        console.error('[useTikTokPosts] updateRewardCoin error', error);
        toast.error('Failed to update reward coin for TikTok.');
      } finally {
        setIsUpdatingRewardCoin(false);
      }
    },
    [account?.id, load, selectedAccountId],
  );

  const selectAccount = useCallback(
    async (accountId: string | null) => {
      await load(accountId);
    },
    [load],
  );

  return {
    posts,
    account,
    accounts,
    selectedAccountId,
    meta,
    isLoading,
    isSyncing,
    isUpdatingRewardCoin,
    load,
    sync,
    updateRewardCoin,
    selectAccount,
  };
}

