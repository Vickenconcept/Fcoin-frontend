import { AlertCircle, Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const demoMyFollowers = [
  { id: 1, name: 'Alex Rivera', username: '@alexr', avatar: '👤', earned: 145, lastActive: '2h ago' },
  { id: 2, name: 'Jordan Lee', username: '@jordanl', avatar: '🧑', earned: 120, lastActive: '5h ago' },
  { id: 3, name: 'Taylor Swift', username: '@taylors', avatar: '👩', earned: 98, lastActive: '1d ago' },
  { id: 4, name: 'Sam Chen', username: '@samc', avatar: '👨', earned: 87, lastActive: '1d ago' },
];

type MyCoinSectionProps = {
  hasLaunchedCoin: boolean;
  myCoinName: string;
  myCoinSupply: number;
  followerCountDisplay: string;
  poolBalanceDisplay: string;
  poolProgressValue: number;
  walletCurrency: string;
  poolBalanceValue: number;
  onOpenLaunchModal: () => void;
  onOpenAllocateModal: () => void;
};

export function MyCoinSection({
  hasLaunchedCoin,
  myCoinName,
  myCoinSupply,
  followerCountDisplay,
  poolBalanceDisplay,
  poolProgressValue,
  walletCurrency,
  poolBalanceValue,
  onOpenLaunchModal,
  onOpenAllocateModal,
}: MyCoinSectionProps) {
  return (
    <div className="space-y-6">
      {!hasLaunchedCoin ? (
        <Card className="p-12 text-center border-purple-100">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Coins className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-slate-900 mb-4">Launch Your Coin</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Create your branded coin to reward followers who engage with your social media content.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={onOpenLaunchModal}
          >
            <Coins className="w-5 h-5 mr-2" />
            Launch My Coin
          </Button>
        </Card>
      ) : (
        <>
          {/* Coin Overview */}
          <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-purple-100 mb-1">Your Coin</p>
                <h2 className="text-white mb-2">{myCoinName}</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-purple-100">Total Supply</p>
                    <p>{myCoinSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-purple-100">Holders</p>
                    <p>{followerCountDisplay}</p>
                  </div>
                </div>
              </div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Coins className="w-10 h-10" />
              </div>
            </div>
            <Button className="bg-white text-purple-600 hover:bg-purple-50" onClick={onOpenLaunchModal}>
              <Coins className="w-4 h-4 mr-2" />
              Add to Pool
            </Button>
          </Card>

          {/* Pool Status */}
          <Card className="p-6 border-purple-100">
            <h3 className="text-slate-900 mb-4">Reward Pool Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Available for Distribution</span>
                  <span className="text-slate-900">
                    {poolBalanceDisplay} / {myCoinSupply.toLocaleString()}
                  </span>
                </div>
                <Progress value={poolProgressValue} className="h-3" />
              </div>

              {poolBalanceValue < 1000 && (
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-900">Pool running low</p>
                      <p className="text-amber-700">Add more coins to keep rewarding your followers.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* My Followers */}
          <Card className="p-6 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900">My Followers ({followerCountDisplay})</h3>
              <Button variant="outline" size="sm">
                Export Data
              </Button>
            </div>
            <div className="space-y-4">
              {demoMyFollowers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-xl">{follower.avatar}</span>
                    </div>
                    <div>
                      <p className="text-slate-900">{follower.name}</p>
                      <p className="text-slate-500">{follower.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-purple-600 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>{follower.earned} earned</span>
                    </div>
                    <p className="text-slate-500">{follower.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Distribution Settings */}
          <Card className="p-6 border-purple-100">
            <h3 className="text-slate-900 mb-6">Reward Distribution Settings</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-600 mb-2">Per Like</p>
                <Input type="number" defaultValue="5" />
              </div>
              <div>
                <p className="text-slate-600 mb-2">Per Comment</p>
                <Input type="number" defaultValue="15" />
              </div>
              <div>
                <p className="text-slate-600 mb-2">Per Share</p>
                <Input type="number" defaultValue="25" />
              </div>
              <div>
                <p className="text-slate-600 mb-2">Per Full Watch</p>
                <Input type="number" defaultValue="10" />
              </div>
            </div>
            <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Save Settings
            </Button>
          </Card>

          <Card className="p-6 border-purple-100">
            <h3 className="text-slate-900 mb-4">Allocate Rewards</h3>
            <p className="text-slate-600 mb-4">
              Quickly reward fans for their latest engagement.
            </p>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={onOpenAllocateModal}
            >
              Allocate Coins
            </Button>
            <p className="text-slate-500 mt-2">
              Remaining Pool: {Math.max(poolBalanceValue - 15, 0).toLocaleString()} {walletCurrency}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

