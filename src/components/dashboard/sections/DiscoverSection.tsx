import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { apiClient } from '../../../lib/apiClient';
import { Plus, Search } from 'lucide-react';

interface DiscoverUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  verified_creator: boolean;
  default_coin_symbol: string;
  followers_count: number;
  following_count: number;
}

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export function DiscoverSection() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const hasResults = users.length > 0;

  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }

      const response = await apiClient.request<DiscoverUser[]>(`/v1/users${params.toString() ? `?${params.toString()}` : ''}`);

      if (!response.ok) {
        setUsers([]);
        setPagination(null);
        toast.error('Unable to load creators right now.');
        return;
      }

      setUsers(response.data ?? []);

      const paginationMeta = (response.meta?.pagination ?? null) as PaginationMeta | null;
      setPagination(paginationMeta);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers().catch((error) => {
      console.error(error);
      toast.error('Something went wrong.');
    });
  }, [fetchUsers]);

  const handleSearch = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        await fetchUsers(searchTerm.trim());
      } catch (error) {
        console.error(error);
        toast.error('Search failed. Please try again.');
      }
    },
    [fetchUsers, searchTerm],
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
      return `${total} result${total === 1 ? '' : 's'} for “${searchTerm}”.`;
    }

    return `${total} creator${total === 1 ? '' : 's'} rewarding their communities.`;
  }, [pagination, searchTerm]);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-100">
        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search creators by name or username..."
              className="w-full"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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
        <Card className="p-6 border-purple-100">
          <p className="text-slate-600">Loading creators...</p>
        </Card>
      )}

      {!isLoading && !hasResults && (
        <Card className="p-6 border-purple-100 text-center">
          <p className="text-slate-900 font-medium mb-2">No creators found</p>
          <p className="text-slate-600">Try adjusting your search or check back later for new creators.</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="p-6 border-purple-100 hover:shadow-xl transition-shadow">
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
                <p className="text-slate-900">{user.default_coin_symbol}</p>
              </div>
              <div>
                <p className="text-slate-600">Followers</p>
                <p className="text-slate-900">{user.followers_count.toLocaleString()}</p>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled>
              <Plus className="w-4 h-4 mr-2" />
              Follow &amp; Start Earning
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
