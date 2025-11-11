import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type SocialAccount = {
  provider: string;
  provider_user_id: string | null;
  provider_username: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const API_ORIGIN = new URL(API_BASE_URL).origin;

type ConnectableProvider = 'facebook' | 'instagram';

const providerLabels: Record<ConnectableProvider, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<SocialAccount[]>('/v1/oauth/accounts');
      if (response.ok && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        toast.error('Unable to load connected accounts.');
      }
    } catch (error) {
      console.error('[useSocialAccounts] load error', error);
      toast.error('Failed to load connected accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch((error) => {
      console.error('[useSocialAccounts] initial load error', error);
    });
  }, [load]);

  const connect = useCallback(
    async (provider: ConnectableProvider) => {
      if (isConnecting) {
        return;
      }

      setIsConnecting(true);

      try {
        const origin = window.location.origin;
        const response = await apiClient.request<{ url: string }>(
          `/v1/oauth/${provider}/login-url?origin=${encodeURIComponent(origin)}`,
        );

        if (!response.ok || !response.data?.url) {
          toast.error(
            response.errors?.[0]?.detail ?? `Unable to start ${providerLabels[provider]} connection.`,
          );
          setIsConnecting(false);
          return;
        }

        const popup = window.open(
          response.data.url,
          `${provider}Connect`,
          'width=600,height=720,noopener' as string,
        );

        if (!popup) {
          toast.error('Popup blocked. Please allow popups and try again.');
          setIsConnecting(false);
          return;
        }

        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== API_ORIGIN) {
            return;
          }

          const payload = event.data;
          if (!payload || payload.provider !== provider) {
            return;
          }

          window.removeEventListener('message', handleMessage);

          if (payload.status === 'success') {
            toast.success(`${providerLabels[provider]} connected.`);
            load().catch((error) => {
              console.error('[useSocialAccounts] reload after connect failed', error);
            });
          } else {
            toast.error(payload.message ?? `${providerLabels[provider]} connection was cancelled.`);
          }

          setIsConnecting(false);
        };

        window.addEventListener('message', handleMessage);
      } catch (error) {
        console.error(`[useSocialAccounts] connect ${provider} error`, error);
        toast.error(`Unable to connect ${providerLabels[provider]} account.`);
        setIsConnecting(false);
      }
    },
    [isConnecting, load],
  );

  const disconnect = useCallback(
    async (provider: string) => {
      try {
        const response = await apiClient.request(`/v1/oauth/${provider}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Failed to disconnect account.');
          return;
        }

        toast.success('Account disconnected.');
        await load();
      } catch (error) {
        console.error('[useSocialAccounts] disconnect error', error);
        toast.error('Failed to disconnect account.');
      }
    },
    [load],
  );

  const accountsMap = useMemo(() => {
    return accounts.reduce<Record<string, SocialAccount>>((acc, account) => {
      acc[account.provider] = account;
      return acc;
    }, {});
  }, [accounts]);

  return {
    accounts,
    accountsMap,
    isLoading,
    isConnecting,
    connectFacebook: () => connect('facebook'),
    connectInstagram: () => connect('instagram'),
    disconnect,
    reload: load,
  };
}

