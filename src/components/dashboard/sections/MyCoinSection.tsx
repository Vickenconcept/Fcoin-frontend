import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { RewardRules } from '../hooks/useRewardRules';
import type { CreatorCoin } from '../hooks/useCoins';
import { TopUpModal } from '../TopUpModal';

const demoMyFollowers = [
  { id: 1, name: 'Alex Rivera', username: '@alexr', avatar: '👤', earned: 145, lastActive: '2h ago' },
  { id: 2, name: 'Jordan Lee', username: '@jordanl', avatar: '🧑', earned: 120, lastActive: '5h ago' },
  { id: 3, name: 'Taylor Swift', username: '@taylors', avatar: '👩', earned: 98, lastActive: '1d ago' },
  { id: 4, name: 'Sam Chen', username: '@samc', avatar: '👨', earned: 87, lastActive: '1d ago' },
];

type MyCoinSectionProps = {
  coins: CreatorCoin[];
  coinsLoading: boolean;
  primaryCoinSymbol: string;
  primaryCoinBalance: number;
  followerCountDisplay: string;
  onOpenLaunchModal: () => void;
  onOpenAllocateModal: () => void;
  rewardRules: RewardRules;
  onSaveRewardRules: (rules: RewardRules) => Promise<void>;
  isRewardRulesLoading: boolean;
  isRewardRulesSaving: boolean;
  conversionRate: number;
  onAfterTopUp: () => Promise<void> | void;
};

export function MyCoinSection({
  coins,
  coinsLoading,
  primaryCoinSymbol,
  primaryCoinBalance,
  followerCountDisplay,
  onOpenLaunchModal,
  onOpenAllocateModal,
  rewardRules,
  onSaveRewardRules,
  isRewardRulesLoading,
  isRewardRulesSaving,
  conversionRate,
  onAfterTopUp,
}: MyCoinSectionProps) {
  const [localRules, setLocalRules] = useState<RewardRules>(rewardRules);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CreatorCoin | null>(null);

  useEffect(() => {
    setLocalRules(rewardRules);
  }, [rewardRules]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your coin has been funded.');
      Promise.resolve(onAfterTopUp?.()).catch((error) => {
        console.error('[MyCoinSection] onAfterTopUp failed', error);
      });
    } else if (paymentStatus === 'cancel') {
      toast.error('Payment was cancelled.');
    }

    window.history.replaceState({}, '', window.location.pathname);
  }, [onAfterTopUp]);

  const handleBaseAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setLocalRules((prev) => ({
      ...prev,
      base_amount: Number.isNaN(value) ? 0 : Math.max(0, value),
    }));
  };

  const handlePerTypeChange = (type: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setLocalRules((prev) => ({
      ...prev,
      per_type: {
        ...prev.per_type,
        [type]: Number.isNaN(value) ? 0 : Math.max(0, value),
      },
    }));
  };

  const handleSaveRewardRules = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveRewardRules(localRules).catch((error) => {
      console.error('[MyCoinSection] Failed to save reward rules', error);
    });
  };

  const rewardRuleFields = useMemo(
    () => [
      { key: 'like', label: 'Per Like' },
      { key: 'comment', label: 'Per Comment' },
      { key: 'share', label: 'Per Share' },
      { key: 'watch', label: 'Per Full Watch' },
    ],
    [],
  );

  const sortedCoins = useMemo(
    () => [...coins].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [coins],
  );

  const primaryCoin = sortedCoins.find((coin) => coin.symbol === primaryCoinSymbol) ?? null;
  const hasCoins = sortedCoins.length > 0;

  const openTopUpModal = (coin: CreatorCoin) => {
    setSelectedCoin(coin);
    setTopUpModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {!hasCoins ? (
        <Card className="p-12 text-center border-purple-100">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Coins className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-slate-900 mb-4">Launch Your First Coin</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Create a branded coin to reward your community. Fund it instantly and start allocating
            rewards tied to engagement.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={onOpenLaunchModal}
          >
            <Coins className="w-5 h-5 mr-2" />
            Launch a Coin
          </Button>
        </Card>
      ) : (
        <>
          <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-purple-100 mb-1">Primary Coin</p>
                <h2 className="text-white mb-2 text-2xl font-semibold">{primaryCoinSymbol}</h2>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <p className="text-purple-100">Current Pool</p>
                    <p className="text-lg font-semibold">{primaryCoinBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-purple-100">Followers</p>
                    <p className="text-lg font-semibold">{followerCountDisplay}</p>
                  </div>
                  <div>
                    <p className="text-purple-100">Conversion</p>
                    <p className="text-lg font-semibold">1 USD = {conversionRate} {primaryCoinSymbol}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Coins className="w-10 h-10" />
                </div>
                {primaryCoin && (
                  <Button
                    className="bg-white text-purple-600 hover:bg-purple-50"
                    onClick={() => openTopUpModal(primaryCoin)}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Fund {primaryCoin.symbol}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-slate-900 text-lg font-semibold">Your Coins</h3>
                <p className="text-slate-500 text-sm">
                  Manage every coin you’ve launched. Fund pools and monitor balances in one place.
                </p>
              </div>
              <Button onClick={onOpenLaunchModal}>Create New Coin</Button>
            </div>

            {coinsLoading ? (
              <p className="text-slate-600">Loading coins…</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {sortedCoins.map((coin) => (
                  <Card key={coin.id} className="border-purple-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-900 font-semibold text-lg">{coin.symbol}</p>
                        {coin.name && <p className="text-slate-500 text-sm">{coin.name}</p>}
                      </div>
                      <div className="flex items-center gap-2 text-purple-600">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xl font-semibold">{coin.balance.toLocaleString()}</span>
                      </div>
                    </div>
                    {coin.description && (
                      <p className="text-slate-500 text-sm mb-4">{coin.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => openTopUpModal(coin)}
                      >
                        Fund {coin.symbol}
                      </Button>
                      <Button variant="outline" onClick={onOpenAllocateModal}>
                        Allocate Rewards
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 border-purple-100">
            <form className="space-y-6" onSubmit={handleSaveRewardRules}>
              <div>
                <h3 className="text-slate-900 mb-2">Reward Distribution Settings</h3>
                <p className="text-slate-500 text-sm">
                  Decide how many coins you send for each verified engagement across your campaigns.
                </p>
              </div>

              <div>
                <p className="text-slate-600 mb-2">Base Reward (fallback)</p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localRules.base_amount}
                  onChange={handleBaseAmountChange}
                  disabled={isRewardRulesLoading || isRewardRulesSaving}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {rewardRuleFields.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-slate-600 mb-2">{label}</p>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={localRules.per_type[key] ?? 0}
                      onChange={handlePerTypeChange(key)}
                      disabled={isRewardRulesLoading || isRewardRulesSaving}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isRewardRulesLoading || isRewardRulesSaving}
              >
                {isRewardRulesSaving ? 'Saving…' : 'Save Settings'}
              </Button>
            </form>
          </Card>

          <Card className="p-6 border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900 text-lg font-semibold">My Followers ({followerCountDisplay})</h3>
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
        </>
      )}

      <TopUpModal
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        coinSymbol={selectedCoin?.symbol ?? primaryCoinSymbol}
        conversionRate={conversionRate}
        returnPath={`${window.location.origin}/dashboard/my-coin`}
      />
    </div>
  );
}

