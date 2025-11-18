import { useState, useEffect, useCallback } from 'react';
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
  error: string | null;
  loadNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (unreadOnly = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (unreadOnly) {
        params.append('unread_only', 'true');
      }
      params.append('per_page', '50');

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

      setNotifications(response.data || []);
      setUnreadCount(response.meta?.unread_count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    return loadNotifications(false);
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications(false);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

