import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Instagram, Music2, RefreshCcw, TrendingUp, Users, Youtube } from 'lucide-react';
import { useFacebookPages, ConnectedFacebookPage } from '../hooks/useFacebookPages';
import { useFacebookPagePosts, SocialPost } from '../hooks/useFacebookPagePosts';
import { useInstagramPosts } from '../hooks/useInstagramPosts';
import { useTikTokPosts } from '../hooks/useTikTokPosts';
import { useYouTubePosts } from '../hooks/useYouTubePosts';
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

  const {
    posts: instagramPosts,
    accounts: instagramAccounts,
    account: instagramAccount,
    selectedAccountId: selectedInstagramAccountId,
    isLoading: isInstagramLoading,
    isSyncing: isInstagramSyncing,
    isUpdatingRewardCoin: isUpdatingInstagramRewardCoin,
    load: loadInstagramPosts,
    sync: syncInstagram,
    updateRewardCoin: updateInstagramRewardCoin,
    selectAccount: selectInstagramAccount,
  } = useInstagramPosts();

  const {
    posts: tiktokPosts,
    accounts: tiktokAccounts,
    account: tiktokAccount,
    selectedAccountId: selectedTikTokAccountId,
    isLoading: isTikTokLoading,
    isSyncing: isTikTokSyncing,
    isUpdatingRewardCoin: isUpdatingTikTokRewardCoin,
    load: loadTikTokPosts,
    sync: syncTikTok,
    updateRewardCoin: updateTikTokRewardCoin,
    selectAccount: selectTikTokAccount,
  } = useTikTokPosts();

  const {
    posts: youtubePosts,
    accounts: youtubeAccounts,
    account: youtubeAccount,
    selectedAccountId: selectedYouTubeAccountId,
    isLoading: isYouTubeLoading,
    isSyncing: isYouTubeSyncing,
    isUpdatingRewardCoin: isUpdatingYouTubeRewardCoin,
    load: loadYouTubePosts,
    sync: syncYouTube,
    updateRewardCoin: updateYouTubeRewardCoin,
    selectAccount: selectYouTubeAccount,
  } = useYouTubePosts();

  const [activePageId, setActivePageId] = useState(null as string | null);
  const [engagementModalPost, setEngagementModalPost] = useState<SocialPost | null>(null);
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [activeSocialTab, setActiveSocialTab] = useState<'facebook' | 'instagram' | 'tiktok' | 'youtube'>(
    'facebook',
  );

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

  useEffect(() => {
    loadInstagramPosts().catch((error: unknown) =>
      console.error('[SocialInsightsSection] loadInstagramPosts', error),
    );
  }, [loadInstagramPosts]);

  useEffect(() => {
    loadTikTokPosts().catch((error: unknown) =>
      console.error('[SocialInsightsSection] loadTikTokPosts', error),
    );
  }, [loadTikTokPosts]);

  useEffect(() => {
    loadYouTubePosts().catch((error: unknown) =>
      console.error('[SocialInsightsSection] loadYouTubePosts', error),
    );
  }, [loadYouTubePosts]);

  useEffect(() => {
    if (activeSocialTab === 'facebook') {
      if (pages.length === 0) {
        if (instagramAccounts.length > 0) {
          setActiveSocialTab('instagram');
        } else if (tiktokAccounts.length > 0) {
          setActiveSocialTab('tiktok');
        } else if (youtubeAccounts.length > 0) {
          setActiveSocialTab('youtube');
        }
      }
    } else if (activeSocialTab === 'instagram') {
      if (instagramAccounts.length === 0) {
        if (pages.length > 0) {
          setActiveSocialTab('facebook');
        } else if (tiktokAccounts.length > 0) {
          setActiveSocialTab('tiktok');
        } else if (youtubeAccounts.length > 0) {
          setActiveSocialTab('youtube');
        }
      }
    } else if (activeSocialTab === 'tiktok') {
      if (tiktokAccounts.length === 0) {
        if (pages.length > 0) {
          setActiveSocialTab('facebook');
        } else if (instagramAccounts.length > 0) {
          setActiveSocialTab('instagram');
        } else if (youtubeAccounts.length > 0) {
          setActiveSocialTab('youtube');
        }
      }
    } else if (activeSocialTab === 'youtube') {
      if (youtubeAccounts.length === 0) {
        if (pages.length > 0) {
          setActiveSocialTab('facebook');
        } else if (instagramAccounts.length > 0) {
          setActiveSocialTab('instagram');
        } else if (tiktokAccounts.length > 0) {
          setActiveSocialTab('tiktok');
        }
      }
    }
  }, [activeSocialTab, pages.length, instagramAccounts.length, tiktokAccounts.length, youtubeAccounts.length]);

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

    syncPage(id).catch((error: unknown) => console.error('[SocialInsightsSection] syncPage', error));
  };

  const applyFilters = useCallback(
    (source: SocialPost[]) => {
      const filterTypeUpper = filterType.toUpperCase();

      return source.filter((post) => {
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
    },
    [filterType, filterSearch, filterDate],
  );

  const filteredPosts = useMemo(() => applyFilters(posts), [applyFilters, posts]);
  const instagramFilteredPosts = useMemo(
    () => applyFilters(instagramPosts),
    [applyFilters, instagramPosts],
  );
  const tiktokFilteredPosts = useMemo(
    () => applyFilters(tiktokPosts),
    [applyFilters, tiktokPosts],
  );
  const youtubeFilteredPosts = useMemo(
    () => applyFilters(youtubePosts),
    [applyFilters, youtubePosts],
  );

  const effectiveInstagramAccountId = useMemo(() => {
    return selectedInstagramAccountId ?? instagramAccounts[0]?.id ?? null;
  }, [selectedInstagramAccountId, instagramAccounts]);

  const selectedInstagramAccountMeta = useMemo(() => {
    if (effectiveInstagramAccountId) {
      const match = instagramAccounts.find((item) => item.id === effectiveInstagramAccountId);
      if (match) {
        return match;
      }
    }
    return instagramAccount;
  }, [effectiveInstagramAccountId, instagramAccounts, instagramAccount]);

  const effectiveTikTokAccountId = useMemo(() => {
    return selectedTikTokAccountId ?? tiktokAccounts[0]?.id ?? null;
  }, [selectedTikTokAccountId, tiktokAccounts]);

  const selectedTikTokAccountMeta = useMemo(() => {
    if (effectiveTikTokAccountId) {
      const match = tiktokAccounts.find((item) => item.id === effectiveTikTokAccountId);
      if (match) {
        return match;
      }
    }
    return tiktokAccount;
  }, [effectiveTikTokAccountId, tiktokAccounts, tiktokAccount]);

  const effectiveYouTubeAccountId = useMemo(() => {
    return selectedYouTubeAccountId ?? youtubeAccounts[0]?.id ?? null;
  }, [selectedYouTubeAccountId, youtubeAccounts]);

  const selectedYouTubeAccountMeta = useMemo(() => {
    if (effectiveYouTubeAccountId) {
      const match = youtubeAccounts.find((item) => item.id === effectiveYouTubeAccountId);
      if (match) {
        return match;
      }
    }
    return youtubeAccount;
  }, [effectiveYouTubeAccountId, youtubeAccounts, youtubeAccount]);

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

    const providerKey = (engagementModalPost.provider ?? '').toLowerCase();
    const providerLabel =
      providerKey === 'instagram' ? 'Instagram' : providerKey === 'tiktok' ? 'TikTok' : 'Facebook';

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
                  View post on {providerLabel}
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
                  {((item.extra?.message as string) ?? (item.extra?.text as string)) && (
                    <p className="mt-2 text-sm text-slate-700">
                      {(item.extra?.message as string) ?? (item.extra?.text as string)}
                    </p>
                  )}
                  <div className="mt-1 text-xs text-slate-500">
                    {(item.extra?.created_time as string) || (item.extra?.timestamp as string)
                      ? new Date(
                          (item.extra?.created_time as string) ??
                            (item.extra?.timestamp as string),
                        ).toLocaleString()
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

  const instagramRewardCoinOptions = useMemo(() => {
    const symbols = new Set<string>();
    coins.forEach((coin) => symbols.add(coin.symbol));
    if (selectedInstagramAccountMeta?.page?.reward_coin_symbol) {
      symbols.add(selectedInstagramAccountMeta.page.reward_coin_symbol);
    }
    symbols.add('FCN');
    return Array.from(symbols).sort();
  }, [coins, selectedInstagramAccountMeta?.page?.reward_coin_symbol]);

  const tiktokRewardCoinOptions = useMemo(() => {
    const symbols = new Set<string>();
    coins.forEach((coin) => symbols.add(coin.symbol));
    if (selectedTikTokAccountMeta?.page?.reward_coin_symbol) {
      symbols.add(selectedTikTokAccountMeta.page.reward_coin_symbol);
    }
    symbols.add('FCN');
    return Array.from(symbols).sort();
  }, [coins, selectedTikTokAccountMeta?.page?.reward_coin_symbol]);

  const youtubeRewardCoinOptions = useMemo(() => {
    const symbols = new Set<string>();
    coins.forEach((coin) => symbols.add(coin.symbol));
    if (selectedYouTubeAccountMeta?.page?.reward_coin_symbol) {
      symbols.add(selectedYouTubeAccountMeta.page.reward_coin_symbol);
    }
    symbols.add('FCN');
    return Array.from(symbols).sort();
  }, [coins, selectedYouTubeAccountMeta?.page?.reward_coin_symbol]);

  const handleRewardCoinChange = (coinSymbol: string) => {
    if (!selectedPage) {
      return;
    }

    updateRewardCoin(selectedPage.id, coinSymbol).catch((error) => {
      console.error('[SocialInsightsSection] updateRewardCoin', error);
    });
  };

  const handleInstagramRewardCoinChange = (coinSymbol: string) => {
    const pageId = selectedInstagramAccountMeta?.page?.id;
    if (!pageId) {
      return;
    }

    updateInstagramRewardCoin(pageId, coinSymbol).catch((error: unknown) => {
      console.error('[SocialInsightsSection] updateInstagramRewardCoin', error);
    });
  };

  const handleTikTokRewardCoinChange = (coinSymbol: string) => {
    const pageId = selectedTikTokAccountMeta?.page?.id;
    if (!pageId) {
      return;
    }

    updateTikTokRewardCoin(pageId, coinSymbol).catch((error: unknown) => {
      console.error('[SocialInsightsSection] updateTikTokRewardCoin', error);
    });
  };

  const handleSelectInstagramAccount = useCallback(
    (value: string | null) => {
      const accountId = value ?? null;
      selectInstagramAccount(accountId).catch((error: unknown) => {
        console.error('[SocialInsightsSection] selectInstagramAccount', error);
      });
    },
    [selectInstagramAccount],
  );

  const handleSelectTikTokAccount = useCallback(
    (value: string | null) => {
      const accountId = value ?? null;
      selectTikTokAccount(accountId).catch((error: unknown) => {
        console.error('[SocialInsightsSection] selectTikTokAccount', error);
      });
    },
    [selectTikTokAccount],
  );

  const handleYouTubeRewardCoinChange = (coinSymbol: string) => {
    const pageId = selectedYouTubeAccountMeta?.page?.id;
    if (!pageId) {
      return;
    }

    updateYouTubeRewardCoin(pageId, coinSymbol).catch((error: unknown) => {
      console.error('[SocialInsightsSection] updateYouTubeRewardCoin', error);
    });
  };

  const handleSelectYouTubeAccount = useCallback(
    (value: string | null) => {
      const accountId = value ?? null;
      selectYouTubeAccount(accountId).catch((error: unknown) => {
        console.error('[SocialInsightsSection] selectYouTubeAccount', error);
      });
    },
    [selectYouTubeAccount],
  );

  const renderPostCard = (post: SocialPost) => {
    const provider = (post.provider ?? '').toLowerCase();
    const isInstagram = provider === 'instagram';
    const isTikTok = provider === 'tiktok';
    const isYouTube = provider === 'youtube';
    const latestMetric = post.metrics?.[0];
    const engagedUsers = normalizeEngagedUsers(post);

    const stats = isInstagram
      ? [
          { label: 'Likes', value: latestMetric?.like_count ?? 0 },
          { label: 'Comments', value: latestMetric?.comment_count ?? 0 },
          { label: 'Reach', value: latestMetric?.reach_count ?? 0 },
          { label: 'Impressions', value: latestMetric?.impression_count ?? 0 },
          { label: 'Engagement', value: latestMetric?.click_count ?? 0 },
          { label: 'Views', value: latestMetric?.view_count ?? 0 },
        ]
      : isTikTok
      ? [
          { label: 'Likes', value: latestMetric?.like_count ?? 0 },
          { label: 'Comments', value: latestMetric?.comment_count ?? 0 },
          { label: 'Shares', value: latestMetric?.share_count ?? 0 },
          { label: 'Reach', value: latestMetric?.reach_count ?? 0 },
          { label: 'Impressions', value: latestMetric?.impression_count ?? 0 },
          { label: 'Views', value: latestMetric?.view_count ?? 0 },
        ]
      : isYouTube
      ? [
          { label: 'Likes', value: latestMetric?.like_count ?? 0 },
          { label: 'Comments', value: latestMetric?.comment_count ?? 0 },
          { label: 'Views', value: latestMetric?.view_count ?? 0 },
          { label: 'Reach', value: latestMetric?.reach_count ?? 0 },
          { label: 'Impressions', value: latestMetric?.impression_count ?? 0 },
        ]
      : [
          { label: 'Likes', value: latestMetric?.like_count ?? 0 },
          { label: 'Comments', value: latestMetric?.comment_count ?? 0 },
          { label: 'Shares', value: latestMetric?.share_count ?? 0 },
          { label: 'Reach', value: latestMetric?.reach_count ?? 0 },
          { label: 'Impressions', value: latestMetric?.impression_count ?? 0 },
          { label: 'Clicks', value: latestMetric?.click_count ?? 0 },
        ];

    const statsFiltered = stats.filter(
      (stat) => stat.value !== null && stat.value !== undefined,
    );

    const cardBorderClass = isInstagram
      ? 'border-orange-100'
      : isTikTok
      ? 'border-sky-100'
      : isYouTube
      ? 'border-red-100'
      : 'border-purple-100';
    const badgeClass = isInstagram
      ? 'bg-orange-100 text-orange-600 border-orange-200 uppercase text-sm'
      : isTikTok
      ? 'bg-sky-100 text-sky-600 border-sky-200 uppercase text-sm'
      : isYouTube
      ? 'bg-red-100 text-red-600 border-red-200 uppercase text-sm'
      : 'bg-purple-100 text-purple-600 border-purple-200 uppercase text-sm';
    const engagedBadgeClass = isInstagram
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-sm'
      : isTikTok
      ? 'bg-cyan-100 text-cyan-700 border-cyan-200 text-sm'
      : isYouTube
      ? 'bg-red-100 text-red-600 border-red-200 text-sm'
      : 'bg-amber-100 text-amber-700 border-amber-200 text-sm';
    const imageBorderClass = isInstagram
      ? 'border-orange-50'
      : isTikTok
      ? 'border-sky-50'
      : isYouTube
      ? 'border-red-50'
      : 'border-purple-50';
    const placeholderClass = isInstagram
      ? 'border-orange-200 bg-orange-50/40 text-orange-400'
      : isTikTok
      ? 'border-sky-200 bg-sky-50/40 text-sky-500'
      : isYouTube
      ? 'border-red-200 bg-red-50/40 text-red-500'
      : 'border-purple-200 bg-purple-50/40 text-purple-400';
    const viewLabel = isInstagram
      ? 'View on Instagram'
      : isTikTok
      ? 'View on TikTok'
      : isYouTube
      ? 'View on YouTube'
      : 'View on Facebook';

    return (
      <Card key={post.id} className={`p-3 bg-white border ${cardBorderClass}`}>
        <div className="flex gap-3">
          <div className="w-20 flex-shrink-0">
            {post.full_picture_url ? (
              <div className={`overflow-hidden rounded-lg border ${imageBorderClass} bg-slate-50`}>
                <img
                  src={post.full_picture_url}
                  alt="Post preview"
                  className="w-20 h-20 object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className={`h-20 w-20 rounded-lg border border-dashed ${placeholderClass} flex items-center justify-center text-[10px] text-center px-1`}
              >
                No image
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Badge className={badgeClass}>{post.status_type ?? post.object_type ?? 'Post'}</Badge>
                {engagedUsers.length > 0 && (
                  <Badge className={engagedBadgeClass}>{engagedUsers.length} engaged</Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                {post.published_at ? new Date(post.published_at).toLocaleString() : '—'}
              </span>
            </div>

            {statsFiltered.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {statsFiltered.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-md border ${cardBorderClass} bg-slate-50 px-3 py-1`}
                  >
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
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
                    {viewLabel}
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 text-xl font-semibold">Social Insights</h2>
        <p className="text-slate-500">
          Monitor post performance and fan engagement across Facebook, Instagram, and TikTok.
        </p>
      </div>

      <Tabs
        value={activeSocialTab}
        onValueChange={(value: string) =>
          setActiveSocialTab(value as 'facebook' | 'instagram' | 'tiktok')
        }
        className="space-y-6"
      >
        <TabsList className="inline-flex w-full flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1 md:w-auto">
          <TabsTrigger
            value="facebook"
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            Facebook
          </TabsTrigger>
          <TabsTrigger
            value="instagram"
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            Instagram
          </TabsTrigger>
          <TabsTrigger
            value="tiktok"
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-sky-500 data-[state=active]:text-white"
          >
            TikTok
          </TabsTrigger>
          <TabsTrigger
            value="youtube"
            className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white"
          >
            YouTube
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facebook" className="space-y-6 focus-visible:outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-slate-900 text-lg font-semibold">Facebook Page Insights</h3>
              <p className="text-sm text-slate-500">
                Track reward pools, fan engagement, and post performance for your connected Pages.
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

          <Card className="p-4 border-purple-100 space-y-4 bg-white">
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
                    Connect a Facebook Page from the Profile screen to begin pulling engagement data.
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
                      Create a coin in the My Coin tab to enable rewards for this page.
                    </p>
                  ) : (
                    <Select
                      value={selectedPage.reward_coin_symbol ?? undefined}
                      onValueChange={handleRewardCoinChange}
                      disabled={isUpdatingRewardCoin}
                    >
                      <SelectTrigger className="w-full md:w-56 bg-white text-slate-900 border border-slate-200 hover:bg-white/90">
                        <SelectValue placeholder="Select coin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-black hover:bg-gray-100">
                        {rewardCoinOptions.map((symbol) => (
                          <SelectItem key={symbol} value={symbol} className="bg-white text-black">
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
                <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="like">Likes / Reactions</SelectItem>
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
                <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
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
            <Card className="p-8 border-dashed border-purple-200 bg-white text-center">
              <TrendingUp className="w-10 h-10 mx-auto text-purple-400 mb-4" />
              <h3 className="text-slate-900 font-semibold mb-2">No posts synced yet</h3>
              <p className="text-slate-500 mb-4">
                Sync your Facebook Page to begin tracking post engagement.
              </p>
              <Button
                className="bg-purple-600 text-white hover:bg-purple-700"
                disabled={!activePageId || isSyncing}
                onClick={() => handleSync(activePageId)}
              >
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredPosts.map((post: SocialPost) => renderPostCard(post))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instagram" className="space-y-6 focus-visible:outline-none">
          {instagramAccounts.length === 0 && !isInstagramLoading ? (
            <Card className="p-8 border-dashed border-orange-200 bg-white text-center">
              <Instagram className="w-10 h-10 mx-auto text-orange-400 mb-4" />
              <h3 className="text-slate-900 font-semibold mb-2">Connect Instagram</h3>
              <p className="text-slate-500 mb-4">
                Link your Instagram professional account from the Profile tab to start tracking
                engagement automatically.
              </p>
              <p className="text-xs text-slate-500">
                Once connected, you can sync posts, view metrics, and reward fans for their support.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-orange-500" />
                  <div>
                    <h3 className="text-slate-900 text-lg font-semibold">Instagram Professional</h3>
                    <p className="text-sm text-slate-500">
                      {selectedInstagramAccountMeta?.instagram_username
                        ? `${
                            selectedInstagramAccountMeta.instagram_username.startsWith('@')
                              ? ''
                              : '@'
                          }${selectedInstagramAccountMeta.instagram_username}`
                        : selectedInstagramAccountMeta?.instagram_account_id ?? 'Connected account'}
                    </p>
                    {selectedInstagramAccountMeta?.page?.name && (
                      <p className="text-xs text-slate-400">
                        Page:{' '}
                        <span className="text-slate-600">{selectedInstagramAccountMeta.page.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                  <div className="flex flex-wrap gap-2">
                    {instagramAccounts.map((entry) => {
                      const label = entry.instagram_username
                        ? `${entry.instagram_username.startsWith('@') ? '' : '@'}${entry.instagram_username}`
                        : entry.instagram_account_id;
                      const isActive = entry.id === effectiveInstagramAccountId;

                      return (
                        <Button
                          key={entry.id}
                          variant={isActive ? 'default' : 'outline'}
                          className={
                            isActive
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                          }
                          size="sm"
                          disabled={isInstagramLoading || isInstagramSyncing}
                          onClick={() => handleSelectInstagramAccount(entry.id)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    disabled={isInstagramSyncing || !effectiveInstagramAccountId}
                    onClick={() => syncInstagram(undefined, effectiveInstagramAccountId)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {isInstagramSyncing ? 'Syncing…' : 'Sync Instagram'}
                  </Button>
                </div>
              </div>

              {selectedInstagramAccountMeta?.page?.id && (
                <Card className="border-orange-100 bg-white p-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Reward Coin</p>
                    {isCoinsLoading ? (
                      <Skeleton className="h-10 w-full md:w-56" />
                    ) : instagramRewardCoinOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Create a coin in the My Coin tab to enable rewards for this Instagram account.
                      </p>
                    ) : (
                      <Select
                        value={selectedInstagramAccountMeta.page?.reward_coin_symbol ?? undefined}
                        onValueChange={handleInstagramRewardCoinChange}
                        disabled={isUpdatingInstagramRewardCoin}
                      >
                        <SelectTrigger className="w-full md:w-56 bg-white text-slate-900 border border-slate-200 hover:bg-white/90">
                          <SelectValue placeholder="Select coin" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black hover:bg-gray-100">
                          {instagramRewardCoinOptions.map((symbol) => (
                            <SelectItem key={symbol} value={symbol} className="bg-white text-black">
                              {symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-slate-500">
                      Choose which coin funds fan rewards earned on Instagram engagement.
                    </p>
                  </div>
                </Card>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Interaction Type</p>
                  <Select value={filterType} onValueChange={(value: string) => setFilterType(value)}>
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="like">Likes</SelectItem>
                      <SelectItem value="comment">Comments</SelectItem>
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
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
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

              {isInstagramLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="p-4 border-orange-100">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : instagramPosts.length === 0 ? (
                <Card className="p-8 border-dashed border-orange-200 text-center bg-white">
                  <Instagram className="w-10 h-10 mx-auto text-orange-400 mb-4" />
                  <h3 className="text-slate-900 font-semibold mb-2">No Instagram posts synced yet</h3>
                  <p className="text-slate-500 mb-4">
                    Sync your Instagram account to start tracking engagement automatically.
                  </p>
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    disabled={isInstagramSyncing}
                    onClick={() => syncInstagram(undefined, effectiveInstagramAccountId)}
                  >
                    {isInstagramSyncing ? 'Syncing…' : 'Sync Instagram'}
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {instagramFilteredPosts.map((post: SocialPost) => renderPostCard(post))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="tiktok" className="space-y-6 focus-visible:outline-none">
          {tiktokAccounts.length === 0 && !isTikTokLoading ? (
            <Card className="p-8 border-dashed border-sky-200 bg-white text-center">
              <Music2 className="w-10 h-10 mx-auto text-sky-400 mb-4" />
              <h3 className="text-slate-900 font-semibold mb-2">Connect TikTok</h3>
              <p className="text-slate-500 mb-4">
                Link your TikTok creator account from the Profile tab to sync videos and metrics.
              </p>
              <p className="text-xs text-slate-500">
                Fans can also connect their TikTok profile so we can match their engagement on your
                content.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Music2 className="h-5 w-5 text-sky-500" />
                  <div>
                    <h3 className="text-slate-900 text-lg font-semibold">TikTok Creator</h3>
                    <p className="text-sm text-slate-500">
                      {selectedTikTokAccountMeta?.tiktok_username
                        ? `${
                            selectedTikTokAccountMeta.tiktok_username.startsWith('@')
                              ? ''
                              : '@'
                          }${selectedTikTokAccountMeta.tiktok_username}`
                        : selectedTikTokAccountMeta?.tiktok_open_id ?? 'Connected account'}
                    </p>
                    {selectedTikTokAccountMeta?.page?.name && (
                      <p className="text-xs text-slate-400">
                        Display:{' '}
                        <span className="text-slate-600">{selectedTikTokAccountMeta.page.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                  <div className="flex flex-wrap gap-2">
                    {tiktokAccounts.map((entry) => {
                      const label = entry.tiktok_username
                        ? `${entry.tiktok_username.startsWith('@') ? '' : '@'}${entry.tiktok_username}`
                        : entry.tiktok_open_id;
                      const isActive = entry.id === effectiveTikTokAccountId;

                      return (
                        <Button
                          key={entry.id}
                          variant={isActive ? 'default' : 'outline'}
                          className={
                            isActive
                              ? 'bg-sky-500 text-white hover:bg-sky-600'
                              : 'border-sky-200 text-sky-600 hover:bg-sky-50'
                          }
                          size="sm"
                          disabled={isTikTokLoading || isTikTokSyncing}
                          onClick={() => handleSelectTikTokAccount(entry.id)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="border-sky-200 text-sky-600 hover:bg-sky-50"
                    disabled={isTikTokSyncing || !effectiveTikTokAccountId}
                    onClick={() => syncTikTok(undefined, effectiveTikTokAccountId)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {isTikTokSyncing ? 'Syncing…' : 'Sync TikTok'}
                  </Button>
                </div>
              </div>

              {selectedTikTokAccountMeta?.page?.id && (
                <Card className="border-sky-100 bg-white p-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Reward Coin</p>
                    {isCoinsLoading ? (
                      <Skeleton className="h-10 w-full md:w-56" />
                    ) : tiktokRewardCoinOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Create a coin in the My Coin tab to enable rewards for this TikTok account.
                      </p>
                    ) : (
                      <Select
                        value={selectedTikTokAccountMeta.page?.reward_coin_symbol ?? undefined}
                        onValueChange={handleTikTokRewardCoinChange}
                        disabled={isUpdatingTikTokRewardCoin}
                      >
                        <SelectTrigger className="w-full md:w-56 bg-white text-slate-900 border border-slate-200 hover:bg-white/90">
                          <SelectValue placeholder="Select coin" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black hover:bg-gray-100">
                          {tiktokRewardCoinOptions.map((symbol) => (
                            <SelectItem key={symbol} value={symbol} className="bg-white text-black">
                              {symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-slate-500">
                      Choose which coin funds fan rewards earned on TikTok engagement.
                    </p>
                  </div>
                </Card>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Interaction Type</p>
                  <Select value={filterType} onValueChange={(value: string) => setFilterType(value)}>
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="like">Likes</SelectItem>
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
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
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

              {isTikTokLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="p-4 border-sky-100">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : tiktokPosts.length === 0 ? (
                <Card className="p-8 border-dashed border-sky-200 text-center bg-white">
                  <Music2 className="w-10 h-10 mx-auto text-sky-400 mb-4" />
                  <h3 className="text-slate-900 font-semibold mb-2">No TikTok videos synced yet</h3>
                  <p className="text-slate-500 mb-4">
                    Sync your TikTok account to start tracking engagement automatically.
                  </p>
                  <Button
                    className="bg-sky-500 text-white hover:bg-sky-600"
                    disabled={isTikTokSyncing}
                    onClick={() => syncTikTok(undefined, effectiveTikTokAccountId)}
                  >
                    {isTikTokSyncing ? 'Syncing…' : 'Sync TikTok'}
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {tiktokFilteredPosts.map((post: SocialPost) => renderPostCard(post))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="youtube" className="space-y-6 focus-visible:outline-none">
          {youtubeAccounts.length === 0 && !isYouTubeLoading ? (
            <Card className="p-8 border-dashed border-red-200 bg-white text-center">
              <Youtube className="w-10 h-10 mx-auto text-red-400 mb-4" />
              <h3 className="text-slate-900 font-semibold mb-2">Connect YouTube</h3>
              <p className="text-slate-500 mb-4">
                Link your YouTube channel from the Profile tab to sync videos, comments, and engagement.
              </p>
              <p className="text-xs text-slate-500">
                Once connected, you can sync videos, view engagement metrics, and reward fans automatically.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {selectedYouTubeAccountMeta?.page?.picture_url ? (
                    <img
                      src={selectedYouTubeAccountMeta.page.picture_url}
                      alt={selectedYouTubeAccountMeta.youtube_channel_title ?? 'YouTube channel'}
                      className="h-10 w-10 rounded-full object-cover border-2 border-red-200"
                    />
                  ) : (
                    <Youtube className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-slate-900 text-lg font-semibold">YouTube Channel</h3>
                    <p className="text-sm text-slate-500">
                      {selectedYouTubeAccountMeta?.youtube_channel_title ?? selectedYouTubeAccountMeta?.youtube_channel_id ?? 'Connected channel'}
                    </p>
                    {selectedYouTubeAccountMeta?.page?.name && (
                      <p className="text-xs text-slate-400">
                        Display:{' '}
                        <span className="text-slate-600">{selectedYouTubeAccountMeta.page.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                  <div className="flex flex-wrap gap-2">
                    {youtubeAccounts.map((entry) => {
                      const label =
                        entry.youtube_channel_title ??
                        entry.youtube_channel_id ??
                        entry.social_account_id;
                      const isActive = entry.id === effectiveYouTubeAccountId;

                      return (
                        <Button
                          key={entry.id}
                          variant={isActive ? 'default' : 'outline'}
                          className={
                            isActive
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          }
                          size="sm"
                          disabled={isYouTubeLoading || isYouTubeSyncing}
                          onClick={() => handleSelectYouTubeAccount(entry.id)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={isYouTubeSyncing || !effectiveYouTubeAccountId}
                    onClick={() => syncYouTube(undefined, effectiveYouTubeAccountId)}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    {isYouTubeSyncing ? 'Syncing…' : 'Sync YouTube'}
                  </Button>
                </div>
              </div>

              {selectedYouTubeAccountMeta?.page?.id && (
                <Card className="border-red-100 bg-white p-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Reward Coin</p>
                    {isCoinsLoading ? (
                      <Skeleton className="h-10 w-full md:w-56" />
                    ) : youtubeRewardCoinOptions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Create a coin in the My Coin tab to enable rewards for this YouTube channel.
                      </p>
                    ) : (
                      <Select
                        value={selectedYouTubeAccountMeta.page?.reward_coin_symbol ?? undefined}
                        onValueChange={handleYouTubeRewardCoinChange}
                        disabled={isUpdatingYouTubeRewardCoin}
                      >
                        <SelectTrigger className="w-full md:w-56 bg-white text-slate-900 border border-slate-200 hover:bg-white/90">
                          <SelectValue placeholder="Select coin" />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-black hover:bg-gray-100">
                          {youtubeRewardCoinOptions.map((symbol) => (
                            <SelectItem key={symbol} value={symbol} className="bg-white text-black">
                              {symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-slate-500">
                      Choose which coin funds fan rewards earned on YouTube engagement.
                    </p>
                  </div>
                </Card>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Interaction Type</p>
                  <Select value={filterType} onValueChange={(value: string) => setFilterType(value)}>
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="comment">Comments</SelectItem>
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
                    <SelectTrigger className="bg-white text-slate-900 border border-slate-200">
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

              {isYouTubeLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="p-4 border-red-100">
                      <div className="flex gap-4">
                        <Skeleton className="h-20 w-20 rounded-lg" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : youtubePosts.length === 0 ? (
                <Card className="p-8 border-dashed border-red-200 text-center bg-white">
                  <Youtube className="w-10 h-10 mx-auto text-red-400 mb-4" />
                  <h3 className="text-slate-900 font-semibold mb-2">No YouTube videos synced yet</h3>
                  <p className="text-slate-500 mb-4">
                    Sync your YouTube channel to start tracking engagement automatically.
                  </p>
                  <Button
                    className="bg-red-500 text-white hover:bg-red-600"
                    disabled={isYouTubeSyncing}
                    onClick={() => syncYouTube(undefined, effectiveYouTubeAccountId)}
                  >
                    {isYouTubeSyncing ? 'Syncing…' : 'Sync YouTube'}
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {youtubeFilteredPosts.map((post: SocialPost) => renderPostCard(post))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {renderEngagementModal()}
    </div>
  );
}

