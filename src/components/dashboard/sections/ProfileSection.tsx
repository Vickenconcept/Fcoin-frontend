import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangle,
  CheckCircle,
  Facebook,
  Info,
  Instagram,
  Loader2,
  Music2,
  Youtube,
  MapPin,
  Link2,
  Plus,
  X,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { PreferenceKey } from '../hooks/useNotificationPreferences';
import { FacebookPagesManager } from './FacebookPagesManager';
import { TikTokAccountsManager } from './TikTokAccountsManager';
import { InstagramAccountsManager } from './InstagramAccountsManager';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

type ProviderCard = {
  key: string;
  provider: string;
  platform: string;
  icon: any;
  color: string;
  connectLabel: string;
  variant: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'coming-soon';
  description?: string;
};

const SOCIAL_PROVIDER_CARDS: ProviderCard[] = [
  {
    key: 'facebook',
    provider: 'facebook',
    platform: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-100 text-blue-600',
    connectLabel: 'Connect Profile',
    variant: 'facebook',
    description:
      'Profile connects let us recognise your engagement. Grant Page access when you’re ready to track posts and reward fans.',
  },
  {
    key: 'instagram',
    provider: 'instagram',
    platform: 'Instagram',
    icon: Instagram,
    color: 'bg-pink-100 text-pink-600',
    connectLabel: 'Connect Instagram',
    variant: 'instagram',
    description: 'Connect your creator or business account to sync posts and engagement metrics.',
  },
  {
    key: 'youtube',
    provider: 'youtube',
    platform: 'YouTube',
    icon: Youtube,
    color: 'bg-red-100 text-red-600',
    connectLabel: 'Connect YouTube',
    variant: 'youtube',
    description:
      'Connect your YouTube channel to sync videos, comments, and engagement metrics automatically.',
  },
  {
    key: 'tiktok',
    provider: 'tiktok',
    platform: 'TikTok',
    icon: Music2,
    color: 'bg-sky-100 text-sky-600',
    connectLabel: 'Connect TikTok',
    variant: 'tiktok',
    description:
      'Connect your TikTok creator account to capture videos and engagement. Fans can link their profile so we can reward their activity.',
  },
];

type TextChangeEvent = { target: { value: string } };
type EditableProfileLink = { id: string; label: string; url: string };

const generateLinkId = () => Math.random().toString(36).slice(2, 11);

