import { useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, type Notification } from './hooks/useNotifications';
import { MentionText } from './MentionText';

type NotificationPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onPostClick?: (postId: string, commentId?: string) => void;
};

export function NotificationPanel({ isOpen, onClose, onPostClick }: NotificationPanelProps) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    const data = notification.data;
    if (data.post_id && onPostClick) {
      // If it's a mention in a comment, pass the comment ID to scroll to it
      const commentId = data.comment_id;
      onPostClick(data.post_id as string, commentId as string | undefined);
      onClose();
    } else if (data.post_id) {
      // Fallback: just open the post
      onPostClick?.(data.post_id as string);
      onClose();
    } else {
      // No post ID, just close
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('mention')) {
      return '💬';
    }
    if (type.includes('reward')) {
      return '🎁';
    }
    if (type.includes('top_up')) {
      return '💰';
    }
    if (type.includes('transfer')) {
      return '💸';
    }
    return '🔔';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md h-[calc(100vh-5rem)] bg-white shadow-xl flex flex-col mr-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-black" />
            <h3 className="font-semibold text-black">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-orange-500 text-white">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-gray-600 hover:text-black"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-black"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-4 border-b">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const isUnread = !notification.read_at;
                const data = notification.data;
                const mentionerName = data.mentioner_display_name || data.mentioner_username || 'Someone';

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isUnread ? 'bg-blue-50/50' : ''
                    } ${data.post_id ? 'hover:bg-orange-50' : ''}`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      {data.mentioner_avatar_url || data.mentioner_id ? (
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage
                            src={data.mentioner_avatar_url as string | undefined}
                            alt={mentionerName as string}
                          />
                          <AvatarFallback className="text-xs">
                            {(mentionerName as string).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-black line-clamp-2">
                            {data.title || 'Notification'}
                          </p>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {data.body ? (
                            <MentionText text={data.body as string} />
                          ) : (
                            'You have a new notification'
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTime(notification.created_at)}</span>
                          {notification.type.includes('mention') && (
                            <Badge variant="outline" className="text-xs">
                              Mention
                            </Badge>
                          )}
                          {data.post_id && (
                            <span className="text-orange-500 text-xs font-medium">Click to view →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

