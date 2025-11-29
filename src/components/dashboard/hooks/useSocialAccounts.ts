import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

type PendingRecovery = {
  token: string;
  providerUserId: string;
  providerUsername?: string | null;
  mode: 'profile' | 'pages' | 'creator' | 'fan';
};

export type SocialAccount = {
  id: string;
  provider: string;
  provider_user_id: string | null;
  provider_username: string | null;
  provider_picture_url?: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const API_ORIGIN = new URL(API_BASE_URL).origin;

type ConnectableProvider = 'facebook' | 'instagram' | 'tiktok' | 'youtube';

type ConnectOptions = {
  mode?: 'profile' | 'pages' | 'creator' | 'fan';
};

const providerLabels: Record<ConnectableProvider, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [pendingRecovery, setPendingRecovery] = useState<PendingRecovery | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

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
    async (provider: ConnectableProvider, options: ConnectOptions = {}) => {
      if (isConnecting) {
        return;
      }

      setIsConnecting(true);
      setPendingRecovery(null);

      const popupFeatures = 'width=600,height=720';
      const popupName = `${provider}Connect`;
      const popup = window.open('', popupName, popupFeatures);

      if (!popup) {
        toast.error('Popup blocked. Please allow popups and try again.');
        console.debug('[useSocialAccounts] OAuth popup could not be opened (null window)', {
          provider,
        });
        setIsConnecting(false);
        return;
      }

      const providerLabel = providerLabels[provider];

      try {
        popup.document.write(
          `<!DOCTYPE html><title>Connecting…</title><body style="font-family:sans-serif;text-align:center;padding:2rem;">Connecting to ${providerLabel}…</body>`,
        );
        popup.document.close();
      } catch (contentError) {
        console.debug('[useSocialAccounts] Unable to write placeholder content', {
          provider,
          contentError,
        });
      }

      try {
        popup.focus();
      } catch (focusError) {
        console.debug('[useSocialAccounts] Unable to focus popup', { provider, focusError });
      }

      const origin = window.location.origin;
      const params = new URLSearchParams({ origin });

      if (options.mode) {
        params.append('mode', options.mode);
      }

      try {
        const response = await apiClient.request<{ url: string }>(
          `/v1/oauth/${provider}/login-url?${params.toString()}`,
        );

        if (!response.ok || !response.data?.url) {
          const message =
            response.errors?.[0]?.detail ?? `Unable to start ${providerLabel} connection.`;
          toast.error(message);
          console.debug('[useSocialAccounts] login-url request failed', { provider, response });
          popup.close();
          setIsConnecting(false);
          return;
        }

        popup.location.href = response.data.url;
        console.debug('[useSocialAccounts] OAuth popup navigating to URL', {
          provider,
          url: response.data.url,
        });
      } catch (error) {
        console.error(`[useSocialAccounts] connect ${provider} error before popup navigation`, error);
        toast.error(`Unable to connect ${providerLabel} account.`);
        popup.close();
        setIsConnecting(false);
        return;
      }

      let popupClosed = false;

      const clearListeners = (reason: string) => {
        console.debug('[useSocialAccounts] clearing listeners', { provider, reason });
        window.removeEventListener('message', handleMessage);
        window.clearInterval(closeChecker);
        setIsConnecting(false);
      };

      const handleMessage = (event: MessageEvent) => {
        const payload = event.data;
        if (!payload) {
          return;
        }

        const expectedProviders = new Set<string>([provider]);
        if (provider === 'tiktok') {
          expectedProviders.add('tiktok_fan');
        }

        if (!expectedProviders.has(payload.provider)) {
          return;
        }

        console.debug('[useSocialAccounts] received popup message', { provider, payload });

        popupClosed = true;

        if (!popup.closed) {
          popup.close();
          console.debug('[useSocialAccounts] popup closed programmatically', { provider });
        }

        if (payload.status === 'success') {
          const connectionLabel =
            payload.provider === 'tiktok_fan'
              ? 'TikTok fan profile connected.'
              : payload.provider === 'tiktok'
              ? 'TikTok creator connected.'
              : payload.provider === 'instagram'
              ? 'Instagram connected.'
              : payload.provider === 'youtube'
              ? 'YouTube channel connected.'
              : payload.message ?? `${providerLabel} connected.`;

          toast.success(connectionLabel);
          load().catch((reloadError) => {
            console.error('[useSocialAccounts] reload after connect failed', reloadError);
          });
        } else if (payload.status === 'recoverable') {
          if (payload.recovery_token) {
            const recovery: PendingRecovery = {
              token: payload.recovery_token,
              providerUserId: payload.provider_user_id,
              providerUsername: payload.provider_username,
              mode: payload.mode ?? options.mode ?? 'profile',
            };

            setPendingRecovery(recovery);

            const recoveryLabel =
              typeof payload.message === 'string' && payload.message.trim().length > 0
                ? payload.message
                : `${providerLabel} connection needs action.`;

            toast.error(recoveryLabel);
          } else {
            toast.error(
              typeof payload.message === 'string' && payload.message.trim().length > 0
                ? payload.message
                : `${providerLabel} connection was cancelled.`,
            );
          }
        } else {
          const errorMessage =
            typeof payload.message === 'string' && payload.message.trim().length > 0
              ? payload.message
              : `${providerLabel} connection was cancelled.`;

          toast.error(errorMessage);
        }

        clearListeners('message-received');
      };

      window.addEventListener('message', handleMessage);

      const closeChecker = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(closeChecker);
          console.debug('[useSocialAccounts] popup detected closed', {
            provider,
            popupClosed,
          });

          if (!popupClosed && !pendingRecovery) {
            toast.error(`${providerLabel} connection was cancelled.`);
            clearListeners('popup-closed');
          }
        }
      }, 500);
    },
    [isConnecting, load, pendingRecovery],
  );

  const recoverFacebookProfile = useCallback(
    async () => {
      if (!pendingRecovery || isRecovering) {
        return;
      }

      setIsRecovering(true);
      try {
        const response = await apiClient.request('/v1/oauth/facebook/recover', {
          method: 'POST',
          body: { token: pendingRecovery.token } as any,
        });

        if (!response.ok) {
          toast.error(
            response.errors?.[0]?.detail ?? 'Unable to complete Facebook profile recovery at this time.',
          );
          if (response.status === 404 || response.status === 410) {
            setPendingRecovery(null);
          }
          return;
        }

        toast.success('Facebook profile moved to this account.');
        setPendingRecovery(null);
        await load();
      } catch (error) {
        console.error('[useSocialAccounts] recoverFacebookProfile error', error);
        toast.error('Unable to recover Facebook profile. Please try connecting again.');
        setPendingRecovery(null);
      } finally {
        setIsRecovering(false);
      }
    },
    [isRecovering, load, pendingRecovery],
  );

  const dismissRecovery = useCallback(() => {
    setPendingRecovery(null);
  }, []);

  const disconnect = useCallback(
    async (provider: string, providerAccountId?: string) => {
      try {
        let endpoint = `/v1/oauth/${provider}`;

        if (providerAccountId) {
          endpoint = `${endpoint}?account_id=${encodeURIComponent(providerAccountId)}`;
        }

        const response = await apiClient.request(endpoint, {
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

  const instagramAccounts = useMemo(() => {
    return accounts.filter((account) => account.provider === 'instagram');
  }, [accounts]);

  const tiktokCreatorAccounts = useMemo(() => {
    return accounts.filter((account) => account.provider === 'tiktok');
  }, [accounts]);

  const tiktokFanAccounts = useMemo(() => {
    return accounts.filter((account) => account.provider === 'tiktok_fan');
  }, [accounts]);

  const youtubeAccounts = useMemo(() => {
    return accounts.filter((account) => account.provider === 'youtube');
  }, [accounts]);

  return {
    accounts,
    accountsMap,
    instagramAccounts,
    youtubeAccounts,
    tiktokCreatorAccounts,
    tiktokFanAccounts,
    isLoading,
    isConnecting,
    pendingRecovery,
    isRecovering,
    recoverFacebookProfile,
    dismissRecovery,
    connectFacebookProfile: () => connect('facebook', { mode: 'profile' }),
    connectFacebookPages: () => connect('facebook', { mode: 'pages' }),
    connectInstagram: () => connect('instagram'),
    connectTikTokCreator: () => connect('tiktok', { mode: 'creator' }),
    connectTikTokFan: () => connect('tiktok', { mode: 'fan' }),
    connectYouTube: () => connect('youtube'),
    disconnect,
    reload: load,
  };
}