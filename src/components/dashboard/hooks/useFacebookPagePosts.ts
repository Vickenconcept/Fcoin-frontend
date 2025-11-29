import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

export type SocialPostMetric = {
  id: string;
  social_post_id: string;
  captured_for: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  click_count: number;
  view_count: number;
  reach_count: number;
  impression_count: number;
};

export type SocialPost = {
  id: string;
  social_page_id: string;
  provider_post_id: string;
  provider: string;
  status_type: string | null;
  object_type: string | null;
  message: string | null;
  permalink_url: string | null;
  full_picture_url: string | null;
  published_at: string | null;
  synced_at: string | null;
  metrics?: SocialPostMetric[];
  metadata?: Record<string, unknown> | null;
};

export type PostsResponse = {
  data: SocialPost[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
  };
};

export function useFacebookPagePosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [meta, setMeta] = useState<PostsResponse['meta']>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const load = useCallback(
    async (pageId: string, page = 1) => {
      if (!pageId) return;

      setIsLoading(true);
      try {
        const response = await apiClient.request<PostsResponse>(`/v1/oauth/facebook/pages/${pageId}/posts?page=${page}`);

        if (!response.ok || !Array.isArray(response.data)) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to load posts.');
          return;
        }

        setPosts(response.data);
        setMeta(response.meta ?? {});
        setSelectedPageId(pageId);
      } catch (error) {
        console.error('[useFacebookPagePosts] load error', error);
        toast.error('Failed to load posts.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sync = useCallback(
    async (pageId: string) => {
      if (!pageId) return;

      setIsSyncing(true);
      try {
        // Sync always runs in background - return immediately
        const response = await apiClient.request(`/v1/oauth/facebook/pages/${pageId}/sync`, {
          method: 'POST',
        });

        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail ?? 'Unable to sync Facebook Page.');
          return;
        }

        toast.success(response.meta?.message ?? 'Facebook Page sync scheduled.');
        
        // Reload posts after a short delay to show updated data
        setTimeout(() => {
          load(pageId, 1);
        }, 2000);
      } catch (error) {
        console.error('[useFacebookPagePosts] sync error', error);
        toast.error('Failed to sync Facebook Page.');
      } finally {
        setIsSyncing(false);
      }
    },
    [load],
  );

  return {
    posts,
    meta,
    isLoading,
    isSyncing,
    selectedPageId,
    load,
    sync,
  };
}

