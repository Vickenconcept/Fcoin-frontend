import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { useFacebookPages, ConnectedFacebookPage } from '../hooks/useFacebookPages';
import { useFacebookPagePosts, SocialPost } from '../hooks/useFacebookPagePosts';
import type { CreatorCoin } from '../hooks/useCoins';

type NormalizedEngagedUser = {
  user_id: string;
  name?: string;
  interactions: Array<{ type: string; extra: Record<string, unknown> }>;
};

type InputChangeEvent = {
  target: {
    value: string;
  };
};

type SocialInsightsSectionProps = {
  coins: CreatorCoin[];
  isCoinsLoading: boolean;
};

const normalizeEngagedUsers = (post: SocialPost): NormalizedEngagedUser[] => {
  const metadata = (post.metadata as Record<string, unknown> | undefined) ?? undefined;
  const rawUsers = Array.isArray((metadata as any)?.engaged_users)
    ? ((metadata as any).engaged_users as Array<any>)
    : [];

  return rawUsers
    .map((raw) => {
      const userId = raw?.user_id ? String(raw.user_id) : '';
      const name = typeof raw?.name === 'string' ? raw.name : undefined;
      const interactions = Array.isArray(raw?.interactions)
        ? (raw.interactions as Array<any>).map((interaction) => ({
            type: String(interaction?.type ?? '').toUpperCase(),
            extra: (interaction?.extra ?? {}) as Record<string, unknown>,
          }))
        : [];

      return {
        user_id: userId,
        name,
        interactions,
      } satisfies NormalizedEngagedUser;
    })
    .filter((user) => Boolean(user.user_id));
};

