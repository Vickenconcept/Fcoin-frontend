import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import type { SocialPost } from './useFacebookPagePosts';

type InstagramAccountMeta = {
  id: string;
  social_account_id: string;
  social_page_id?: string | null;
  instagram_account_id: string;
  instagram_username: string | null;
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

type InstagramPostsResponse = {
  data: SocialPost[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
    account?: InstagramAccountMeta | null;
    accounts?: InstagramAccountMeta[];
    selected_account_id?: string | null;
  };
};

export function useInstagramPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [meta, setMeta] = useState<InstagramPostsResponse['meta']>({});
  const [account, setAccount] = useState<InstagramAccountMeta | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccountMeta[]>([]);
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
        params.size > 0
          ? `/v1/oauth/instagram/posts?${params.toString()}`
          : '/v1/oauth/instagram/posts';

      const response = await apiClient.request<InstagramPostsResponse>(endpoint);

      if (response.ok && Array.isArray(response.data)) {
        setPosts(response.data);
        setMeta(response.meta ?? {});
        const accountMeta = (response.meta?.account ?? null) as InstagramAccountMeta | null;
        const accountsMeta = Array.isArray(response.meta?.accounts)
          ? (response.meta?.accounts as InstagramAccountMeta[])
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
        toast.error(response.errors?.[0]?.detail ?? 'Unable to load Instagram posts.');
      }
    } catch (error) {
      console.error('[useInstagramPosts] load error', error);
      setPosts([]);
      setAccount(null);
      setAccounts([]);
      setSelectedAccountId(null);
      toast.error('Failed to load Instagram posts.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  const sync = useCallback(
    async (immediate = true, limit?: number, accountId?: string | null) => {
      setIsSyncing(true);
      try {
        const response = await apiClient.request('/v1/oauth/instagram/posts/sync', {
          method: 'POST',
          body: {
            mode: immediate ? 'immediate' : 'async',
            limit,
            account_id: accountId ?? selectedAccountId ?? undefined,
          } as any,
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to sync Instagram posts.');
          return;
        }

        toast.success(
          response.meta?.message ??
            (immediate ? 'Instagram account synced successfully.' : 'Instagram sync scheduled.'),
        );

        if (immediate) {
          await load(accountId ?? selectedAccountId ?? null);
        }
      } catch (error) {
        console.error('[useInstagramPosts] sync error', error);
        toast.error('Failed to sync Instagram account.');
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
        const response = await apiClient.request(`/v1/oauth/instagram/pages/${pageId}/reward-coin`, {
          method: 'PUT',
          body: {
            coin_symbol: coinSymbol,
          } as any,
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to update reward coin.');
          return;
        }

        toast.success('Instagram reward coin updated.');

        let targetAccountId: string | null = selectedAccountId ?? account?.id ?? null;

        if (response.meta?.account) {
          const nextMeta = response.meta.account as InstagramAccountMeta;
          setAccount(nextMeta);

          setAccounts((previous) => {
            const next = previous.map((item) =>
              item.id === nextMeta.id ? nextMeta : item,
            );

            const exists = next.some((item) => item.id === nextMeta.id);
            return exists ? next : [...next, nextMeta];
          });

          targetAccountId = nextMeta.id ?? nextMeta.social_account_id ?? targetAccountId;
          setSelectedAccountId(targetAccountId);
        }

        await load(targetAccountId);
      } catch (error) {
        console.error('[useInstagramPosts] updateRewardCoin error', error);
        toast.error('Failed to update reward coin for Instagram.');
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

