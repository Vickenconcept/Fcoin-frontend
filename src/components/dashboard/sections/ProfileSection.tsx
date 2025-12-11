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
  Info,
  Loader2,
  MapPin,
  Link2,
  Plus,
  X,
  Copy,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { PreferenceKey } from '../hooks/useNotificationPreferences';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

type TextChangeEvent = { target: { value: string } };
type EditableProfileLink = { id: string; label: string; url: string };

const generateLinkId = () => Math.random().toString(36).slice(2, 11);

const toEditableLinks = (links?: Array<{ label?: string; url?: string }> | null): EditableProfileLink[] =>
  (links ?? []).map((link, index) => ({
    id: `${link.label ?? 'link'}-${index}-${generateLinkId()}`,
    label: link.label ?? '',
    url: link.url ?? '',
  }));

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const {
    preferences: notificationPreferences,
    isSaving: isSavingNotificationPrefs,
    isDirty: isNotificationPrefsDirty,
    updatePreference: updateNotificationPreference,
    reset: resetNotificationPreferences,
    save: saveNotificationPreferences,
  } = useNotificationPreferences();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileBio, setProfileBio] = useState(user?.profile_bio ?? '');
  const [profileLocation, setProfileLocation] = useState(user?.profile_location ?? '');
  const [profileLinks, setProfileLinks] = useState<EditableProfileLink[]>(toEditableLinks(user?.profile_links));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'self' | 'unavailable' | 'error'>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string>('');

  useEffect(() => {
    setDisplayName(user?.display_name ?? '');
    setUsername(user?.username ?? '');
    setAvatarUrl(user?.avatar_url ?? '');
    setProfileBio(user?.profile_bio ?? '');
    setProfileLocation(user?.profile_location ?? '');
    setProfileLinks(toEditableLinks(user?.profile_links));
    setUsernameStatus('idle');
    setUsernameStatusMessage('');
  }, [user?.display_name, user?.username, user?.avatar_url, user?.profile_bio, user?.profile_location, user?.profile_links]);

  const originalDisplayName = user?.display_name ?? '';
  const originalUsername = user?.username ?? '';
  const originalAvatarUrl = user?.avatar_url ?? '';
  const trimmedDisplayName = displayName.trim();
  const trimmedUsername = username.trim();
  const trimmedAvatarUrl = avatarUrl.trim();
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
    trimmedAvatarUrl !== originalAvatarUrl ||
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

      if (trimmedAvatarUrl !== originalAvatarUrl) {
        payload.avatar_url = trimmedAvatarUrl || null;
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

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card className="p-6 border-purple-100 bg-white">
        <h3 className="text-slate-900 mb-6">Profile Information</h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-2 cursor-pointer hover:bg-purple-700 transition-colors">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e: { target: { files: FileList | null; value: string } }) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Image size must be less than 5MB');
                    return;
                  }

                  setIsUploadingAvatar(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000/api';
                    const token = apiClient.getToken();
                    const response = await fetch(`${API_BASE_URL}/v1/upload`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                      body: formData,
                    });

                    const data = await response.json();
                    if (response.ok && data.data?.url) {
                      setAvatarUrl(data.data.url);
                      // Immediately save the avatar_url to the profile
                      try {
                        const saveResponse = await apiClient.request('/v1/profile', {
                          method: 'PATCH',
                          body: { avatar_url: data.data.url } as any,
                        });
                        if (saveResponse.ok) {
                          await refreshUser();
                          toast.success('Profile image uploaded and saved successfully');
                        } else {
                          toast.error('Image uploaded but failed to save. Please try saving again.');
                        }
                      } catch (saveError) {
                        console.error('Save avatar error:', saveError);
                        toast.error('Image uploaded but failed to save. Please try saving again.');
                      }
                    } else {
                      toast.error(data.errors?.[0]?.detail || 'Failed to upload image');
                    }
                  } catch (error) {
                    console.error('Avatar upload error:', error);
                    toast.error('Failed to upload image');
                  } finally {
                    setIsUploadingAvatar(false);
                    // Reset input
                    e.target.value = '';
                  }
                }}
                disabled={isUploadingAvatar}
              />
            </label>
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
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
            <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-xl text-purple-700 font-semibold overflow-hidden">
              {trimmedAvatarUrl || originalAvatarUrl ? (
                <img src={trimmedAvatarUrl || originalAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (trimmedDisplayName || trimmedUsername || originalUsername || 'FC')
                  .slice(0, 2)
                  .toUpperCase()
              )}
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
    </div>
  );
}

