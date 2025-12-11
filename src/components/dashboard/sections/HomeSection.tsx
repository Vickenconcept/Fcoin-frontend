import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  Coins,
  Gift,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
  Target,
  Users,
} from 'lucide-react';
import type { RecentEngagement } from '../hooks/useRecentEngagements';

type EarnedCoinEntry = {
  id: string;
  coinSymbol: string;
  displayAmount: string;
  amount: number;
  creatorName: string;
  createdAt: string | null;
};

type HomeSectionProps = {
  poolBalanceDisplay: string;
  walletCurrency: string;
  followerCountDisplay: string;
  earnedCoinsDisplay: string;
  followingCountDisplay: string;
  recentEngagements: RecentEngagement[];
  isRecentEngagementsLoading: boolean;
  earnedCoinEntries: EarnedCoinEntry[];
  isEarnedCoinsLoading: boolean;
  onNavigate: (tab: 'discover' | 'my-coin' | 'wallet' | 'profile') => void;
  onOpenAllocateModal: () => void;
  onRefreshEngagements?: () => void;
  onRefreshEarnings?: () => void;
};

const humanizeEngagementType = (type: string): string => {
  const normalized = type.toUpperCase();
  switch (normalized) {
    case 'COMMENT':
      return 'commented';
    case 'LIKE':
      return 'liked';
    case 'SHARE':
      return 'shared';
    case 'FOLLOW':
      return 'followed';
    default:
      return normalized.toLowerCase();
  }
};

const capitalize = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const formatTimeAgo = (isoDate: string | null): string => {
  if (!isoDate) {
    return 'just now';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const rtf =
    typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat !== 'undefined'
      ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      : null;

  if (rtf) {
    for (const [unit, secondsInUnit] of units) {
      if (absSeconds >= secondsInUnit || unit === 'second') {
        const value = Math.round(diffSeconds / secondsInUnit);
        return rtf.format(value, unit);
      }
    }
  }

  return date.toLocaleString();
};

export function HomeSection({
  poolBalanceDisplay,
  walletCurrency,
  followerCountDisplay,
  earnedCoinsDisplay,
  followingCountDisplay,
  recentEngagements,
  isRecentEngagementsLoading,
  earnedCoinEntries,
  isEarnedCoinsLoading,
  onNavigate,
  onOpenAllocateModal,
  onRefreshEngagements,
  onRefreshEarnings,
}: HomeSectionProps) {
  const rewardSourceCount = earnedCoinEntries.length;
  const rewardSourceCopy =
    rewardSourceCount > 0
      ? `From ${rewardSourceCount} ${rewardSourceCount === 1 ? 'creator' : 'creators'}`
      : 'Waiting for your first reward';

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-purple-100 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between mb-2">
            <p>My Coin Pool</p>
            <Coins className="w-5 h-5" />
          </div>
          <p className="mb-1">{poolBalanceDisplay}</p>
          <p className="text-purple-100">{walletCurrency} available</p>
        </Card>

        <Card className="p-6 border-purple-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600">My Followers</p>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-slate-900 mb-1">{followerCountDisplay}</p>
          <p className="text-green-600">+12 this week</p>
        </Card>

        <Card className="p-6 border-purple-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600">Earned Coins</p>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-slate-900 mb-1">{earnedCoinsDisplay}</p>
          <p className="text-slate-500 text-sm">{rewardSourceCopy}</p>
        </Card>

        <Card className="p-6 border-purple-100 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600">Following</p>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-slate-900 mb-1">{followingCountDisplay}</p>
          <p className="text-slate-500">Active creators</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Engagement on My Posts */}
        <Card className="p-6 border-purple-100 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Recent Engagement on My Posts</h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">Live Tracking</Badge>
              {onRefreshEngagements && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-purple-600"
                  onClick={onRefreshEngagements}
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
          {isRecentEngagementsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`engagement-skeleton-${index}`}
                  className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl animate-pulse"
                >
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-purple-200 rounded" />
                    <div className="h-3 w-2/3 bg-purple-100 rounded" />
                    <div className="h-3 w-1/4 bg-purple-100 rounded" />
                  </div>
                  <div className="w-20 h-8 bg-purple-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : recentEngagements.length === 0 ? (
            <div className="p-6 bg-purple-50 rounded-xl text-center text-sm text-slate-600">
              No engagement recorded yet. Share more content and encourage your fans to interact!
            </div>
          ) : (
            <div className="space-y-4">
              {recentEngagements.map((item) => {
                const engagementCopy = `${item.fanName} ${humanizeEngagementType(item.type)} your ${capitalize(item.platform)} post${
                  item.postTitle ? ` “${item.postTitle}”` : ''
                }.`;

                const badgeLabel = item.rewardGiven ? 'Rewarded' : 'Pending';
                const badgeTone = item.rewardGiven
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200';

                return (
                  <div key={item.id} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium">{item.fanName}</p>
                      <p className="text-slate-600 text-sm">{engagementCopy}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.platform}
                        </Badge>
                        <span className="text-xs text-slate-500">{formatTimeAgo(item.loggedAt)}</span>
                        <Badge className={`${badgeTone} text-xs`}>{badgeLabel}</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={item.rewardGiven ? 'outline' : 'default'}
                      className={
                        item.rewardGiven
                          ? 'border-purple-200 text-purple-600'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      }
                      onClick={onOpenAllocateModal}
                    >
                      {item.rewardGiven ? 'View' : 'Reward'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* My Earnings */}
        <Card className="p-6 border-purple-100 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Coins I've Earned</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('wallet')}>
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              {onRefreshEarnings && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-purple-600"
                  onClick={onRefreshEarnings}
                >
                  <RefreshCcw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </div>
          {isEarnedCoinsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`earned-skeleton-${index}`}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-xl animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-purple-200 rounded" />
                      <div className="h-3 w-32 bg-purple-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-12 bg-purple-100 rounded" />
                </div>
              ))}
            </div>
          ) : earnedCoinEntries.length === 0 ? (
            <div className="p-6 bg-purple-50 rounded-xl text-center text-sm text-slate-600">
              No rewards yet. Engage with creators to start earning coins.
            </div>
          ) : (
            <div className="space-y-4">
              {earnedCoinEntries.map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold uppercase">
                      {coin.coinSymbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">{coin.coinSymbol}</p>
                      <p className="text-slate-500 text-sm">{coin.creatorName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end text-purple-600 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>{coin.displayAmount}</span>
                    </div>
                    {coin.createdAt && (
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(coin.createdAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate('wallet')}>
            <Gift className="w-4 h-4 mr-2" />
            Redeem Rewards
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border-purple-100 bg-white">
        <h3 className="text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button
            className="justify-start h-auto p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => onNavigate('my-coin')}
          >
            <div className="flex items-center gap-3">
              <Coins className="w-6 h-6" />
              <div className="text-left">
                <p>Fund My Pool</p>
                <p className="text-purple-100">Add more {walletCurrency}</p>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => onNavigate('discover')}
          >
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6" />
              <div className="text-left">
                <p className="text-slate-900">Discover Creators</p>
                <p className="text-slate-600">Find new people to follow</p>
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => onNavigate('profile')}
          >
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <div className="text-left">
                <p className="text-slate-900">Connect Platforms</p>
                <p className="text-slate-600">Link more social accounts</p>
              </div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
}

