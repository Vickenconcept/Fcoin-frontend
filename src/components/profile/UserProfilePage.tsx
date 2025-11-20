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
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  Users2,
  Globe,
  Users as UsersIcon,
  Lock,
  Trash2,
  Coins,
  MapPin,
  Link2,
  Share2,
  Copy,
  QrCode,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

type ProfileData = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_creator: boolean;
  default_coin_symbol: string | null;
  user_type?: string | null;
  profile_bio?: string | null;
  profile_location?: string | null;
  profile_links?: Array<{ label: string; url: string }> | null;
  profile_url?: string | null;
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
  posts_pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

type FollowEntry = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_creator: boolean;
  default_coin_symbol: string | null;
  is_following?: boolean;
  followers_count?: number;
};

type FilterType = 'all' | 'rewards' | 'media';

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
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [postsPage, setPostsPage] = useState(1);
  const [postsPagination, setPostsPagination] = useState<ProfileData['posts_pagination'] | null>(null);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState<FollowEntry[]>([]);
  const [followingList, setFollowingList] = useState<FollowEntry[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followersLoadingMore, setFollowersLoadingMore] = useState(false);
  const [followingLoadingMore, setFollowingLoadingMore] = useState(false);
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [followersHasMore, setFollowersHasMore] = useState(true);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const [followActionLoading, setFollowActionLoading] = useState<Record<string, boolean>>({});
  const [enableRewardsModalPost, setEnableRewardsModalPost] = useState<FeedPost | null>(null);
  const [walletCoins, setWalletCoins] = useState<Array<{ coin_symbol: string; balance: number }>>([]);
  const [isWalletCoinsLoading, setIsWalletCoinsLoading] = useState(false);
  const [walletCoinsError, setWalletCoinsError] = useState<string | null>(null);
  const [enableRewardsForm, setEnableRewardsForm] = useState({
    reward_pool: 0,
    reward_coin_symbol: (user?.default_coin_symbol ?? 'FCN').toUpperCase(),
    like: 1,
    comment: 2,
    share: 3,
    per_user_cap: 10,
  });

  const fetchProfile = useCallback(
    async (options?: { filter?: FilterType; page?: number }) => {
      if (!username) return;

      const targetFilter = options?.filter ?? activeFilter;
      const targetPage = options?.page ?? 1;
      const isInitialLoad = targetPage === 1;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsPostsLoading(true);
      }

      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('filter', targetFilter);
        params.set('page', String(targetPage));
        params.set('per_page', '5');

        const response = await apiClient.request<ProfileData>(
          `/v1/profiles/${username}?${params.toString()}`,
        );

        if (response.ok && response.data) {
          const payload = response.data;

          setProfile((prev) => {
            const incomingPosts = payload.recent_posts ?? [];
            const mergedPosts =
              targetPage === 1 || !prev
                ? incomingPosts
                : [
                    ...prev.recent_posts,
                    ...incomingPosts.filter(
                      (incoming) => !prev.recent_posts.some((existing) => existing.id === incoming.id),
                    ),
                  ];

            return {
              ...payload,
              recent_posts: mergedPosts,
            };
          });

          setPostsPagination(payload.posts_pagination ?? null);
          setPostsPage(targetPage);
        } else {
          setError(response.errors?.[0]?.detail || 'Unable to load profile');
          if (targetPage === 1) {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('[Profile] fetch error', err);
        setError('Unable to load profile right now.');
        if (targetPage === 1) {
          setProfile(null);
        }
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        } else {
          setIsPostsLoading(false);
        }
      }
    },
    [username, activeFilter],
  );

  useEffect(() => {
    fetchProfile({ filter: activeFilter, page: 1 }).catch(() => null);
  }, [fetchProfile, activeFilter]);

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

  const handleFilterChange = useCallback(
    (nextFilter: FilterType) => {
      if (nextFilter === activeFilter) return;
      setActiveFilter(nextFilter);
      setPostsPage(1);
    },
    [activeFilter],
  );

  const handleLoadMorePosts = useCallback(() => {
    if (isPostsLoading || !postsPagination) return;
    if (postsPagination.current_page >= postsPagination.last_page) return;
    const nextPage = postsPagination.current_page + 1;
    fetchProfile({ filter: activeFilter, page: nextPage }).catch(() => null);
  }, [postsPagination, isPostsLoading, fetchProfile, activeFilter]);

  const fetchWalletCoins = useCallback(async () => {
    setIsWalletCoinsLoading(true);
    setWalletCoinsError(null);
    try {
      const response = await apiClient.request<{
        coin_balances?: Array<{ coin_symbol?: string; balance?: number }>;
      }>('/v1/wallets/me', { method: 'GET' });

      if (response.ok && response.data) {
        const balances = Array.isArray(response.data.coin_balances)
          ? response.data.coin_balances
              .map((coin) => ({
                coin_symbol: String(coin.coin_symbol ?? '').toUpperCase(),
                balance: Number(coin.balance ?? 0) || 0,
              }))
              .filter((coin) => coin.coin_symbol)
          : [];

        setWalletCoins(balances);

        if (balances.length > 0) {
          setEnableRewardsForm((prev) => {
            const hasCurrent = balances.some((coin) => coin.coin_symbol === prev.reward_coin_symbol);
            return {
              ...prev,
              reward_coin_symbol: hasCurrent ? prev.reward_coin_symbol : balances[0].coin_symbol,
            };
          });
        }
      } else {
        setWalletCoinsError(response.errors?.[0]?.detail || 'Failed to load wallet coins');
      }
    } catch (error) {
      console.error('[Profile] wallet coins error', error);
      setWalletCoinsError('Failed to load wallet coins');
    } finally {
      setIsWalletCoinsLoading(false);
    }
  }, []);

  const fetchFollowList = useCallback(
    async (
      type: 'followers' | 'following',
      options: { page?: number; append?: boolean } = {},
    ) => {
      if (!profile) return;
      const userId = profile.id;
      const page = options.page ?? 1;
      const append = options.append ?? page > 1;
      const setList = type === 'followers' ? setFollowersList : setFollowingList;
      const setLoading = type === 'followers' ? setFollowersLoading : setFollowingLoading;
      const setLoadingMore =
        type === 'followers' ? setFollowersLoadingMore : setFollowingLoadingMore;
      const setPage = type === 'followers' ? setFollowersPage : setFollowingPage;
      const setHasMore =
        type === 'followers' ? setFollowersHasMore : setFollowingHasMore;

      if (page === 1 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await apiClient.request<FollowEntry[]>(
          `/v1/users/${userId}/${type}?per_page=25&page=${page}`,
        );

        if (response.ok && Array.isArray(response.data)) {
          setList((prev) => (append ? [...prev, ...response.data!] : response.data!));
          setPage(page);

          const pagination = response.meta?.pagination as
            | { current_page?: number; last_page?: number }
            | undefined;
          if (pagination?.current_page && pagination?.last_page) {
            setHasMore(pagination.current_page < pagination.last_page);
          } else {
            setHasMore(response.data.length > 0);
          }
        } else {
          toast.error('Unable to load list right now.');
        }
      } catch (error) {
        console.error(`[Profile] load ${type} error`, error);
        toast.error('Unable to load list right now.');
      } finally {
        if (page === 1 && !append) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [profile],
  );

  const handleFollowFromDirectory = useCallback(
    async (targetUserId: string, currentlyFollowing: boolean) => {
      if (followActionLoading[targetUserId]) return;

      setFollowActionLoading((prev) => ({ ...prev, [targetUserId]: true }));
      try {
        if (currentlyFollowing) {
          const response = await apiClient.request(`/v1/users/${targetUserId}/follow`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            toast.error(response.errors?.[0]?.detail || 'Failed to unfollow');
            return;
          }
          toast.success('Unfollowed');
        } else {
          const response = await apiClient.request('/v1/follows', {
            method: 'POST',
            body: { creator_id: targetUserId } as any,
          });
          if (!response.ok) {
            toast.error(response.errors?.[0]?.detail || 'Failed to follow');
            return;
          }
          toast.success('Following');
        }

        setFollowersList((prev) =>
          prev.map((entry) =>
            entry.id === targetUserId ? { ...entry, is_following: !currentlyFollowing } : entry,
          ),
        );
        setFollowingList((prev) =>
          prev.map((entry) =>
            entry.id === targetUserId ? { ...entry, is_following: !currentlyFollowing } : entry,
          ),
        );

        if (profile && targetUserId === profile.id) {
          setProfile({
            ...profile,
            is_following: !currentlyFollowing,
            followers_count: Math.max(
              0,
              profile.followers_count + (currentlyFollowing ? -1 : 1),
            ),
          });
        }
      } catch (error) {
        console.error('[Profile] follow directory error', error);
        toast.error('Unable to update follow status.');
      } finally {
        setFollowActionLoading((prev) => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      }
    },
    [followActionLoading, profile],
  );

  const openEnableRewardsModal = useCallback(
    (post: FeedPost) => {
      setEnableRewardsModalPost(post);
      setEnableRewardsForm((prev) => ({
        reward_pool: Math.max(post.reward_pool || 0, 10),
        reward_coin_symbol: (post.reward_coin_symbol ?? prev.reward_coin_symbol ?? (user?.default_coin_symbol ?? 'FCN')).toUpperCase(),
        like: post.reward_rule?.like ?? prev.like ?? 1,
        comment: post.reward_rule?.comment ?? prev.comment ?? 2,
        share: post.reward_rule?.share ?? prev.share ?? 3,
        per_user_cap: post.reward_rule?.per_user_cap ?? prev.per_user_cap ?? 10,
      }));
      fetchWalletCoins().catch(() => null);
    },
    [fetchWalletCoins, user?.default_coin_symbol],
  );

  const closeEnableRewardsModal = useCallback(() => {
    setEnableRewardsModalPost(null);
  }, []);

  const handleEnableRewardsSubmit = useCallback(async () => {
    if (!enableRewardsModalPost) return;

    if (enableRewardsForm.reward_pool <= 0) {
      toast.error('Reward pool must be greater than zero.');
      return;
    }

    setRewardToggleLoading(enableRewardsModalPost.id);
    try {
      await handlePostUpdate(enableRewardsModalPost.id, {
        reward_enabled: true,
        reward_pool: enableRewardsForm.reward_pool,
        reward_coin_symbol: enableRewardsForm.reward_coin_symbol,
        reward_rule: {
          like: enableRewardsForm.like,
          comment: enableRewardsForm.comment,
          share: enableRewardsForm.share,
          per_user_cap: enableRewardsForm.per_user_cap,
        },
      });
      toast.success('Rewards enabled on this post.');
      setEnableRewardsModalPost(null);
    } catch (error) {
      console.error('[Profile] enable rewards error', error);
      toast.error('Failed to enable rewards.');
    } finally {
      setRewardToggleLoading(null);
    }
  }, [enableRewardsModalPost, enableRewardsForm, handlePostUpdate]);

  const openFollowersDirectory = useCallback(() => {
    if (!profile) return;
    setFollowersModalOpen(true);
    setFollowersPage(1);
    setFollowersHasMore(true);
    fetchFollowList('followers', { page: 1, append: false }).catch(() => null);
  }, [profile, fetchFollowList]);

  const openFollowingDirectory = useCallback(() => {
    if (!profile) return;
    setFollowingModalOpen(true);
    setFollowingPage(1);
    setFollowingHasMore(true);
    fetchFollowList('following', { page: 1, append: false }).catch(() => null);
  }, [profile, fetchFollowList]);

  const closeFollowersDirectory = useCallback(() => setFollowersModalOpen(false), []);
  const closeFollowingDirectory = useCallback(() => setFollowingModalOpen(false), []);

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

  const openProfileFromDirectory = useCallback(
    (targetUsername: string, type: 'followers' | 'following') => {
      if (!targetUsername) return;
      if (type === 'followers') {
        closeFollowersDirectory();
      } else {
        closeFollowingDirectory();
      }
      openProfile(targetUsername);
    },
    [closeFollowersDirectory, closeFollowingDirectory, openProfile],
  );

  const handleLoadMoreFollowers = useCallback(() => {
    if (followersLoadingMore || !followersHasMore) return;
    fetchFollowList('followers', { page: followersPage + 1, append: true }).catch(() => null);
  }, [fetchFollowList, followersHasMore, followersLoadingMore, followersPage]);

  const handleLoadMoreFollowing = useCallback(() => {
    if (followingLoadingMore || !followingHasMore) return;
    fetchFollowList('following', { page: followingPage + 1, append: true }).catch(() => null);
  }, [fetchFollowList, followingHasMore, followingLoadingMore, followingPage]);

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

  const canLoadMore = useMemo(() => {
    if (!postsPagination) return false;
    return postsPagination.current_page < postsPagination.last_page;
  }, [postsPagination]);

  const selectedCoinBalance = useMemo(() => {
    const match = walletCoins.find(
      (coin) => coin.coin_symbol === enableRewardsForm.reward_coin_symbol,
    );
    return match?.balance ?? 0;
  }, [walletCoins, enableRewardsForm.reward_coin_symbol]);

  const canSubmitEnableRewards =
    enableRewardsForm.reward_pool > 0 && selectedCoinBalance >= enableRewardsForm.reward_pool;

  const profileLink = useMemo(() => {
    if (profile?.profile_url) {
      return profile.profile_url;
    }

    if (profile?.username && typeof window !== 'undefined') {
      return `${window.location.origin}/${profile.username}`;
    }

    return profile?.username ? `/${profile.username}` : '';
  }, [profile?.profile_url, profile?.username]);

  const handleCopyProfileLink = useCallback(() => {
    if (!profileLink) return;
    navigator.clipboard.writeText(profileLink).then(
      () => toast.success('Profile link copied!'),
      () => toast.error('Unable to copy link'),
    );
  }, [profileLink]);

  const qrImageUrl = useMemo(() => {
    if (!profileLink) return null;
    return `https://quickchart.io/qr?text=${encodeURIComponent(profileLink)}&size=180&margin=2`;
  }, [profileLink]);

  const handleNativeShare = useCallback(() => {
    if (!profileLink) return;
    if (navigator.share) {
      navigator
        .share({
          title: profile?.display_name ?? profile?.username ?? 'FanCoin profile',
          text: 'Check out this FanCoin creator profile',
          url: profileLink,
        })
        .catch(() => {
          /* ignore */
        });
    } else {
      handleCopyProfileLink();
    }
  }, [profileLink, profile?.display_name, profile?.username, handleCopyProfileLink]);

  const handleSocialShare = useCallback(
    (platform: 'twitter' | 'facebook' | 'whatsapp') => {
      if (!profileLink) return;
      const encoded = encodeURIComponent(profileLink);
      let shareUrl = profileLink;
      if (platform === 'twitter') {
        shareUrl = `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(
          'Follow me on FanCoin',
        )}`;
      } else if (platform === 'facebook') {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
      } else if (platform === 'whatsapp') {
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Follow me on FanCoin: ${profileLink}`,
        )}`;
      }
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    },
    [profileLink],
  );

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
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-500">
                  {profile.profile_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{profile.profile_location}</span>
                    </div>
                  )}
                  <div>
                    Default coin:{' '}
                    <span className="font-semibold text-slate-900">
                      {profile.default_coin_symbol || 'FCN'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={handleCopyProfileLink}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    <Share2 className="w-4 h-4" />
                    Share profile
                  </Button>
                  {!profile.is_current_user && (
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
                  )}
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {stats.map(({ label, value, icon: Icon }) => {
                const isFollowersStat = label === 'Followers';
                const isFollowingStat = label === 'Following';
                const clickHandler = isFollowersStat
                  ? openFollowersDirectory
                  : isFollowingStat
                  ? openFollowingDirectory
                  : undefined;
                return (
                  <Card
                    key={label}
                    className={`p-5 bg-white border-purple-100 flex items-center gap-4 ${
                      clickHandler ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                    }`}
                    onClick={clickHandler}
                    role={clickHandler ? 'button' : undefined}
                    aria-label={clickHandler ? `View ${label.toLowerCase()} list` : undefined}
                  >
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-slate-900">{value}</p>
                      <p className="text-sm text-slate-500">{label}</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 bg-white border-purple-100 flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">Share your profile</h2>
                <p className="text-sm text-slate-500">
                  Copy your link, share to socials, or show a QR code so fans can follow instantly.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleCopyProfileLink} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Copy link
                  </Button>
                  <Button variant="outline" onClick={handleNativeShare} className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Quick share
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('twitter')}
                    className="flex items-center gap-2"
                  >
                    <span className="font-semibold">X</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('facebook')}
                    className="flex items-center gap-2"
                  >
                    <span className="font-semibold">Facebook</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialShare('whatsapp')}
                    className="flex items-center gap-2"
                  >
                    <span className="font-semibold">WhatsApp</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                {qrImageUrl ? (
                  <>
                    <img
                      src={qrImageUrl}
                      alt="Profile QR code"
                      className="w-40 h-40 rounded-xl border border-purple-100 bg-white p-2"
                    />
                    <p className="text-xs text-slate-500">Scan to view profile</p>
                  </>
                ) : (
                  <div className="w-40 h-40 rounded-xl border border-dashed border-purple-200 flex items-center justify-center text-slate-400 text-sm">
                    QR unavailable
                  </div>
                )}
              </div>
            </Card>

            {profile.profile_bio && (
              <Card className="p-6 bg-white border-purple-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
                <p className="text-slate-700 whitespace-pre-wrap">{profile.profile_bio}</p>
              </Card>
            )}

            {profile.profile_links && profile.profile_links.length > 0 && (
              <Card className="p-6 bg-white border-purple-100">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Links</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.profile_links.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm text-purple-700 hover:bg-purple-100"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </Card>
            )}

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
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent posts</h2>
                  <p className="text-sm text-slate-500">
                    {profile.posts_count > 0
                      ? `${profile.posts_count} total · ${profile.reward_posts_count} with rewards · ${profile.reward_pool_total.toLocaleString()} coins funded`
                      : 'No posts yet'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                  <Tabs value={activeFilter} onValueChange={(value: FilterType) => handleFilterChange(value)}>
                    <TabsList className="bg-purple-50">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="rewards">Rewards</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/feed')}
                    className="text-slate-600"
                  >
                    Go to feed
                  </Button>
                </div>
              </div>

              {profile.recent_posts.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  This creator has not posted anything yet.
                </div>
              ) : (
                <>
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
                            {post.reward_enabled ? (
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
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEnableRewardsModal(post)}
                                disabled={isRewardDisabling || isUpdating}
                                className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <Coins className="w-4 h-4" />
                                {isRewardDisabling ? 'Updating...' : 'Enable rewards'}
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
                  {isPostsLoading && (
                    <div className="text-center text-sm text-slate-500 py-2">Loading posts…</div>
                  )}
                  {canLoadMore && (
                    <div className="pt-2 flex justify-center">
                      <Button variant="outline" onClick={handleLoadMorePosts} disabled={isPostsLoading}>
                        {isPostsLoading ? 'Loading…' : 'Load more posts'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </div>

      <Dialog
        open={followersModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeFollowersDirectory();
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
            <DialogDescription>People who follow this creator.</DialogDescription>
          </DialogHeader>
          {followersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : followersList.length === 0 ? (
            <p className="text-sm text-slate-500">No followers yet.</p>
          ) : (
            <ScrollArea className="max-h-[360px] pr-4">
              <div className="space-y-3">
                {followersList.map((entry) => {
                  const isFollowingEntry = entry.is_following ?? false;
                  const isSelf = entry.id === user?.id;
                  const isActionLoading = followActionLoading[entry.id];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-purple-50 bg-white px-3 py-2"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-3 flex-1 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 rounded-md"
                        onClick={() => openProfileFromDirectory(entry.username, 'followers')}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {(entry.display_name || entry.username).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.display_name || entry.username}
                          </p>
                          <p className="text-xs text-slate-500">@{entry.username}</p>
                        </div>
                      </button>
                      {!isSelf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollowFromDirectory(entry.id, isFollowingEntry)}
                          disabled={isActionLoading}
                          className="flex items-center gap-2"
                        >
                          {isActionLoading ? (
                            'Please wait...'
                          ) : isFollowingEntry ? (
                            <>
                              <UserMinus className="w-4 h-4" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
                {followersHasMore && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreFollowers}
                    disabled={followersLoadingMore}
                    className="w-full"
                  >
                    {followersLoadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={followingModalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeFollowingDirectory();
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
            <DialogDescription>Creators this user is following.</DialogDescription>
          </DialogHeader>
          {followingLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : followingList.length === 0 ? (
            <p className="text-sm text-slate-500">Not following anyone yet.</p>
          ) : (
            <ScrollArea className="max-h-[360px] pr-4">
              <div className="space-y-3">
                {followingList.map((entry) => {
                  const isFollowingEntry = entry.is_following ?? true;
                  const isSelf = entry.id === user?.id;
                  const isActionLoading = followActionLoading[entry.id];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-purple-50 bg-white px-3 py-2"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-3 flex-1 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 rounded-md"
                        onClick={() => openProfileFromDirectory(entry.username, 'following')}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback>
                            {(entry.display_name || entry.username).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {entry.display_name || entry.username}
                          </p>
                          <p className="text-xs text-slate-500">@{entry.username}</p>
                        </div>
                      </button>
                      {!isSelf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollowFromDirectory(entry.id, isFollowingEntry)}
                          disabled={isActionLoading}
                          className="flex items-center gap-2"
                        >
                          {isActionLoading ? (
                            'Please wait...'
                          ) : isFollowingEntry ? (
                            <>
                              <UserMinus className="w-4 h-4" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
                {followingHasMore && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreFollowing}
                    disabled={followingLoadingMore}
                    className="w-full"
                  >
                    {followingLoadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(enableRewardsModalPost)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            closeEnableRewardsModal();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enable rewards</DialogTitle>
            <DialogDescription>
              Re-launch the reward pool for this post. Fans will see the new amounts immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Reward coin</label>
              <Select
                value={enableRewardsForm.reward_coin_symbol}
                onValueChange={(value: string) =>
                  setEnableRewardsForm((prev) => ({ ...prev, reward_coin_symbol: value }))
                }
                disabled={isWalletCoinsLoading || walletCoins.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a coin" />
                </SelectTrigger>
                <SelectContent>
                  {walletCoins.length === 0 ? (
                    <SelectItem value="no-coins" disabled>
                      No creator coins yet
                    </SelectItem>
                  ) : (
                    walletCoins.map((coin) => (
                      <SelectItem key={coin.coin_symbol} value={coin.coin_symbol}>
                        <div className="flex items-center justify-between w-full">
                          <span>{coin.coin_symbol}</span>
                          <span className="text-xs text-slate-500">
                            Balance: {coin.balance.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {walletCoinsError && (
                <p className="text-xs text-red-500 mt-1">{walletCoinsError}</p>
              )}
              {!isWalletCoinsLoading && walletCoins.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Launch a coin to fund reward pools from your wallet.
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Reward pool</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={enableRewardsForm.reward_pool}
                  onChange={(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    event: any,
                  ) =>
                    setEnableRewardsForm((prev) => ({
                      ...prev,
                      reward_pool: Number(event.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Balance available: {selectedCoinBalance.toFixed(2)}{' '}
                  {enableRewardsForm.reward_coin_symbol}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max per user</label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={enableRewardsForm.per_user_cap}
                  onChange={(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    event: any,
                  ) =>
                    setEnableRewardsForm((prev) => ({
                      ...prev,
                      per_user_cap: Number(event.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Per-action rewards</label>
              <div className="grid md:grid-cols-3 gap-3 mt-2">
                {(['like', 'comment', 'share'] as Array<'like' | 'comment' | 'share'>).map(
                  (field) => (
                    <div key={field}>
                      <p className="text-xs text-slate-500 capitalize">{field}</p>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={enableRewardsForm[field]}
                        onChange={(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          event: any,
                        ) =>
                          setEnableRewardsForm((prev) => ({
                            ...prev,
                            [field]: Number(event.target.value) || 0,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Fans can earn up to {enableRewardsForm.per_user_cap} {enableRewardsForm.reward_coin_symbol} per
                post.
              </span>
              <span>
                Pool remaining: {(selectedCoinBalance - enableRewardsForm.reward_pool).toFixed(2)}{' '}
                {enableRewardsForm.reward_coin_symbol}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={closeEnableRewardsModal}>
              Cancel
            </Button>
            <Button
              onClick={handleEnableRewardsSubmit}
              disabled={!canSubmitEnableRewards || isWalletCoinsLoading || !enableRewardsModalPost}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {rewardToggleLoading === enableRewardsModalPost?.id ? 'Saving...' : 'Enable rewards'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