const toEditableLinks = (links?: Array<{ label?: string; url?: string }>): EditableProfileLink[] =>
  (links ?? []).map((link, index) => ({
    id: `${link.label ?? 'link'}-${index}-${generateLinkId()}`,
    label: link.label ?? '',
    url: link.url ?? '',
  }));

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const {
    accountsMap,
    instagramAccounts,
    youtubeAccounts,
    tiktokCreatorAccounts,
    tiktokFanAccounts,
    isLoading,
    isConnecting,
    pendingRecovery,
    isRecovering,
    recoverFacebookProfile,
    dismissRecovery,
    connectFacebookProfile,
    connectFacebookPages,
    connectInstagram,
    connectTikTokCreator,
    connectTikTokFan,
    connectYouTube,
    disconnect,
  } = useSocialAccounts();
  const {
    preferences: notificationPreferences,
    isSaving: isSavingNotificationPrefs,
    isDirty: isNotificationPrefsDirty,
    updatePreference: updateNotificationPreference,
    reset: resetNotificationPreferences,
    save: saveNotificationPreferences,
  } = useNotificationPreferences();
  const [isFacebookManagerOpen, setIsFacebookManagerOpen] = useState(false);
  const [isInstagramManagerOpen, setIsInstagramManagerOpen] = useState(false);
  const [isTikTokManagerOpen, setIsTikTokManagerOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [profileBio, setProfileBio] = useState(user?.profile_bio ?? '');
  const [profileLocation, setProfileLocation] = useState(user?.profile_location ?? '');
  const [profileLinks, setProfileLinks] = useState<EditableProfileLink[]>(toEditableLinks(user?.profile_links));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'self' | 'unavailable' | 'error'>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string>('');

  useEffect(() => {
    setDisplayName(user?.display_name ?? '');
    setUsername(user?.username ?? '');
    setProfileBio(user?.profile_bio ?? '');
    setProfileLocation(user?.profile_location ?? '');
    setProfileLinks(toEditableLinks(user?.profile_links));
    setUsernameStatus('idle');
    setUsernameStatusMessage('');
  }, [user?.display_name, user?.username, user?.profile_bio, user?.profile_location, user?.profile_links]);

  const originalDisplayName = user?.display_name ?? '';
  const originalUsername = user?.username ?? '';
  const trimmedDisplayName = displayName.trim();
  const trimmedUsername = username.trim();
  const originalProfileBio = user?.profile_bio ?? '';
  const originalProfileLocation = user?.profile_location ?? '';
  const originalProfileLinks = user?.profile_links ?? [];
  const trimmedBio = profileBio.trim();
  const trimmedLocation = profileLocation.trim();
  const sanitizedProfileLinks = useMemo(
    () =>
      profileLinks
        .map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        }))
        .filter((link) => link.label && link.url),
    [profileLinks],
  );
  const hasProfileChanges =
    trimmedDisplayName !== originalDisplayName ||
    trimmedUsername !== originalUsername ||
    trimmedBio !== originalProfileBio ||
    trimmedLocation !== originalProfileLocation ||
    JSON.stringify(sanitizedProfileLinks) !== JSON.stringify(originalProfileLinks);

  const notificationRows: Array<{
    key: PreferenceKey;
    label: string;
    description: string;
  }> = [
    {
      key: 'top_up',
      label: 'Wallet top-ups',
      description: 'Alert when your wallet balance increases after a top-up.',
    },
    {
      key: 'wallet_transfer',
      label: 'Peer transfers',
      description: 'Notify when you send or receive coins from another user.',
    },
    {
      key: 'reward',
      label: 'Reward payouts',
      description: 'Let me know when engagement rewards are delivered.',
    },
  ];

  const canAddLink = profileLinks.length < 5;

  const handleAddLink = () => {
    if (!canAddLink) return;
    setProfileLinks((prev) => [...prev, { id: generateLinkId(), label: '', url: '' }]);
  };

  const handleLinkChange = (id: string, field: 'label' | 'url', value: string) => {
    setProfileLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link)),
    );
  };

  const handleRemoveLink = (id: string) => {
    setProfileLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const profilePublicUrl = useMemo(() => {
    const slug = trimmedUsername || originalUsername;
    if (!slug) return '';
    if (typeof window === 'undefined') return `/${slug}`;
    return `${window.location.origin}/${slug}`;
  }, [trimmedUsername, originalUsername]);

  const handleCopyProfileUrl = useCallback(() => {
    if (!profilePublicUrl) return;
    navigator.clipboard.writeText(profilePublicUrl).then(
      () => toast.success('Profile link copied!'),
      () => toast.error('Unable to copy link'),
    );
  }, [profilePublicUrl]);

  useEffect(() => {
    const next = trimmedUsername;

    if (!next) {
      setUsernameStatus('unavailable');
      setUsernameStatusMessage('Username is required.');
      return;
    }

    if (next === originalUsername) {
      setUsernameStatus('idle');
      setUsernameStatusMessage('');
      return;
    }

    setUsernameStatus('checking');
    setUsernameStatusMessage('');

    const currentUsername = next;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await apiClient.request<{ id: string; username: string }>(
          `/v1/users/lookup?username=${encodeURIComponent(currentUsername)}`,
        );

        if (trimmedUsername !== currentUsername) {
          return;
        }

        if (response.ok && response.data) {
          if (response.data.id === user?.id) {
            setUsernameStatus('self');
            setUsernameStatusMessage('This is already your username.');
          } else {
            setUsernameStatus('unavailable');
            setUsernameStatusMessage('That username is already taken.');
          }
        } else if (response.status === 404) {
          setUsernameStatus('available');
          setUsernameStatusMessage('Great — that username is available.');
        } else {
          setUsernameStatus('error');
          setUsernameStatusMessage(response.errors?.[0]?.detail ?? 'Unable to verify username.');
        }
      } catch (error) {
        console.error('[ProfileSection] username lookup error', error);
        if (trimmedUsername !== currentUsername) {
          return;
        }

        setUsernameStatus('error');
        setUsernameStatusMessage('Unable to verify username right now.');
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [trimmedUsername, originalUsername, user?.id]);

  const handleSaveProfile = async () => {
    if (!hasProfileChanges) {
      toast('Nothing to update.', { icon: 'ℹ️' });
      return;
    }

    if (!trimmedUsername) {
      toast.error('Username is required.');
      return;
    }

    if (
      trimmedUsername !== originalUsername &&
      (usernameStatus === 'checking' || usernameStatus === 'unavailable' || usernameStatus === 'error')
    ) {
      const message =
        usernameStatus === 'checking'
          ? 'Please wait while we verify your username.'
          : usernameStatusMessage || 'Choose a different username and try again.';
      toast.error(message);
      return;
    }

    setIsSavingProfile(true);

    try {
    const payload: Record<string, string | null | undefined | Array<{ label: string; url: string }>> =
      {};

      if (trimmedDisplayName !== originalDisplayName) {
        payload.display_name = trimmedDisplayName || null;
      }

      if (trimmedUsername !== originalUsername) {
        payload.username = trimmedUsername;
      }

      if (trimmedBio !== originalProfileBio) {
        payload.profile_bio = trimmedBio || null;
      }

      if (trimmedLocation !== originalProfileLocation) {
        payload.profile_location = trimmedLocation || null;
      }

      if (JSON.stringify(sanitizedProfileLinks) !== JSON.stringify(originalProfileLinks)) {
        payload.profile_links = sanitizedProfileLinks;
      }

      const response = await apiClient.request('/v1/profile', {
        method: 'PATCH',
        body: payload as any,
      });

      if (!response.ok) {
        const detail = response.errors?.[0]?.detail ?? 'Unable to update profile.';
        toast.error(detail);
        return;
      }

      await refreshUser();
      toast.success('Profile updated successfully.');
      setUsernameStatus('idle');
      setUsernameStatusMessage('');
    } catch (error) {
      console.error('[ProfileSection] update profile failed', error);
      toast.error('We could not update your profile right now. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const providers = useMemo(() => SOCIAL_PROVIDER_CARDS, []);

  const handleDisconnectTikTok = useCallback(() => {
    if (tiktokCreatorAccounts.length > 0) {
      disconnect('tiktok').catch(() => {});
      return;
    }

    if (tiktokFanAccounts.length > 0) {
      disconnect('tiktok_fan').catch(() => {});
      return;
    }

    disconnect('tiktok').catch(() => {});
  }, [disconnect, tiktokCreatorAccounts.length, tiktokFanAccounts.length]);

  return (
    <div className="space-y-6">
      {pendingRecovery && (
        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-slate-900 font-semibold">Reconnect your Facebook profile</h4>
              <p className="text-sm text-slate-600">
                We detected that {pendingRecovery.providerUsername ?? 'this Facebook profile'} is linked to another
                FanCoin account. If this is really you, transfer it now to keep earning rewards here.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isRecovering}
                className="bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => recoverFacebookProfile().catch(() => {})}
              >
                {isRecovering ? 'Transferring…' : 'Transfer Profile'}
              </Button>
              <Button size="sm" variant="outline" onClick={dismissRecovery} disabled={isRecovering}>
                Not now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Profile Info */}
      <Card className="p-6 border-purple-100 bg-white">
        <h3 className="text-slate-900 mb-6">Profile Information</h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-slate-600 mb-1">Name</p>
              <Input
                value={displayName}
                onChange={(event: TextChangeEvent) => setDisplayName(event.target.value)}
                placeholder="Display name"
                maxLength={120}
                disabled={isSavingProfile}
              />
            </div>
            <div>
              <p className="text-slate-600 mb-1">Username</p>
              <Input
                value={username}
                onChange={(event: TextChangeEvent) => setUsername(event.target.value)}
                placeholder="username"
                maxLength={50}
                disabled={isSavingProfile}
              />
              <div className="min-h-[1.5rem] mt-1 text-xs text-slate-500 flex items-center gap-2">
                {usernameStatus === 'idle' && <span>Choose a unique username for your profile.</span>}
                {usernameStatus === 'checking' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                    <span className="text-purple-600">Checking availability…</span>
                  </>
                )}
                {usernameStatus === 'available' && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">{usernameStatusMessage}</span>
                  </>
                )}
                {usernameStatus === 'self' && (
                  <>
                    <Info className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-500">{usernameStatusMessage}</span>
                  </>
                )}
                {(usernameStatus === 'unavailable' || usernameStatus === 'error') && (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-600">{usernameStatusMessage}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          <div>
            <p className="text-slate-600 mb-1">Bio</p>
            <Textarea
              value={profileBio}
              onChange={(event: TextChangeEvent) => setProfileBio(event.target.value)}
              placeholder="Tell fans about your community, posting cadence, or reward rules."
              maxLength={1000}
              disabled={isSavingProfile}
              className="min-h-[120px]"
            />
            <div className="text-xs text-slate-500 mt-1 text-right">{profileBio.length}/1000</div>
          </div>
          <div>
            <p className="text-slate-600 mb-1">Location</p>
            <Input
              value={profileLocation}
              onChange={(event: TextChangeEvent) => setProfileLocation(event.target.value)}
              placeholder="City, Country"
              maxLength={120}
              disabled={isSavingProfile}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600">Links</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLink}
                disabled={!canAddLink}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add link
              </Button>
            </div>
            {profileLinks.length === 0 && (
              <p className="text-sm text-slate-500 mb-3">Share your website or top socials.</p>
            )}
            <div className="space-y-3">
              {profileLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
                >
                  <Input
                    value={link.label}
                    onChange={(event: TextChangeEvent) =>
                      handleLinkChange(link.id, 'label', event.target.value)
                    }
                    placeholder="Label (e.g., Website)"
                    maxLength={40}
                    disabled={isSavingProfile}
                    className="md:w-48"
                  />
                  <Input
                    value={link.url}
                    onChange={(event: TextChangeEvent) =>
                      handleLinkChange(link.id, 'url', event.target.value)
                    }
                    placeholder="https://example.com"
                    maxLength={255}
                    disabled={isSavingProfile}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={isSavingProfile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleSaveProfile}
          disabled={
            isSavingProfile ||
            !hasProfileChanges ||
            !trimmedUsername ||
            (trimmedUsername !== originalUsername &&
              (usernameStatus === 'checking' || usernameStatus === 'unavailable' || usernameStatus === 'error'))
          }
        >
          {isSavingProfile ? 'Saving…' : 'Save Changes'}
        </Button>
      </Card>

      <Card className="p-6 border-dashed border-purple-200 bg-purple-50/30">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-slate-900 font-semibold">Public profile preview</h3>
            <p className="text-sm text-slate-600">
              Fans see this at {profilePublicUrl || 'your profile link'}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyProfileUrl} className="flex gap-2">
              <Copy className="w-4 h-4" />
              Copy link
            </Button>
            <Button
              size="sm"
              onClick={() => profilePublicUrl && window.open(profilePublicUrl, '_blank')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              disabled={!profilePublicUrl}
            >
              View live
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white bg-white/70 p-5 space-y-4 shadow-inner">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-xl text-purple-700 font-semibold">
              {(trimmedDisplayName || trimmedUsername || originalUsername || 'FC')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 text-lg">
                  {trimmedDisplayName || originalDisplayName || originalUsername}
                </p>
                <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-xs">
                  @{trimmedUsername || originalUsername}
                </Badge>
              </div>
              {trimmedLocation && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{trimmedLocation}</span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Default coin: {user?.default_coin_symbol || 'FCN'}
              </p>
            </div>
          </div>
          {trimmedBio && (
            <p className="text-slate-700 whitespace-pre-wrap text-sm border-t border-slate-100 pt-3">
              {trimmedBio}
            </p>
          )}
          {sanitizedProfileLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {sanitizedProfileLinks.map((link) => (
                <span
                  key={`${link.label}-${link.url}`}
                  className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm text-purple-700"
                >
                  <Link2 className="w-3 h-3" />
                  {link.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 border-purple-100 bg-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h3 className="text-slate-900">Notification Preferences</h3>
            <p className="text-slate-600 text-sm">
              Decide where you want alerts for top-ups, transfers, and rewards to appear.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isNotificationPrefsDirty || isSavingNotificationPrefs}
              onClick={resetNotificationPreferences}
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={!isNotificationPrefsDirty || isSavingNotificationPrefs}
              onClick={() => {
                void saveNotificationPreferences();
              }}
            >
              {isSavingNotificationPrefs ? 'Saving…' : 'Save Preferences'}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h4 className="text-slate-900 font-semibold">Email alerts</h4>
              <p className="text-xs text-slate-500">
                Keep your inbox in the loop for important wallet activity.
              </p>
            </div>
            <div className="space-y-4">
              {notificationRows.map((option) => {
                const enabled = notificationPreferences.email[option.key];

                return (
                  <div
                    key={`email-${option.key}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {enabled ? 'On' : 'Off'}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked: boolean) =>
                          updateNotificationPreference('email', option.key, Boolean(checked))
                        }
                        aria-label={`Toggle ${option.label} email alerts`}
                        className="data-[state=unchecked]:bg-slate-300 data-[state=checked]:bg-purple-600 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-slate-900 font-semibold">In-app notifications</h4>
              <p className="text-xs text-slate-500">
                Show activity updates inside the dashboard notifications stream.
              </p>
            </div>
            <div className="space-y-4">
              {notificationRows.map((option) => {
                const enabled = notificationPreferences.in_app[option.key];

                return (
                  <div
                    key={`inapp-${option.key}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {enabled ? 'On' : 'Off'}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked: boolean) =>
                          updateNotificationPreference('in_app', option.key, Boolean(checked))
                        }
                        aria-label={`Toggle ${option.label} in-app alerts`}
                        className="data-[state=unchecked]:bg-slate-300 data-[state=checked]:bg-purple-600 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Social Accounts */}
      <Card className="p-6 border-purple-100 bg-white">
        <h3 className="text-slate-900 mb-6">Connected Social Accounts</h3>
        <p className="text-slate-600 mb-6">
          Connect your social media accounts to track engagement and reward your followers.
        </p>
        <div className="space-y-4">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isFacebook = provider.variant === 'facebook';
            const isInstagram = provider.variant === 'instagram';
            const isTikTok = provider.variant === 'tiktok';
            const isYouTube = provider.variant === 'youtube';
            const primaryAccount = isInstagram
              ? instagramAccounts[0]
              : isTikTok
              ? tiktokCreatorAccounts[0] ?? tiktokFanAccounts[0]
              : isYouTube
              ? youtubeAccounts[0]
              : accountsMap[provider.provider];
            const tiktokCreatorCount = tiktokCreatorAccounts.length;
            const tiktokFanCount = tiktokFanAccounts.length;
            const youtubeCount = youtubeAccounts.length;
            const isConnected = isInstagram
              ? instagramAccounts.length > 0
              : isTikTok
              ? tiktokCreatorCount > 0 || tiktokFanCount > 0
              : isYouTube
              ? youtubeCount > 0
              : Boolean(primaryAccount);

            const handleDisconnectInstagram = () => {
              if (instagramAccounts.length === 0) {
                return;
              }

              if (instagramAccounts.length === 1) {
                const targetAccount = instagramAccounts[0];
                disconnect('instagram', targetAccount.id).catch(() => {});
                return;
              }

              toast('Select which Instagram account to disconnect.', { icon: 'ℹ️' });
              setIsInstagramManagerOpen(true);
            };

            return (
              <Card key={provider.key} className="p-4 border-purple-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${provider.color} rounded-xl flex items-center justify-center`}>
                      {Icon ? (
                        <Icon className="w-6 h-6" />
                      ) : (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-900">{provider.platform}</p>
                      {isConnected ? (
                        <p className="text-slate-500">
                          {isInstagram
                            ? `${instagramAccounts.length} account${instagramAccounts.length === 1 ? '' : 's'} connected`
                            : isTikTok
                            ? `${tiktokCreatorCount} creator${tiktokCreatorCount === 1 ? '' : 's'} · ${tiktokFanCount} fan${tiktokFanCount === 1 ? '' : 's'}`
                            : primaryAccount?.provider_username ??
                              primaryAccount?.provider_user_id ??
                              'Connected'}
                        </p>
                      ) : (
                        <p className="text-slate-500">Not connected</p>
                      )}
                    </div>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                      {isInstagram ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsInstagramManagerOpen(true)}
                          >
                            Manage Accounts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading || isConnecting}
                            onClick={() => connectInstagram().catch(() => {})}
                          >
                            {isConnecting ? 'Connecting…' : 'Connect Another'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isLoading || isConnecting}
                            onClick={handleDisconnectInstagram}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : isFacebook ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsFacebookManagerOpen(true)}
                          >
                            Manage Pages
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isConnecting}
                            onClick={() => connectFacebookPages().catch(() => {})}
                          >
                            {isConnecting ? 'Reconnecting…' : 'Grant Page Access'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isLoading || isConnecting}
                            onClick={() => disconnect('facebook').catch(() => {})}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : isTikTok ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-sky-500 text-white hover:bg-sky-600"
                            onClick={() => setIsTikTokManagerOpen(true)}
                          >
                            Manage Creators
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading || isConnecting}
                            className="border-sky-200 text-sky-600 hover:bg-sky-50 w-auto"
                            onClick={() => connectTikTokCreator().catch(() => {})}
                          >
                            {isConnecting ? 'Connecting…' : 'Connect Creator'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading || isConnecting}
                            className="border-sky-200 text-sky-600 hover:bg-sky-50 w-auto"
                            onClick={() => connectTikTokFan().catch(() => {})}
                          >
                            {isConnecting ? 'Connecting…' : 'Connect Fan'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 w-auto"
                            disabled={isLoading || isConnecting}
                            onClick={handleDisconnectTikTok}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : isYouTube ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-red-500 text-white hover:bg-red-600 w-auto"
                            disabled={isLoading || isConnecting}
                            onClick={() => connectYouTube().catch(() => {})}
                          >
                            {isConnecting ? 'Reconnecting…' : 'Reconnect'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isLoading || isConnecting}
                            onClick={() => (primaryAccount ? disconnect('youtube', primaryAccount.id).catch(() => {}) : disconnect('youtube').catch(() => {}))}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnect(provider.provider).catch(() => {})}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  ) : isFacebook ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          disabled={isLoading || isConnecting}
                          onClick={() => connectFacebookProfile().catch(() => {})}
                        >
                          {isConnecting ? 'Connecting…' : 'Connect Profile'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading || isConnecting}
                          onClick={() => connectFacebookPages().catch(() => {})}
                        >
                          {isConnecting ? 'Connecting…' : 'Connect with Pages'}
                        </Button>
                      </div>
                      {provider.description && (
                        <p className="text-xs text-slate-500">{provider.description}</p>
                      )}
                    </div>
                  ) : isInstagram ? (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={isLoading || isConnecting}
                      onClick={() => connectInstagram().catch(() => {})}
                    >
                      {isConnecting ? 'Connecting…' : provider.connectLabel}
                    </Button>
                  ) : isTikTok ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          className="bg-sky-500 text-white hover:bg-sky-600 w-auto"
                          disabled={isLoading || isConnecting}
                          onClick={() => connectTikTokCreator().catch(() => {})}
                        >
                          {isConnecting ? 'Connecting…' : 'Connect Creator'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-sky-200 text-sky-600 hover:bg-sky-50 w-auto"
                          disabled={isLoading || isConnecting}
                          onClick={() => connectTikTokFan().catch(() => {})}
                        >
                          {isConnecting ? 'Connecting…' : 'Connect as Fan'}
                        </Button>
                      </div>
                      {provider.description && (
                        <p className="text-xs text-slate-500">{provider.description}</p>
                      )}
                    </div>
                  ) : isYouTube ? (
                    <div className="flex flex-col gap-3">
                      <Button
                        size="sm"
                        className="bg-red-500 text-white hover:bg-red-600 w-auto"
                        disabled={isLoading || isConnecting}
                        onClick={() => connectYouTube().catch(() => {})}
                      >
                        {isConnecting ? 'Connecting…' : provider.connectLabel}
                      </Button>
                      {provider.description && (
                        <p className="text-xs text-slate-500">{provider.description}</p>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-slate-200 text-slate-500 border-slate-300">Coming Soon</Badge>
                  )}
                </div>
                {!isConnected && provider.description && !isFacebook && (
                  <p className="text-xs text-slate-500 mt-3">{provider.description}</p>
                )}
                {isInstagram && isConnected && instagramAccounts.length > 0 && (
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {instagramAccounts.slice(0, 2).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {entry.provider_username
                            ? `${entry.provider_username.startsWith('@') ? '' : '@'}${entry.provider_username}`
                            : entry.provider_user_id}
                        </span>
                        <span className="text-xs text-slate-400">
                          Connected {entry.connected_at ? new Date(entry.connected_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    ))}
                    {instagramAccounts.length > 2 && (
                      <button
                        type="button"
                        className="text-xs text-purple-600 hover:underline"
                        onClick={() => setIsInstagramManagerOpen(true)}
                      >
                        View all {instagramAccounts.length} accounts
                      </button>
                    )}
                  </div>
                )}
                {isTikTok && isConnected && (
                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    {tiktokCreatorCount > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Creator Accounts
                        </p>
                        {tiktokCreatorAccounts.slice(0, 2).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {entry.provider_username
                                ? `${entry.provider_username.startsWith('@') ? '' : '@'}${entry.provider_username}`
                                : entry.provider_user_id}
                            </span>
                            <span className="text-xs text-slate-400">
                              Connected {entry.connected_at ? new Date(entry.connected_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        ))}
                        {tiktokCreatorCount > 2 && (
                          <button
                            type="button"
                            className="text-xs text-sky-600 hover:underline"
                            onClick={() => setIsTikTokManagerOpen(true)}
                          >
                            View all {tiktokCreatorCount} creator accounts
                          </button>
                        )}
                      </div>
                    )}
                    {tiktokFanCount > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-slate-500">Fan Profiles</p>
                        {tiktokFanAccounts.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2">
                            <span className="truncate">
                              {entry.provider_username
                                ? `${entry.provider_username.startsWith('@') ? '' : '@'}${entry.provider_username}`
                                : entry.provider_user_id}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>
      <FacebookPagesManager
        open={isFacebookManagerOpen}
        onOpenChange={setIsFacebookManagerOpen}
      />
      <InstagramAccountsManager
        open={isInstagramManagerOpen}
        onOpenChange={setIsInstagramManagerOpen}
        accounts={instagramAccounts}
        isConnecting={isConnecting}
        onConnect={() => connectInstagram().catch(() => {})}
        onDisconnect={(accountId) => disconnect('instagram', accountId).catch(() => {})}
      />
      <TikTokAccountsManager
        open={isTikTokManagerOpen}
        onOpenChange={setIsTikTokManagerOpen}
        accounts={tiktokCreatorAccounts}
        isConnecting={isConnecting}
        onConnect={() => connectTikTokCreator().catch(() => {})}
        onDisconnect={(accountId) => disconnect('tiktok', accountId).catch(() => {})}
      />
    </div>
  );
}

