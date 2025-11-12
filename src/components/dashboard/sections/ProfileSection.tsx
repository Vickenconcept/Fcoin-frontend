import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Facebook, Info, Instagram, Loader2, Youtube } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { FacebookPagesManager } from './FacebookPagesManager';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';

const SOCIAL_PROVIDERS = [
  {
    provider: 'facebook',
    platform: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-100 text-blue-600',
    connectLabel: 'Connect Facebook',
  },
  {
    provider: 'instagram',
    platform: 'Instagram',
    icon: Instagram,
    color: 'bg-pink-100 text-pink-600',
    connectLabel: 'Connect Instagram',
  },
  {
    provider: 'youtube',
    platform: 'YouTube',
    icon: Youtube,
    color: 'bg-red-100 text-red-600',
    connectLabel: 'Coming Soon',
  },
  {
    provider: 'tiktok',
    platform: 'TikTok',
    icon: null,
    color: 'bg-slate-100 text-slate-600',
    connectLabel: 'Coming Soon',
  },
];

type TextChangeEvent = { target: { value: string } };

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const {
    accountsMap,
    isLoading,
    isConnecting,
    pendingRecovery,
    isRecovering,
    recoverFacebookProfile,
    dismissRecovery,
    connectFacebookProfile,
    connectFacebookPages,
    connectInstagram,
    disconnect,
  } = useSocialAccounts();
  const [isFacebookManagerOpen, setIsFacebookManagerOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'self' | 'unavailable' | 'error'>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string>('');

  useEffect(() => {
    setDisplayName(user?.display_name ?? '');
    setUsername(user?.username ?? '');
    setUsernameStatus('idle');
    setUsernameStatusMessage('');
  }, [user?.display_name, user?.username]);

  const originalDisplayName = user?.display_name ?? '';
  const originalUsername = user?.username ?? '';
  const trimmedDisplayName = displayName.trim();
  const trimmedUsername = username.trim();
  const hasProfileChanges =
    trimmedDisplayName !== originalDisplayName || trimmedUsername !== originalUsername;

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
    const payload: Record<string, string | null> = {};

      if (trimmedDisplayName !== originalDisplayName) {
        payload.display_name = trimmedDisplayName || null;
      }

      if (trimmedUsername !== originalUsername) {
        payload.username = trimmedUsername;
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

  const providers = useMemo(() => SOCIAL_PROVIDERS, []);

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
      <Card className="p-6 border-purple-100">
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

      {/* Connected Social Accounts */}
      <Card className="p-6 border-purple-100">
        <h3 className="text-slate-900 mb-6">Connected Social Accounts</h3>
        <p className="text-slate-600 mb-6">
          Connect your social media accounts to track engagement and reward your followers.
        </p>
        <div className="space-y-4">
          {providers.map((provider) => {
            const account = accountsMap[provider.provider];
            const isConnected = Boolean(account);
            const Icon = provider.icon;

            return (
              <Card key={provider.provider} className="p-4 border-purple-100">
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
                          {account.provider_username ?? account.provider_user_id ?? 'Connected'}
                        </p>
                      ) : (
                        <p className="text-slate-500">Not connected</p>
                      )}
                    </div>
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                      {provider.provider === 'facebook' && (
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
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnect(provider.provider).catch(() => {})}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : provider.provider === 'facebook' ? (
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
                      <p className="text-xs text-slate-500">
                        Profile connects let us recognise your engagement. Grant Page access when you’re ready to
                        track posts and reward fans.
                      </p>
                    </div>
                  ) : provider.provider === 'instagram' ? (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={isLoading || isConnecting}
                      onClick={() => connectInstagram().catch(() => {})}
                    >
                      {isConnecting ? 'Connecting…' : provider.connectLabel}
                    </Button>
                  ) : (
                    <Badge className="bg-slate-200 text-slate-500 border-slate-300">Coming Soon</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
      <FacebookPagesManager
        open={isFacebookManagerOpen}
        onOpenChange={setIsFacebookManagerOpen}
      />
    </div>
  );
}

