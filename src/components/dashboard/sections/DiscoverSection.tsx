import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { apiClient } from '../../../lib/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, UserCheck, UserPlus } from 'lucide-react';

interface DiscoverUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_creator: boolean;
  default_coin_symbol: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export function DiscoverSection() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingFollows, setLoadingFollows] = useState<Record<string, boolean>>({});

  const hasResults = users.length > 0;

  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      console.log('[Discover] fetching users', { search });
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }

      const response = await apiClient.request<DiscoverUser[]>(`/v1/users${params.toString() ? `?${params.toString()}` : ''}`);
      console.log('[Discover] response', response);

      if (!response.ok) {
        setUsers([]);
        setPagination(null);
        toast.error('Unable to load creators right now.');
        return;
      }

      // Backend already excludes current user and includes is_following status
      const usersData = response.data ?? [];
      setUsers(usersData);
      
      // Build following map from API response
      const followingMap: Record<string, boolean> = {};
      usersData.forEach((user) => {
        followingMap[user.id] = user.is_following || false;
      });
      setFollowingMap(followingMap);

      const paginationMeta = (response.meta?.pagination ?? null) as PaginationMeta | null;
      setPagination(paginationMeta);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    const handler = window.setTimeout(() => {
      fetchUsers(trimmed.length > 0 ? trimmed : undefined).catch((error) => {
        console.error('[Discover] search fetch failed', error);
        toast.error('Unable to load creators right now.');
      });
    }, 350);

    return () => {
      window.clearTimeout(handler);
    };
  }, [fetchUsers, searchTerm]);

  const handleFollow = useCallback(
    async (userId: string, isFollowing: boolean) => {
      if (loadingFollows[userId]) return;

      setLoadingFollows((prev) => ({ ...prev, [userId]: true }));

      try {
        if (isFollowing) {
          // Unfollow
          const response = await apiClient.request(`/v1/users/${userId}/follow`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Unfollowed successfully');
            setFollowingMap((prev) => ({ ...prev, [userId]: false }));
            setUsers((prev) =>
              prev.map((u) =>
                u.id === userId
                  ? { ...u, is_following: false, followers_count: Math.max(0, u.followers_count - 1) }
                  : u
              )
            );
          } else {
            toast.error(response.errors?.[0]?.detail || 'Failed to unfollow');
          }
        } else {
          // Follow
          const response = await apiClient.request(`/v1/follows`, {
            method: 'POST',
            body: { creator_id: userId } as any,
          });

          if (response.ok) {
            toast.success('Following! You can now earn coins from this creator.');
            setFollowingMap((prev) => ({ ...prev, [userId]: true }));
            setUsers((prev) =>
              prev.map((u) =>
                u.id === userId
                  ? { ...u, is_following: true, followers_count: u.followers_count + 1 }
                  : u
              )
            );
          } else {
            toast.error(response.errors?.[0]?.detail || 'Failed to follow');
          }
        }
      } catch (error) {
        console.error('Error toggling follow:', error);
        toast.error('Something went wrong. Please try again.');
      } finally {
        setLoadingFollows((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [loadingFollows],
  );

  const renderAvatar = useCallback((user: DiscoverUser) => {
    if (user.avatar_url) {
      return <img src={user.avatar_url} alt={user.display_name ?? user.username} className="w-full h-full object-cover" />;
    }

    const initials = (user.display_name || user.username)
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    return <span className="text-2xl text-white font-semibold">{initials}</span>;
  }, []);

  const summaryText = useMemo(() => {
    if (!pagination) return null;

    const { total } = pagination;
    if (total === 0) {
      return 'No creators found yet.';
    }

    if (searchTerm) {
      return `${total} result${total === 1 ? '' : 's'} for "${searchTerm}".`;
    }

    return `${total} creator${total === 1 ? '' : 's'} rewarding their communities.`;
  }, [pagination, searchTerm]);

  const openProfile = useCallback(
    (username: string) => {
      if (!username) return;
      navigate(`/${username}`);
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-100 bg-white">
        <form
          onSubmit={(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            event: any,
          ) => {
            event.preventDefault();
            fetchUsers(searchTerm.trim()).catch((error) => {
              console.error('[Discover] manual search failed', error);
              toast.error('Search failed. Please try again.');
            });
          }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="flex-1">
            <Input
              placeholder="Search creators by name or username..."
              className="w-full"
              value={searchTerm}
              onChange={(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                event: any,
              ) => setSearchTerm(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading}
          >
            <Search className="w-5 h-5" />
          </Button>
        </form>
        {summaryText && <p className="text-sm text-slate-500">{summaryText}</p>}
      </Card>

      {isLoading && (
        <Card className="p-6 border-purple-100 bg-white">
          <p className="text-slate-600">Loading creators...</p>
        </Card>
      )}

      {!isLoading && !hasResults && (
        <Card className="p-6 border-purple-100 bg-white text-center">
          <p className="text-slate-900 font-medium mb-2">No creators found</p>
          <p className="text-slate-600">Try adjusting your search or check back later for new creators.</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const isFollowing = followingMap[user.id] || user.is_following || false;
          const isLoadingFollow = loadingFollows[user.id] || false;

          return (
            <Card
              key={user.id}
              className="p-6 border-purple-100 bg-white hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => openProfile(user.username)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden">
                  {renderAvatar(user)}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{user.display_name ?? user.username}</p>
                  <p className="text-slate-500">@{user.username}</p>
                  <Badge variant="outline" className="mt-1">
                    {user.verified_creator ? 'Verified Creator' : 'Community Member'}
                  </Badge>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {user.verified_creator ? 'Active' : 'Growing'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-600">Coin</p>
                  <p className="text-slate-900">{user.default_coin_symbol || 'FCN'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Followers</p>
                  <p className="text-slate-900">{user.followers_count.toLocaleString()}</p>
                </div>
              </div>

              <Button
                className={`w-full ${
                  isFollowing
                    ? 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  handleFollow(user.id, isFollowing);
                }}
                disabled={isLoadingFollow || user.id === currentUser?.id}
              >
                {isLoadingFollow ? (
                  <>Loading...</>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="font-medium">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2 text-white" />
                    <span>Follow &amp; Start Earning</span>
                  </>
                )}
              </Button>
              <button
                type="button"
                className="mt-3 text-sm text-purple-600 hover:underline"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  openProfile(user.username);
                }}
              >
                View profile
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
