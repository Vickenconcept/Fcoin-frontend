import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  MessageSquare,
  Ban,
  Search,
  Loader2,
  X,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

type UserSetting = {
  key: string;
  value: string;
};

type BlockedUser = {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  blocked_at: string;
};

export function SettingsSection() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load settings
  const loadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const response = await apiClient.request<{ data: Record<string, string> }>('/v1/settings');
      if (response.ok && response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Load blocked users
  const loadBlockedUsers = useCallback(async () => {
    setIsLoadingBlocks(true);
    try {
      const response = await apiClient.request<{
        data: BlockedUser[];
        meta: {
          pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
          };
        };
      }>('/v1/blocks');
      if (response.ok && response.data) {
        setBlockedUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      toast.error('Failed to load blocked users');
    } finally {
      setIsLoadingBlocks(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadBlockedUsers();
  }, [loadSettings, loadBlockedUsers]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    setIsSavingSettings(true);
    try {
      const response = await apiClient.request(`/v1/settings/${key}`, {
        method: 'PUT',
        body: { value },
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        toast.success('Setting updated');
      } else {
        const errorMsg = response.errors?.[0]?.detail ?? 'Failed to update setting';
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error('Failed to update setting');
    } finally {
      setIsSavingSettings(false);
    }
  }, []);

  const handleUnblock = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.request(`/v1/blocks/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBlockedUsers((prev) => prev.filter((block) => block.user.id !== userId));
        toast.success('User unblocked');
      } else {
        const errorMsg = response.errors?.[0]?.detail ?? 'Failed to unblock user';
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  }, []);

  const getSettingValue = (key: string, defaultValue = '0') => {
    return settings[key] || defaultValue;
  };

  const isSettingEnabled = (key: string) => {
    const value = getSettingValue(key);
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  };

  const toggleSetting = (key: string) => {
    const newValue = isSettingEnabled(key) ? '0' : '1';
    updateSetting(key, newValue);
  };

  const filteredBlockedUsers = blockedUsers.filter((block) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      block.user.username.toLowerCase().includes(query) ||
      block.user.display_name?.toLowerCase().includes(query) ||
      ''
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
      </div>

      {/* Messaging Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Messaging Preferences</h3>
        </div>

        {isLoadingSettings ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="disable-messaging" className="text-base">
                  Disable Messaging
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, other users cannot send you messages. They will be notified that your account has messaging disabled.
                </p>
              </div>
              <Switch
                id="disable-messaging"
                checked={isSettingEnabled('disable_messaging')}
                onCheckedChange={() => toggleSetting('disable_messaging')}
                disabled={isSavingSettings}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="followers-only" className="text-base">
                  Messages from Followers Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only allow messages from users who follow you. Others will need to follow you first.
                </p>
              </div>
              <Switch
                id="followers-only"
                checked={isSettingEnabled('allow_messages_from_followers_only')}
                onCheckedChange={() => toggleSetting('allow_messages_from_followers_only')}
                disabled={isSavingSettings || isSettingEnabled('disable_messaging')}
              />
            </div>

            {isSettingEnabled('disable_messaging') && (
              <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Messaging is disabled</p>
                  <p className="text-sm text-muted-foreground">
                    Other users will see a message that your account has blocked messaging when they try to contact you.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Blocked Users */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Ban className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Blocked Users</h3>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blocked users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoadingBlocks ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBlockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No blocked users found' : 'No blocked users'}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {filteredBlockedUsers.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={block.user.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(block.user.display_name || block.user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {block.user.display_name || block.user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">@{block.user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(block.user.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">About Blocking</p>
              <p className="text-sm text-muted-foreground">
                When you block a user, they cannot see your posts in the feed, send you messages, or view your profile.
                You also won't see their posts or messages. You can unblock them at any time.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

