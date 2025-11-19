import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedMediaGrid } from '@/components/dashboard/FeedMediaGrid';
import { MentionText } from '@/components/dashboard/MentionText';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import type { FeedPost } from '@/components/dashboard/hooks/useFeed';
import { ArrowLeft, CheckCircle2, Users, Users2, Globe, Users as UsersIcon, Lock, Trash2, Coins } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

type ProfileData = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_creator: boolean;
  default_coin_symbol: string | null;
  user_type?: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  reward_posts_count: number;
  reward_pool_total: number;
  joined_at?: string | null;
  is_current_user: boolean;
  is_following: boolean;
  coins: Array<{
    symbol: string;
    name: string | null;
    description: string | null;
  }>;
  recent_posts: FeedPost[];
};

const RESERVED_USERNAMES = new Set([
  '',
  'auth',
  'dashboard',
  'admin',
  'assets',
  'profile',
  'u',
  'api',
  'login',
]);

export default function UserProfilePage() {
  const { username = '' } = useParams<{ username: string }>();
  const cleanedUsername = username.toLowerCase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [postUpdating, setPostUpdating] = useState<Record<string, boolean>>({});
  const [postDeleting, setPostDeleting] = useState<Record<string, boolean>>({});
  const [rewardToggleLoading, setRewardToggleLoading] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.request<ProfileData>(`/v1/profiles/${username}`);
      if (response.ok && response.data) {
        setProfile(response.data);
      } else {
        setError(response.errors?.[0]?.detail || 'Unable to load profile');
        setProfile(null);
      }
    } catch (err) {
      console.error('[Profile] fetch error', err);
      setError('Unable to load profile right now.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const formatTime = useCallback((dateString?: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (!profile || profile.is_current_user) return;
    setIsFollowLoading(true);
    try {
      if (profile.is_following) {
        const response = await apiClient.request(`/v1/users/${profile.id}/follow`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail || 'Failed to unfollow');
          return;
        }
        setProfile({
          ...profile,
          is_following: false,
          followers_count: Math.max(0, profile.followers_count - 1),
        });
      } else {
        const response = await apiClient.request('/v1/follows', {
          method: 'POST',
          body: { creator_id: profile.id } as any,
        });
        if (!response.ok) {
          toast.error(response.errors?.[0]?.detail || 'Failed to follow');
          return;
        }
        setProfile({
          ...profile,
          is_following: true,
          followers_count: profile.followers_count + 1,
        });
        toast.success('Following! You will now see their posts first.');
      }
    } catch (err) {
      console.error('[Profile] follow toggle error', err);
      toast.error('Unable to update follow status. Try again.');
    } finally {
      setIsFollowLoading(false);
    }
  }, [profile]);

  const updateLocalPost = useCallback((updatedPost: FeedPost) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recent_posts: prev.recent_posts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        ),
      };
    });
  }, []);

  const removeLocalPost = useCallback((postId: string, wasRewarded: boolean, rewardPool: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts_count: Math.max(0, prev.posts_count - 1),
        reward_posts_count: wasRewarded ? Math.max(0, prev.reward_posts_count - 1) : prev.reward_posts_count,
        reward_pool_total: wasRewarded ? Math.max(0, prev.reward_pool_total - rewardPool) : prev.reward_pool_total,
        recent_posts: prev.recent_posts.filter((post) => post.id !== postId),
      };
    });
  }, []);

  const handlePostUpdate = useCallback(
    async (postId: string, data: Partial<Pick<FeedPost, 'content' | 'visibility' | 'reward_enabled' | 'reward_rule' | 'reward_coin_symbol' | 'reward_pool'>>) => {
      setPostUpdating((prev) => ({ ...prev, [postId]: true }));
      try {
        const response = await apiClient.request<FeedPost>(`/v1/feed/posts/${postId}`, {
          method: 'PUT',
          body: data as any,
        });

        if (response.ok && response.data) {
          updateLocalPost(response.data);
          toast.success('Post updated');
        } else {
          toast.error(response.errors?.[0]?.detail || 'Failed to update post');
        }
      } catch (error) {
        console.error('[Profile] update post error', error);
        toast.error('Failed to update post');
      } finally {
        setPostUpdating((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }
    },
    [updateLocalPost],
  );

  const handleDisableRewards = useCallback(
    async (post: FeedPost) => {
      setRewardToggleLoading(post.id);
      await handlePostUpdate(post.id, { reward_enabled: false });
      setRewardToggleLoading(null);
    },
    [handlePostUpdate],
  );

  const handleDeletePost = useCallback(
    async (post: FeedPost) => {
      if (!window.confirm('Delete this post permanently?')) {
        return;
      }

      setPostDeleting((prev) => ({ ...prev, [post.id]: true }));
      try {
        const response = await apiClient.request(`/v1/feed/posts/${post.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          removeLocalPost(post.id, post.reward_enabled, post.reward_pool || 0);
          toast.success('Post deleted');
        } else {
          toast.error(response.errors?.[0]?.detail || 'Failed to delete post');
        }
      } catch (error) {
        console.error('[Profile] delete post error', error);
        toast.error('Failed to delete post');
      } finally {
        setPostDeleting((prev) => {
          const next = { ...prev };
          delete next[post.id];
          return next;
        });
      }
    },
    [removeLocalPost],
  );

  const goBack = useCallback(() => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard/feed');
    }
  }, [navigate]);

  const openProfile = useCallback(
    (targetUsername: string) => {
      if (!targetUsername) return;
      navigate(`/${targetUsername}`);
    },
    [navigate],
  );

  const stats = useMemo(() => {
    if (!profile) return [];
    return [
      {
        label: 'Followers',
        value: profile.followers_count.toLocaleString(),
        icon: Users,
      },
      {
        label: 'Following',
        value: profile.following_count.toLocaleString(),
        icon: Users2,
      },
      {
        label: 'Posts',
        value: profile.posts_count.toLocaleString(),
        icon: CheckCircle2,
      },
    ];
  }, [profile]);

  if (RESERVED_USERNAMES.has(cleanedUsername)) {
    return <Navigate to="/dashboard/feed" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-8 bg-white border-red-100 text-center">
            <p className="text-red-600 font-medium mb-2">Unable to load profile</p>
            <p className="text-slate-500 mb-4">{error}</p>
            <Button onClick={fetchProfile}>Try again</Button>
          </Card>
        )}

        {!isLoading && profile && (
          <>
            <Card className="p-6 bg-white border-purple-100 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={profile.avatar_url || undefined}
                      alt={profile.display_name || profile.username}
                    />
                    <AvatarFallback>
                      {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-semibold text-slate-900">
                        {profile.display_name || profile.username}
                      </h1>
                      {profile.verified_creator && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          Verified creator
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-500">@{profile.username}</p>
                    <p className="text-sm text-slate-500">
                      Joined {formatTime(profile.joined_at)}
                    </p>
                    <div className="mt-2 text-sm text-slate-600">
                      Default coin:{' '}
                      <span className="font-semibold text-slate-900">
                        {profile.default_coin_symbol || 'FCN'}
                      </span>
                    </div>
                  </div>
                </div>
                {!profile.is_current_user && (
                  <div className="flex gap-3">
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[160px]"
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading
                        ? 'Please wait...'
                        : profile.is_following
                        ? 'Following'
                        : 'Follow & earn'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="p-5 bg-white border-purple-100 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {profile.coins.length > 0 && (
              <Card className="p-6 bg-white border-purple-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Coins</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.coins.map((coin) => (
                    <div
                      key={coin.symbol}
                      className="border border-purple-50 rounded-xl p-4 bg-gradient-to-br from-white to-purple-50/40"
                    >
                      <p className="text-sm text-slate-500">Symbol</p>
                      <p className="text-xl font-semibold text-slate-900">{coin.symbol}</p>
                      {coin.name && (
                        <>
                          <p className="text-sm text-slate-500 mt-2">Name</p>
                          <p className="text-slate-800">{coin.name}</p>
                        </>
                      )}
                      {coin.description && (
                        <>
                          <p className="text-sm text-slate-500 mt-2">About</p>
                          <p className="text-slate-700 text-sm">{coin.description}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white border-purple-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent posts
                  </h2>
                  <p className="text-sm text-slate-500">
                    {profile.posts_count > 0
                      ? `${profile.posts_count} total · ${profile.reward_posts_count} with rewards · ${profile.reward_pool_total.toLocaleString()} coins funded`
                      : 'No posts yet'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/feed')}
                  className="text-slate-600"
                >
                  Go to feed
                </Button>
              </div>

              {profile.recent_posts.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  This creator has not posted anything yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.recent_posts.map((post) => {
                    const isOwner = profile.is_current_user;
                    const isUpdating = !!postUpdating[post.id];
                    const isDeleting = !!postDeleting[post.id];
                    const isRewardDisabling = rewardToggleLoading === post.id;

                    return (
                      <Card key={post.id} className="p-5 border-slate-100 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar
                          className="cursor-pointer"
                          onClick={() => openProfile(post.user.username)}
                        >
                          <AvatarImage
                            src={post.user.avatar_url || undefined}
                            alt={post.user.display_name || post.user.username}
                          />
                          <AvatarFallback>
                            {(post.user.display_name || post.user.username)
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="font-semibold text-slate-900 hover:underline text-left"
                            onClick={() => openProfile(post.user.username)}
                            >
                              {post.user.display_name || post.user.username}
                            </button>
                            {post.user.verified_creator && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {post.content && (
                        <div className="text-slate-800 mb-3 whitespace-pre-wrap">
                          <MentionText text={post.content} />
                        </div>
                      )}

                      {post.media.length > 0 && (
                        <FeedMediaGrid
                          media={post.media}
                          onOpen={() => navigate(`/dashboard/feed?post=${post.id}`)}
                        />
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>🔁 {post.shares_count}</span>
                        {post.reward_enabled && (
                          <Badge className="bg-orange-50 text-orange-600 border-orange-200 ml-auto">
                            Rewarding {post.reward_pool} {post.reward_coin_symbol ?? 'coins'}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/feed?post=${post.id}`)}
                        >
                          Open in feed
                        </Button>
                      </div>
                      {isOwner && (
                        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-sm text-slate-500">Visibility</div>
                            <Select
                              value={post.visibility}
                              onValueChange={(value: 'public' | 'followers' | 'private') =>
                                handlePostUpdate(post.id, { visibility: value })
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    <span>Public</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="followers">
                                  <div className="flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4" />
                                    <span>Followers</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="private">
                                  <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    <span>Private</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {post.reward_enabled && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisableRewards(post)}
                                disabled={isRewardDisabling || isUpdating}
                                className="flex items-center gap-2"
                              >
                                <Coins className="w-4 h-4" />
                                {isRewardDisabling ? 'Disabling...' : 'Disable rewards'}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePost(post)}
                              disabled={isDeleting}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