export function SocialInsightsSection({ coins, isCoinsLoading }: SocialInsightsSectionProps) {
  const {
    pages,
    isLoading: isPagesLoading,
    loadPages,
    updateRewardCoin,
    isUpdating: isUpdatingRewardCoin,
  } = useFacebookPages();

  const {
    posts,
    meta,
    isLoading: isPostsLoading,
    isSyncing,
    selectedPageId,
    load: loadPosts,
    sync: syncPage,
  } = useFacebookPagePosts();

  const [activePageId, setActivePageId] = useState(null as string | null);
  const [engagementModalPost, setEngagementModalPost] = useState<SocialPost | null>(null);
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDate, setFilterDate] = useState<string>('all');

  useEffect(() => {
    loadPages().catch((error: unknown) => console.error('[SocialInsightsSection] loadPages', error));
  }, [loadPages]);

  useEffect(() => {
    if (pages.length === 0) {
      setActivePageId(null);
      return;
    }

    if (!activePageId) {
      const first = pages[0]?.id ?? null;
      setActivePageId(first);
      if (first) {
        loadPosts(first).catch((error: unknown) =>
          console.error('[SocialInsightsSection] initial loadPosts', error),
        );
      }
    }
  }, [pages, activePageId, loadPosts]);

  const selectedPage = useMemo(() => {
    const targetId = activePageId ?? selectedPageId ?? '';
    if (!targetId) {
      return undefined;
    }

    return pages.find((page: ConnectedFacebookPage) => page.id === targetId);
  }, [pages, activePageId, selectedPageId]);

  const handleSelectPage = (id: string) => {
    setActivePageId(id);
    loadPosts(id).catch((error: unknown) => console.error('[SocialInsightsSection] loadPosts', error));
  };

  const handleSync = (id: string | null) => {
    if (!id) return;

    syncPage(id, true).catch((error: unknown) => console.error('[SocialInsightsSection] syncPage', error));
  };

  const filteredPosts = useMemo(() => {
    const filterTypeUpper = filterType.toUpperCase();

    return posts.filter((post) => {
      const engagedUsers = normalizeEngagedUsers(post);

      const interactionsMatch =
        filterType === 'all' ||
        engagedUsers.some((user) =>
          user.interactions?.some((interaction) => interaction.type === filterTypeUpper),
        );

      const searchMatch = filterSearch
        ? engagedUsers.some((user) =>
            (user.name || '').toLowerCase().includes(filterSearch.trim().toLowerCase()),
          )
        : true;

      const dateMatch = (() => {
        if (filterDate === 'all' || !post.published_at) {
          return true;
        }

        const published = new Date(post.published_at).getTime();
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        switch (filterDate) {
          case '7d':
            return now - published <= 7 * day;
          case '30d':
            return now - published <= 30 * day;
          case '90d':
            return now - published <= 90 * day;
          default:
            return true;
        }
      })();

      return interactionsMatch && searchMatch && dateMatch;
    });
  }, [posts, filterType, filterSearch, filterDate]);

  const openEngagementModal = (post: SocialPost) => {
    setEngagementModalPost(post);
    setEngagementModalOpen(true);
  };

  const renderEngagementModal = () => {
    if (!engagementModalPost) {
      return null;
    }

    const engagedUsers = normalizeEngagedUsers(engagementModalPost);

    const items = engagedUsers.flatMap((user) =>
      user.interactions.map((interaction) => ({
        userName: user.name ?? user.user_id,
        userId: user.user_id,
        type: interaction.type,
        extra: interaction.extra ?? {},
      })),
    );

    return (
      <Dialog open={engagementModalOpen} onOpenChange={setEngagementModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Engagement Details</DialogTitle>
            <DialogDescription>
              {engagementModalPost.permalink_url ? (
                <a
                  href={engagementModalPost.permalink_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View post on Facebook
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">No permalink available</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No fan engagement has been recorded for this post yet.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div
                  key={`${item.userId}-${item.type}-${index}`}
                  className="rounded-lg border border-purple-100 bg-purple-50/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="font-semibold text-slate-900">{item.userName}</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-600 border-purple-200 uppercase text-xs">
                      {item.type}
                    </Badge>
                  </div>
                  {item.extra?.message && (
                    <p className="mt-2 text-sm text-slate-700">{item.extra.message as string}</p>
                  )}
                  <div className="mt-1 text-xs text-slate-500">
                    {item.extra?.created_time
                      ? new Date(item.extra.created_time as string).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const rewardCoinOptions = useMemo(() => {
    const symbols = new Set<string>();
    coins.forEach((coin) => symbols.add(coin.symbol));
    if (selectedPage?.reward_coin_symbol) {
      symbols.add(selectedPage.reward_coin_symbol);
    }
    symbols.add('FCN');
    return Array.from(symbols).sort();
  }, [coins, selectedPage?.reward_coin_symbol]);

  const handleRewardCoinChange = (coinSymbol: string) => {
    if (!selectedPage) {
      return;
    }

    updateRewardCoin(selectedPage.id, coinSymbol).catch((error) => {
      console.error('[SocialInsightsSection] updateRewardCoin', error);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 text-xl font-semibold">Social Insights</h2>
          <p className="text-slate-500">
            Monitor Facebook Page performance and engagement in one place.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!activePageId || isSyncing}
          onClick={() => handleSync(activePageId)}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          {isSyncing ? 'Syncing…' : 'Sync Now'}
        </Button>
      </div>

      <Card className="p-4 border-purple-100 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-slate-600 mb-2">Connected Pages</p>
            {isPagesLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            ) : pages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Connect a Facebook Page to begin pulling engagement data.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pages.map((page: ConnectedFacebookPage) => (
                  <Button
                    key={page.id}
                    variant={page.id === activePageId ? 'default' : 'outline'}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    size="sm"
                    onClick={() => handleSelectPage(page.id)}
                  >
                    {page.name ?? page.page_id}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {selectedPage && (
            <div className="text-sm text-right space-y-1">
              <p className="text-slate-500">Last Synced</p>
              <p className="text-slate-900">
                {selectedPage.last_synced_at
                  ? new Date(selectedPage.last_synced_at).toLocaleString()
                  : '—'}
              </p>
            </div>
          )}
        </div>
        {selectedPage && (
          <div className="grid gap-3 md:grid-cols-2 md:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Reward Coin</p>
              {isCoinsLoading ? (
                <Skeleton className="h-10 w-full md:w-56" />
              ) : rewardCoinOptions.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Create a coin in the My Coin section to enable rewards for this page.
                </p>
              ) : (
                <Select
                  value={selectedPage.reward_coin_symbol ?? undefined}
                  onValueChange={handleRewardCoinChange}
                  disabled={isUpdatingRewardCoin}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Select coin" />
                  </SelectTrigger>
                  <SelectContent>
                    {rewardCoinOptions.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-slate-500">
                Choose which of your creator coins funds engagement rewards for this page.
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Interaction Type</p>
          <Select value={filterType} onValueChange={(value: string) => setFilterType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="reaction">Likes / Reactions</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="share">Shares</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Fan Name</p>
          <Input
            placeholder="Search by fan name"
            value={filterSearch}
            onChange={(event: InputChangeEvent) => setFilterSearch(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-slate-500">Post Date</p>
          <Select value={filterDate} onValueChange={(value: string) => setFilterDate(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPostsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-4 border-purple-100">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-32 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 border-dashed border-purple-200 text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-purple-400 mb-4" />
          <h3 className="text-slate-900 font-semibold mb-2">No posts synced yet</h3>
          <p className="text-slate-500 mb-4">
            Sync your Facebook Page to begin tracking post engagement.
          </p>
          <Button className="bg-purple-600 text-white hover:bg-purple-700" disabled={!activePageId || isSyncing} onClick={() => handleSync(activePageId)}>
            {isSyncing ? 'Syncing…' : 'Sync Now'}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredPosts.map((post: SocialPost) => {
            const latestMetric = post.metrics?.[0];
            const engagedUsers = normalizeEngagedUsers(post);
            const stats = [
              { label: 'Likes', value: latestMetric?.like_count ?? 0 },
              { label: 'Comments', value: latestMetric?.comment_count ?? 0 },
              { label: 'Shares', value: latestMetric?.share_count ?? 0 },
              { label: 'Reach', value: latestMetric?.reach_count ?? 0 },
              { label: 'Impressions', value: latestMetric?.impression_count ?? 0 },
              { label: 'Clicks', value: latestMetric?.click_count ?? 0 },
            ].filter((stat) => stat.value !== null && stat.value !== undefined);

            const message = post.message?.trim() ? post.message : 'No caption available.';

            return (
              <Card key={post.id} className="p-3 border-purple-100 bg-white">
                <div className="flex gap-3">
                  <div className="w-20 flex-shrink-0">
                    {post.full_picture_url ? (
                      <div className="overflow-hidden rounded-lg border border-purple-50 bg-slate-50">
                        <img
                          src={post.full_picture_url}
                          alt="Post preview"
                          className="w-20 h-20 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg border border-dashed border-purple-200 bg-purple-50/40 flex items-center justify-center text-[10px] text-purple-400 text-center px-1">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-600 border-purple-200 uppercase text-sm">
                          {post.status_type ?? post.object_type ?? 'Post'}
                        </Badge>
                        {engagedUsers.length > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm">
                            {engagedUsers.length} engaged
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {post.published_at ? new Date(post.published_at).toLocaleString() : '—'}
                      </span>
                    </div>

                    {/* <p className="text-slate-800 text-sm leading-relaxed line-clamp-3 truncate h-12 overflow-hidden">
                      {message}
                    </p> */}

                    {stats.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {stats.map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-md border border-purple-100 bg-purple-50/40 px-3 py-1"
                          >
                            <p className="text-[10px] text-purple-600 uppercase tracking-wide">
                              {stat.label}
                            </p>
                            <p className="text-slate-900 font-semibold text-sm">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Metrics not available yet.</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {post.permalink_url && (
                        <Button variant="link" size="sm" asChild>
                          <a href={post.permalink_url} target="_blank" rel="noopener noreferrer">
                            View on Facebook
                          </a>
                        </Button>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Synced {post.synced_at ? new Date(post.synced_at).toLocaleString() : '—'}
                      </p>
                      {engagedUsers.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => openEngagementModal(post)}
                        >
                          View Engagement
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {renderEngagementModal()}
    </div>
  );
}

