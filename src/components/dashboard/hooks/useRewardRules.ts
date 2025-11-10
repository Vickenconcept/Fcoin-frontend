import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type RewardRules = {
  base_amount: number;
  per_type: {
    like: number;
    comment: number;
    share: number;
    watch: number;
    [key: string]: number;
  };
};

const defaultRewardRules: RewardRules = {
  base_amount: 0,
  per_type: {
    like: 5,
    comment: 15,
    share: 25,
    watch: 10,
  },
};

type RewardRuleResponse = {
  id?: string;
  rules: RewardRules;
  updated_at?: string;
  exists?: boolean;
};

export function useRewardRules() {
  const [rules, setRules] = useState<RewardRules>(defaultRewardRules);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<RewardRuleResponse>('/v1/reward-rules');
      if (response.ok && response.data?.rules) {
        setRules({
          ...defaultRewardRules,
          ...response.data.rules,
          per_type: {
            ...defaultRewardRules.per_type,
            ...response.data.rules.per_type,
          },
        });
      } else if (!response.ok) {
        toast.error('Unable to load reward rules.');
      }
    } catch (error) {
      console.error('[useRewardRules] load error', error);
      toast.error('Failed to load reward rules.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (nextRules: RewardRules) => {
    setIsSaving(true);
    try {
      const response = await apiClient.request<RewardRuleResponse>('/v1/reward-rules', {
        method: 'PUT',
        body: {
          base_amount: nextRules.base_amount,
          per_type: nextRules.per_type,
        },
      });

      if (response.ok && response.data?.rules) {
        setRules({
          ...defaultRewardRules,
          ...response.data.rules,
          per_type: {
            ...defaultRewardRules.per_type,
            ...response.data.rules.per_type,
          },
        });
        toast.success('Reward settings saved.');
      } else {
        toast.error(response.errors?.[0]?.detail ?? 'Failed to save reward rules.');
      }
    } catch (error) {
      console.error('[useRewardRules] save error', error);
      toast.error('Failed to save reward rules.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    load().catch((error) => {
      console.error('[useRewardRules] initial load error', error);
    });
  }, [load]);

  return {
    rules,
    isLoading,
    isSaving,
    reload: load,
    save,
    defaultRules,
  };
}

export const defaultRules = defaultRewardRules;

