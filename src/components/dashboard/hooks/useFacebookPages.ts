import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type ConnectedFacebookPage = {
  id: string;
  page_id: string;
  name: string | null;
  category: string | null;
  picture_url: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
  sync_status: string | null;
  sync_error?: string | null;
  reward_coin_symbol?: string | null;
  role?: 'owner' | 'collaborator';
  owner_user_id?: string | null;
  owner_display_name?: string | null;
};

export type AvailableFacebookPage = {
  page_id: string;
  name: string | null;
  category: string | null;
  picture_url: string | null;
  connected: boolean;
  social_page_id?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
  role?: 'owner' | 'collaborator';
  owner_user_id?: string | null;
  owner_display_name?: string | null;
  can_claim?: boolean;
};

export function useFacebookPages() {
  const [pages, setPages] = useState<ConnectedFacebookPage[]>([]);
  const [availablePages, setAvailablePages] = useState<AvailableFacebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<ConnectedFacebookPage[]>('/v1/oauth/facebook/pages');
      if (response.ok && Array.isArray(response.data)) {
        setPages(response.data);
      } else {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to load connected Facebook Pages.');
      }
    } catch (error) {
      console.error('[useFacebookPages] loadPages', error);
      toast.error('Failed to load connected Facebook Pages.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAvailablePages = useCallback(async () => {
    setIsLoadingAvailable(true);
    try {
      const response = await apiClient.request<AvailableFacebookPage[]>(
        '/v1/oauth/facebook/pages/available',
      );

      if (response.ok && Array.isArray(response.data)) {
        setAvailablePages(response.data);
      } else {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to fetch Facebook Pages.');
      }
    } catch (error) {
      console.error('[useFacebookPages] loadAvailablePages', error);
      toast.error('Failed to fetch Facebook Pages.');
    } finally {
      setIsLoadingAvailable(false);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadPages(), loadAvailablePages()]);
  }, [loadPages, loadAvailablePages]);

  const connectPage = useCallback(
    async (pageId: string) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const response = await apiClient.request<ConnectedFacebookPage>('/v1/oauth/facebook/pages', {
          method: 'POST',
          body: { page_id: pageId } as any,
        });

        if (!response.ok) {
          const message = response.errors?.[0]?.detail ?? 'Unable to connect Facebook Page.';
          toast.error(message);
          throw new Error(message);
        }

        toast.success(
          response.data?.role === 'owner'
            ? 'Facebook Page connected as owner.'
            : 'Facebook Page connected.',
        );
        await reloadAll();

        return response.data;
      } catch (error) {
        console.error('[useFacebookPages] connectPage', error);
        if (!(error instanceof Error)) {
          toast.error('Unable to connect Facebook Page.');
        }
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, reloadAll],
  );

  const claimOwnership = useCallback(
    async (pageId: string) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const response = await apiClient.request<ConnectedFacebookPage>(
          `/v1/oauth/facebook/pages/${pageId}/claim`,
          {
            method: 'POST',
          },
        );

        if (!response.ok) {
          const message = response.errors?.[0]?.detail ?? 'Unable to claim ownership.';
          toast.error(message);
          throw new Error(message);
        }

        toast.success('Ownership claimed successfully.');
        await reloadAll();

        return response.data;
      } catch (error) {
        console.error('[useFacebookPages] claimOwnership', error);
        if (!(error instanceof Error)) {
          toast.error('Unable to claim ownership for this Page.');
        }
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, reloadAll],
  );

  const disconnectPage = useCallback(
    async (id: string) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const response = await apiClient.request(`/v1/oauth/facebook/pages/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const message = response.errors?.[0]?.detail ?? 'Unable to disconnect Facebook Page.';
          toast.error(message);
          throw new Error(message);
        }

        toast.success('Facebook Page disconnected.');
        await reloadAll();
      } catch (error) {
        console.error('[useFacebookPages] disconnectPage', error);
        if (!(error instanceof Error)) {
          toast.error('Unable to disconnect Facebook Page.');
        }
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, reloadAll],
  );

  const updateRewardCoin = useCallback(
    async (id: string, coinSymbol: string) => {
      if (isUpdating) {
        return;
      }

      setIsUpdating(true);
      try {
        const response = await apiClient.request(`/v1/oauth/facebook/pages/${id}/reward-coin`, {
          method: 'PUT',
          body: { coin_symbol: coinSymbol } as any,
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to update reward coin.');
          return;
        }

        toast.success('Reward coin updated.');
        await loadPages();
      } catch (error) {
        console.error('[useFacebookPages] updateRewardCoin', error);
        toast.error('Failed to update reward coin.');
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, loadPages],
  );

  return {
    pages,
    availablePages,
    isLoading,
    isLoadingAvailable,
    isSaving,
    isUpdating,
    loadPages,
    loadAvailablePages,
    connectPage,
    claimOwnership,
    disconnectPage,
    updateRewardCoin,
  };
}

