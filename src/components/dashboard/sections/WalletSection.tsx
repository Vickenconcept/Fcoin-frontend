import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Sparkles, Wallet } from 'lucide-react';

const demoEarnedCoins = [
  { name: 'JessicaCoin', amount: 450, creator: 'Jessica Martinez', avatar: '👩' },
  { name: 'DavidTokens', amount: 320, creator: 'David Park', avatar: '👨' },
  { name: 'RachelRewards', amount: 180, creator: 'Rachel Kim', avatar: '👱‍♀️' },
];

type WalletSectionProps = {
  earnedCoinsDisplay: string;
};

export function WalletSection({ earnedCoinsDisplay }: WalletSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 mb-1">Total Earned</p>
            <p className="mb-2">{earnedCoinsDisplay} Coins</p>
            <p className="text-purple-100">From {demoEarnedCoins.length} creators</p>
          </div>
          <Wallet className="w-16 h-16 opacity-50" />
        </div>
      </Card>

      <Tabs defaultValue="coins" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="coins">My Coins</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="space-y-4 mt-6">
          {demoEarnedCoins.map((coin) => (
            <Card key={coin.name} className="p-6 border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{coin.avatar}</span>
                  </div>
                  <div>
                    <p className="text-slate-900">{coin.name}</p>
                    <p className="text-slate-500">{coin.creator}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-2xl">{coin.amount}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                View Transaction History
              </Button>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4 mt-6">
          <Card className="p-8 text-center border-purple-100">
            <Gift className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-slate-900 mb-2">Rewards Marketplace</p>
            <p className="text-slate-600 mb-6">
              Redeem your earned coins for exclusive rewards from your favorite creators.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Browse Rewards
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

