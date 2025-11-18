import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export type FeedPost = {
  id: string;
  content: string | null;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reward_enabled: boolean;
  reward_pool: number;
  is_liked: boolean;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    verified_creator: boolean;
  };
  media: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail_url: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  created_at: string;
  updated_at: string;
};

export type FeedComment = {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked: boolean;
  parent_id: string | null;
  replies: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    likes_count: number;
    is_liked: boolean;
    parent_id: string | null;
    created_at: string;
  }>;
  created_at: string;
};

type FeedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function useFeed(sortBy: 'newest' | 'popular' = 'newest') {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isLiking, setIsLiking] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  const loadFeed = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      console.log('Feed: Loading feed', { sortBy, page });
      const response = await apiClient.request<FeedPost[]>(
        `/v1/feed?sort=${sortBy}&per_page=20&page=${page}`,
        { method: 'GET' }
      );

      console.log('Feed: API Response', {
        ok: response.ok,
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.length,
        errors: response.errors,
        meta: response.meta,
      });

      if (response.ok && response.data) {
        if (page === 1) {
          setPosts(response.data);
        } else {
          setPosts((prev) => [...prev, ...response.data!]);
        }
        setMeta(response.meta as FeedMeta);
        console.log('Feed: Successfully loaded', { count: response.data.length });
      } else {
        console.error('Feed: API Error', {
          status: response.status,
          errors: response.errors,
          raw: response.raw,
        });
        toast.error(response.errors?.[0]?.detail || 'Failed to load feed');
      }
    } catch (error) {
      console.error('Feed: Exception loading feed', error);
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const createPost = useCallback(async (data: {
    content?: string;
    visibility?: string;
    media?: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnail_url?: string;
      metadata?: Record<string, unknown>;
    }>;
    reward_enabled?: boolean;
    reward_pool?: number;
  }) => {
    setIsCreating(true);
    try {
      const response = await apiClient.request<FeedPost>('/v1/feed/posts', {
        method: 'POST',
        body: data,
      });

      if (response.ok && response.data) {
        setPosts((prev) => [response.data!, ...prev]);
        toast.success('Post created successfully');
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to create post');
        return null;
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Failed to create post');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    setIsLiking(postId);
    try {
      const response = await apiClient.request<{ liked: boolean; likes_count: number }>(
        `/v1/feed/posts/${postId}/like`,
        { method: 'POST' }
      );

      if (response.ok && response.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  is_liked: response.data!.liked,
                  likes_count: response.data!.likes_count,
                }
              : p
          )
        );
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to toggle like');
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to toggle like');
    } finally {
      setIsLiking(null);
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string, parentId?: string) => {
    setIsCommenting(postId);
    try {
      const response = await apiClient.request<FeedComment>(
        `/v1/feed/posts/${postId}/comment`,
        {
          method: 'POST',
          body: { content, parent_id: parentId },
        }
      );

      if (response.ok && response.data) {
        // Only increment count for top-level comments
        if (!parentId) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
            )
          );
        }
        toast.success(parentId ? 'Reply added' : 'Comment added');
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to add comment');
        return null;
      }
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
      return null;
    } finally {
      setIsCommenting(null);
    }
  }, []);

  const likeComment = useCallback(async (postId: string, commentId: string) => {
    try {
      const response = await apiClient.request<{ liked: boolean; likes_count: number }>(
        `/v1/feed/posts/${postId}/comments/${commentId}/like`,
        { method: 'POST' }
      );

      if (response.ok && response.data) {
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to toggle like');
        return null;
      }
    } catch (error) {
      console.error('Like comment error:', error);
      toast.error('Failed to toggle like');
      return null;
    }
  }, []);

  const sharePost = useCallback(async (postId: string, comment?: string) => {
    setIsSharing(postId);
    try {
      const response = await apiClient.request<{ id: string; shares_count: number }>(
        `/v1/feed/posts/${postId}/share`,
        {
          method: 'POST',
          body: { comment },
        }
      );

      if (response.ok && response.data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, shares_count: response.data!.shares_count }
              : p
          )
        );
        toast.success('Post shared successfully');
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to share post');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share post');
    } finally {
      setIsSharing(null);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const response = await apiClient.request(`/v1/feed/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success('Post deleted successfully');
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
    }
  }, []);

  const loadComments = useCallback(async (postId: string): Promise<FeedComment[]> => {
    try {
      const response = await apiClient.request<FeedComment[]>(
        `/v1/feed/posts/${postId}/comments`,
        { method: 'GET' }
      );

      if (response.ok && response.data) {
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to load comments');
        return [];
      }
    } catch (error) {
      console.error('Load comments error:', error);
      toast.error('Failed to load comments');
      return [];
    }
  }, []);

  const loadPost = useCallback(async (postId: string): Promise<FeedPost | null> => {
    try {
      const response = await apiClient.request<FeedPost>(
        `/v1/feed/posts/${postId}`,
        { method: 'GET' }
      );

      if (response.ok && response.data) {
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to load post');
        return null;
      }
    } catch (error) {
      console.error('Load post error:', error);
      toast.error('Failed to load post');
      return null;
    }
  }, []);

  return {
    posts,
    meta,
    isLoading,
    isCreating,
    isLiking,
    isCommenting,
    isSharing,
    loadFeed,
    createPost,
    toggleLike,
    addComment,
    likeComment,
    sharePost,
    deletePost,
    loadComments,
    loadPost,
  };
}

