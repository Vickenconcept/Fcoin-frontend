import { useState, useEffect, useCallback, useRef } from 'react';
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
  reward_coin_symbol?: string | null;
  reward_rule?: {
    like?: number;
    comment?: number;
    share?: number;
    per_user_cap?: number;
  } | null;
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
  shared_post?: FeedPost; // Recursive type for shared posts
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLiking, setIsLiking] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  
  // Real-time updates state
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [latestPostId, setLatestPostId] = useState<string | null>(null);
  
  // Use ref to avoid infinite loops with sortBy dependency
  const sortByRef = useRef(sortBy);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  const loadFeed = useCallback(async (page = 1, isLoadingMore = false) => {
    console.log('Frontend Feed: loadFeed called', { page, isLoadingMore, sortBy: sortByRef.current });

    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      console.log('Feed: Loading feed', { sortBy: sortByRef.current, page, isLoadingMore });
      const response = await apiClient.request<FeedPost[]>(
        `/v1/feed?sort=${sortByRef.current}&per_page=20&page=${page}`,
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
          // Track the latest post ID for real-time updates
          if (response.data.length > 0) {
            setLatestPostId(response.data[0].id);
            setNewPostsCount(0); // Reset new posts count when refreshing
          }
        } else {
          setPosts((prev) => [...prev, ...response.data!]);
        }
        setMeta(response.meta as FeedMeta);
        console.log('Feed: Successfully loaded', { 
          count: response.data.length, 
          totalPosts: page === 1 ? response.data.length : posts.length + response.data.length,
          currentPage: response.meta?.current_page,
          lastPage: response.meta?.last_page,
          latestPostId: page === 1 && response.data.length > 0 ? response.data[0].id : latestPostId
        });
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
      
      // Show specific error message based on error type
      let errorMessage = 'Failed to load feed';
      if (error && typeof error === 'object' && 'message' in error) {
        const errorObj = error as { message: string };
        if (errorObj.message.includes('Network Error') || errorObj.message.includes('connect')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (errorObj.message.includes('timeout') || errorObj.message.includes('Timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []); // No dependencies to prevent infinite loops

  // Test connectivity and load initial feed on component mount
  useEffect(() => {
    const testConnectivity = async () => {
      try {
        console.log('Frontend Feed: Testing API connectivity...');
        const response = await apiClient.request('/v1/auth/me', { method: 'GET' });
        console.log('Frontend Feed: API connectivity test result:', {
          ok: response.ok,
          status: response.status
        });
      } catch (error) {
        console.error('Frontend Feed: API connectivity test failed:', error);
      }
    };

    testConnectivity();
    loadFeed(1);
    setIsInitialLoad(false);
  }, []); // Only run once on mount
  
  // Separate effect for sortBy changes - reload feed when sort changes
  useEffect(() => {
    // Skip initial load since it's handled in the mount effect
    if (!isInitialLoad) {
      loadFeed(1);
    }
  }, [sortBy]); // Reload when sort changes

  const loadMore = useCallback(async () => {
    if (!meta || isLoadingMore || isLoading) return;
    
    const nextPage = meta.current_page + 1;
    if (nextPage <= meta.last_page) {
      console.log('Feed: Loading more posts', { nextPage, lastPage: meta.last_page });
      await loadFeed(nextPage, true);
    }
  }, [meta, isLoadingMore, isLoading, loadFeed]);

  const hasMore = meta ? meta.current_page < meta.last_page : false;

  // Check for new posts in the background
  const checkForNewPosts = useCallback(async () => {
    if (!latestPostId) return;
    
    try {
      const response = await apiClient.request<{ count: number; has_new_posts: boolean }>(
        `/v1/feed/new-count?after=${latestPostId}`,
        { method: 'GET' }
      );
      
      if (response.ok && response.data && response.data.has_new_posts) {
        setNewPostsCount(response.data.count);
        console.log('Feed: New posts available', { count: response.data.count });
      }
    } catch (error) {
      console.error('Feed: Error checking for new posts', error);
    }
  }, [latestPostId]);

  // Set up background polling for new posts
  useEffect(() => {
    if (!latestPostId) return;
    
    const interval = setInterval(checkForNewPosts, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkForNewPosts, latestPostId]);

  // Function to load new posts when user clicks the "new posts" button
  const loadNewPosts = useCallback(async () => {
    console.log('Feed: Loading new posts');
    await loadFeed(1, false);
  }, []);

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
    reward_coin_symbol?: string;
    reward_rule?: {
      like?: number;
      comment?: number;
      share?: number;
      per_user_cap?: number;
    };
  }) => {
    setIsCreating(true);
    try {
      const response = await apiClient.request<FeedPost>('/v1/feed/posts', {
        method: 'POST',
        body: data as any,
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
          body: { content, parent_id: parentId } as any,
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

  const sharePost = useCallback(async (postId: string, comment?: string, shareToTimeline = false) => {
    setIsSharing(postId);
    try {
      const response = await apiClient.request<{ 
        id: string; 
        shares_count: number;
        shared_post?: FeedPost;
      }>(
        `/v1/feed/posts/${postId}/share`,
        {
          method: 'POST',
          body: { comment, share_to_timeline: shareToTimeline } as any,
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
        
        // If shared to timeline, add the new post to the feed
        if (shareToTimeline && response.data.shared_post) {
          setPosts((prev) => [response.data!.shared_post!, ...prev]);
        }
        
        if (shareToTimeline) {
          toast.success('Post shared to your timeline!');
        } else {
          toast.success('Post shared successfully');
        }
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to share post');
        return null;
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share post');
      return null;
    } finally {
      setIsSharing(null);
    }
  }, []);

  const updatePost = useCallback(async (postId: string, data: {
    content?: string;
    visibility?: string;
    reward_enabled?: boolean;
    reward_pool?: number;
    reward_coin_symbol?: string;
    reward_rule?: {
      like?: number;
      comment?: number;
      share?: number;
      per_user_cap?: number;
    };
  }) => {
    try {
      const response = await apiClient.request<FeedPost>(
        `/v1/feed/posts/${postId}`,
        {
          method: 'PUT',
          body: data as any,
        }
      );

      if (response.ok && response.data) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? response.data! : p))
        );
        toast.success('Post updated successfully');
        return response.data;
      } else {
        toast.error(response.errors?.[0]?.detail || 'Failed to update post');
        return null;
      }
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('Failed to update post');
      return null;
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
    isLoadingMore,
    isCreating,
    isLiking,
    isCommenting,
    isSharing,
    hasMore,
    newPostsCount,
    loadFeed,
    loadMore,
    loadNewPosts,
    reload: useCallback(() => loadFeed(1), []),
    createPost,
    toggleLike,
    addComment,
    likeComment,
    sharePost,
    updatePost,
    deletePost,
    loadComments,
    loadPost,
  };
}

