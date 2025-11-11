import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw, TrendingUp } from 'lucide-react';
import { useFacebookPages, ConnectedFacebookPage } from '../hooks/useFacebookPages';
import { useFacebookPagePosts, SocialPost } from '../hooks/useFacebookPagePosts';

export function SocialInsightsSection() {
  const {
    pages,
    isLoading: isPagesLoading,
    loadPages,
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

      <Card className="p-4 border-purple-100">
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
      </Card>

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
          {posts.map((post: SocialPost) => {
            const latestMetric = post.metrics?.[0];
            const metadata = (post.metadata as Record<string, unknown> | undefined) ?? undefined;
            const engagedUsers = Array.isArray((metadata as any)?.engaged_users)
              ? ((metadata as any).engaged_users as Array<{ user_id: string; name?: string }>)
              : [];
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

                    {/* <p className="text-slate-800 text-sm leading-relaxed line-clamp-3 truncate h-10 overflow-hidden">
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
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

