import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  Coins,
  Gift,
  Search,
  Sparkles,
  TrendingUp,
  Target,
  Users,
} from 'lucide-react';

type HomeSectionProps = {
  poolBalanceDisplay: string;
  walletCurrency: string;
  followerCountDisplay: string;
  earnedCoinsDisplay: string;
  followingCountDisplay: string;
  onNavigate: (tab: 'discover' | 'my-coin' | 'wallet' | 'profile') => void;
  onOpenAllocateModal: () => void;
};

const demoRecentEngagement = [
  { id: 1, user: 'Alex Rivera', action: 'Commented on your Instagram post', platform: 'Instagram', time: '15m ago', verified: true },
  { id: 2, user: 'Jordan Lee', action: 'Liked your YouTube video', platform: 'YouTube', time: '1h ago', verified: true },
  { id: 3, user: 'Taylor Swift', action: 'Shared your TikTok', platform: 'TikTok', time: '2h ago', verified: true },
  { id: 4, user: 'Sam Chen', action: 'Watched your full video', platform: 'YouTube', time: '3h ago', verified: true },
];

const demoEarnedCoins = [
  { name: 'JessicaCoin', amount: 450, creator: 'Jessica Martinez', avatar: '👩' },
  { name: 'DavidTokens', amount: 320, creator: 'David Park', avatar: '👨' },
  { name: 'RachelRewards', amount: 180, creator: 'Rachel Kim', avatar: '👱‍♀️' },
];

export function HomeSection({
  poolBalanceDisplay,
  walletCurrency,
  followerCountDisplay,
  earnedCoinsDisplay,
  followingCountDisplay,
  onNavigate,
  onOpenAllocateModal,
}: HomeSectionProps) {
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

        <Card className="p-6 border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600">My Followers</p>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-slate-900 mb-1">{followerCountDisplay}</p>
          <p className="text-green-600">+12 this week</p>
        </Card>

        <Card className="p-6 border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600">Earned Coins</p>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-slate-900 mb-1">{earnedCoinsDisplay}</p>
          <p className="text-slate-500">From {demoEarnedCoins.length} creators</p>
        </Card>

        <Card className="p-6 border-purple-100">
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
        <Card className="p-6 border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Recent Engagement on My Posts</h3>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">Live Tracking</Badge>
          </div>
          <div className="space-y-4">
            {demoRecentEngagement.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900">{item.user}</p>
                  <p className="text-slate-600">{item.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.platform}
                    </Badge>
                    <span className="text-slate-500">{item.time}</span>
                    {item.verified && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Verified</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={onOpenAllocateModal}
                >
                  Allocate
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Engagement
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>

        {/* My Earnings */}
        <Card className="p-6 border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900">Coins I've Earned</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('wallet')}>
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-4">
            {demoEarnedCoins.map((coin) => (
              <div key={coin.name} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-xl">{coin.avatar}</span>
                  </div>
                  <div>
                    <p className="text-slate-900">{coin.name}</p>
                    <p className="text-slate-500">{coin.creator}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  <span>{coin.amount}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Gift className="w-4 h-4 mr-2" />
            Redeem Rewards
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border-purple-100">
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

