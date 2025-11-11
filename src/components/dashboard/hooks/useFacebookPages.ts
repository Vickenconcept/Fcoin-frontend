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
};

export function useFacebookPages() {
  const [pages, setPages] = useState<ConnectedFacebookPage[]>([]);
  const [availablePages, setAvailablePages] = useState<AvailableFacebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const connectPage = useCallback(
    async (pageId: string) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const response = await apiClient.request('/v1/oauth/facebook/pages', {
          method: 'POST',
          body: { page_id: pageId },
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to connect Facebook Page.');
          return;
        }

        toast.success('Facebook Page connected.');
        await Promise.all([loadPages(), loadAvailablePages()]);
      } catch (error) {
        console.error('[useFacebookPages] connectPage', error);
        toast.error('Unable to connect Facebook Page.');
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, loadPages, loadAvailablePages],
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
          toast.error(response.errors?.[0]?.detail ?? 'Unable to disconnect Facebook Page.');
          return;
        }

        toast.success('Facebook Page disconnected.');
        await Promise.all([loadPages(), loadAvailablePages()]);
      } catch (error) {
        console.error('[useFacebookPages] disconnectPage', error);
        toast.error('Unable to disconnect Facebook Page.');
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, loadPages, loadAvailablePages],
  );

  return {
    pages,
    availablePages,
    isLoading,
    isLoadingAvailable,
    isSaving,
    loadPages,
    loadAvailablePages,
    connectPage,
    disconnectPage,
  };
}

