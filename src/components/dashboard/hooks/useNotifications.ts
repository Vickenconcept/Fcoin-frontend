import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export type Notification = {
  id: string;
  type: string;
  data: {
    title?: string;
    body?: string;
    type?: string;
    mentioner_id?: string;
    mentioner_username?: string;
    mentioner_display_name?: string;
    mentioner_avatar_url?: string;
    post_id?: string;
    comment_id?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
};

type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadNotifications: (unreadOnly?: boolean, reset?: boolean) => Promise<void>;
  loadMore: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const INITIAL_PER_PAGE = 12;
const PER_PAGE = 12;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef(1);

  const loadNotifications = useCallback(async (unreadOnly = false, reset = true) => {
    if (reset) {
      setIsLoading(true);
      currentPageRef.current = 1;
      setCurrentPage(1);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    setCurrentFilter(unreadOnly ? 'unread' : 'all');
    
    try {
      const params = new URLSearchParams();
      if (unreadOnly) {
        params.append('unread_only', 'true');
      }
      
      const page = reset ? 1 : currentPageRef.current + 1;
      params.append('page', page.toString());
      params.append('per_page', reset ? INITIAL_PER_PAGE.toString() : PER_PAGE.toString());

      const response = await apiClient.request<{
        data: Notification[];
        meta: {
          unread_count: number;
          current_page: number;
          last_page: number;
          total: number;
        };
      }>(`/v1/notifications?${params.toString()}`, {
        method: 'GET',
      });

      if (response.ok && response.data) {
        const responseData = response.data as any;
        const notificationsData = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || []);
        const meta = (responseData?.meta || response.meta || {}) as {
          last_page?: number;
          unread_count?: number;
        };

        if (reset) {
          setNotifications(notificationsData);
        } else {
          setNotifications((prev) => [...prev, ...notificationsData]);
        }
        
        currentPageRef.current = page;
        setCurrentPage(page);
        setLastPage(meta.last_page || 1);
        setUnreadCount(meta.unread_count || 0);
      } else {
        setError(response.errors?.[0]?.detail || 'Failed to load notifications');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(async (unreadOnly?: boolean) => {
    const filter = unreadOnly !== undefined ? unreadOnly : currentFilter === 'unread';
    if (currentPageRef.current < lastPage && !isLoadingMore) {
      await loadNotifications(filter, false);
    }
  }, [lastPage, isLoadingMore, currentFilter, loadNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.request(`/v1/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
      toast.error(message);
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.request('/v1/notifications/read-all', {
        method: 'POST',
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      toast.error(message);
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    return loadNotifications(currentFilter === 'unread', true);
  }, [loadNotifications, currentFilter]);

  useEffect(() => {
    loadNotifications(false, true);
  }, []);

  const hasMore = currentPageRef.current < lastPage;

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

