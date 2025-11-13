import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export type PreferenceKey = 'top_up' | 'wallet_transfer' | 'reward';
export type ChannelKey = 'email' | 'in_app';

export type NotificationPreferencesForm = {
  email: Record<PreferenceKey, boolean>;
  in_app: Record<PreferenceKey, boolean>;
};

type UseNotificationPreferencesReturn = {
  preferences: NotificationPreferencesForm;
  isSaving: boolean;
  isDirty: boolean;
  updatePreference: (channel: ChannelKey, key: PreferenceKey, value: boolean) => void;
  reset: () => void;
  save: () => Promise<void>;
};

const DEFAULT_PREFS: NotificationPreferencesForm = {
  email: {
    top_up: true,
    wallet_transfer: true,
    reward: false,
  },
  in_app: {
    top_up: true,
    wallet_transfer: true,
    reward: true,
  },
};

const DOT_KEY_MAP: Record<PreferenceKey, string> = {
  top_up: 'top_up.completed',
  wallet_transfer: 'wallet.transfer',
  reward: 'reward.awarded',
};

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesForm>(DEFAULT_PREFS);
  const [initialPreferences, setInitialPreferences] =
    useState<NotificationPreferencesForm>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);

  const hydrateFromUser = useCallback((): NotificationPreferencesForm => {
    const raw = (user as any)?.notification_preferences ?? {};

    const next: NotificationPreferencesForm = {
      email: { ...DEFAULT_PREFS.email },
      in_app: { ...DEFAULT_PREFS.in_app },
    };

    (['email', 'in_app'] as ChannelKey[]).forEach((channel) => {
      (Object.keys(DOT_KEY_MAP) as PreferenceKey[]).forEach((key) => {
        const dotKey = DOT_KEY_MAP[key];
        const value =
          typeof raw?.[channel]?.[dotKey] === 'boolean'
            ? Boolean(raw[channel][dotKey])
            : DEFAULT_PREFS[channel][key];
        next[channel][key] = value;
      });
    });

    return next;
  }, [user]);

  useEffect(() => {
    const next = hydrateFromUser();
    setPreferences(next);
    setInitialPreferences(next);
  }, [hydrateFromUser]);

  const updatePreference = useCallback(
    (channel: ChannelKey, key: PreferenceKey, value: boolean) => {
      setPreferences((previous) => ({
        ...previous,
        [channel]: {
          ...previous[channel],
          [key]: value,
        },
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  const isDirty = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
  }, [preferences, initialPreferences]);

  const save = useCallback(async () => {
    if (!isDirty) {
      toast('No changes to update.', { icon: 'ℹ️' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.request('/v1/profile/notifications', {
        method: 'PUT',
        body: toPayload(preferences) as any,
      });

      if (!response.ok) {
        toast.error(response.errors?.[0]?.detail ?? 'Unable to update notification preferences.');
        return;
      }

      toast.success('Notification preferences updated.');
      setInitialPreferences(preferences);
      await refreshUser();
    } catch (error) {
      console.error('[useNotificationPreferences] save error', error);
      toast.error('Failed to update notification preferences.');
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, preferences, refreshUser]);

  return {
    preferences,
    isSaving,
    isDirty,
    updatePreference,
    reset,
    save,
  };
}

function toPayload(preferences: NotificationPreferencesForm) {
  const payload: Record<string, any> = {
    email: {},
    in_app: {},
  };

  (['email', 'in_app'] as ChannelKey[]).forEach((channel) => {
    (Object.keys(DOT_KEY_MAP) as PreferenceKey[]).forEach((key) => {
      payload[channel][key] = Boolean(preferences[channel][key]);
    });
  });

  return payload;
}


