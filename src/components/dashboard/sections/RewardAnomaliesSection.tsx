import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type Timeframe = '24h' | '7d' | '30d';

type RewardAnomalyData = {
  timeframe: Timeframe;
  since: string;
  stats: {
    total_actions: number;
    total_amount: number;
    unique_users: number;
    unique_posts: number;
    pending_confirmations: number;
  };
  top_earners: Array<{
    user_id: string;
    username: string;
    display_name: string | null;
    total_earned: number;
    action_count: number;
  }>;
  duplicate_hashes: Array<{
    hash: string;
    occurrence_count: number;
    total_amount: number;
    sample_user: string;
    sample_excerpt?: string | null;
  }>;
  spikes: Array<{
    user_id: string;
    username: string;
    display_name: string | null;
    action_date: string;
    daily_count: number;
    daily_amount: number;
  }>;
};

export function RewardAnomaliesSection() {
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const [data, setData] = useState<RewardAnomalyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (targetTimeframe: Timeframe) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.request<RewardAnomalyData>(
          `/v1/admin/reward-anomalies?timeframe=${targetTimeframe}`,
        );
        console.log('[RewardAnomaliesSection] API response', { ok: response.ok, data: response.data, errors: response.errors });
        if (response.ok && response.data) {
          // apiClient automatically unwraps the 'data' key, so response.data is already the inner data
          setData(response.data);
        } else {
          const errorMsg = response.errors?.[0]?.detail || 'Unable to load anomaly data.';
          console.error('[RewardAnomaliesSection] API error', errorMsg, response.errors);
          setError(errorMsg);
        }
      } catch (err) {
        console.error('[RewardAnomaliesSection] fetch error', err);
        setError('Unable to load anomaly data. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(timeframe).catch(() => null);
  }, [fetchData, timeframe]);

  const timeframeLabel = useMemo(() => {
    switch (timeframe) {
      case '24h':
        return 'last 24 hours';
      case '7d':
        return 'last 7 days';
      case '30d':
        return 'last 30 days';
      default:
        return 'recent period';
    }
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Reward anomaly dashboard</h2>
          <p className="text-sm text-slate-500">
            Monitor suspicious payouts, duplicate comments, and high-velocity earners in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: Timeframe) => setTimeframe(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchData(timeframe)}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="p-6 border-red-100 bg-red-50">
          <p className="text-red-600 font-semibold mb-1">Unable to load anomaly metrics</p>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button onClick={() => fetchData(timeframe)}>Try again</Button>
        </Card>
      )}

      {!isLoading && !error && data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 border-purple-100 bg-white">
              <p className="text-sm text-slate-500">Total payouts ({timeframeLabel})</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">
                {data.stats.total_amount.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{data.stats.total_actions} actions logged</p>
            </Card>
            <Card className="p-5 border-purple-100 bg-white">
              <p className="text-sm text-slate-500">Unique earners</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">
                {data.stats.unique_users.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Across {data.stats.unique_posts.toLocaleString()} posts
              </p>
            </Card>
            <Card className="p-5 border-orange-100 bg-white">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-medium">Pending confirmations</p>
              </div>
              <p className="text-2xl font-semibold text-orange-700 mt-2">
                {data.stats.pending_confirmations}
              </p>
              <p className="text-xs text-slate-500 mt-1">Awaiting delayed payout checks</p>
            </Card>
            <Card className="p-5 border-green-100 bg-white">
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-sm font-medium">Since</p>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {new Date(data.since).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-xs text-slate-500 mt-1">Window start</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6 border-purple-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Top earners</h3>
                  <p className="text-sm text-slate-500">Highest payouts in the {timeframeLabel}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              {data.top_earners.length === 0 ? (
                <p className="text-sm text-slate-500">No high earning accounts yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.top_earners.map((earner) => (
                    <div
                      key={earner.user_id}
                      className="flex items-center justify-between rounded-lg border border-purple-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {earner.display_name || `@${earner.username}`}
                        </p>
                        <p className="text-xs text-slate-500">{earner.action_count} rewarded actions</p>
                      </div>
                      <Badge className="bg-purple-50 text-purple-700 border-purple-100">
                        {earner.total_earned.toFixed(2)} coins
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 border-orange-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Duplicate comments</h3>
                  <p className="text-sm text-slate-500">Same comment text rewarded multiple times.</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              {data.duplicate_hashes.length === 0 ? (
                <p className="text-sm text-slate-500">No duplicate comment rewards detected.</p>
              ) : (
                <div className="space-y-3">
                  {data.duplicate_hashes.map((item) => (
                    <div
                      key={item.hash}
                      className="rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900">{item.sample_user}</p>
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          {item.occurrence_count} duplicates
                        </Badge>
                      </div>
                      {item.sample_excerpt && (
                        <p className="text-xs text-slate-500 line-clamp-2">"{item.sample_excerpt}"</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {item.total_amount.toFixed(2)} coins rewarded across duplicates
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-6 border-blue-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Spike alerts</h3>
                <p className="text-sm text-slate-500">Unusual bursts of rewarded actions per user/day.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            {data.spikes.length === 0 ? (
              <p className="text-sm text-slate-500">No spikes detected in the selected timeframe.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.spikes.map((spike) => (
                  <div
                    key={`${spike.user_id}-${spike.action_date}`}
                    className="rounded-lg border border-blue-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {spike.display_name || `@${spike.username}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(spike.action_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        {spike.daily_count} actions
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {spike.daily_amount.toFixed(2)} coins rewarded that day
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

