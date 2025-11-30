import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  BarChart3,
  Coins,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Wallet as WalletIcon,
  X,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { useDashboardStats } from './hooks/useDashboardStats';
import { HomeSection } from './sections/HomeSection';
import { DiscoverSection } from './sections/DiscoverSection';
import { MyCoinSection } from './sections/MyCoinSection';
import { WalletSection } from './sections/WalletSection';
import { ProfileSection } from './sections/ProfileSection';
import { SocialInsightsSection } from './sections/SocialInsightsSection';
import { FeedSection } from './sections/FeedSection';
import { RewardAnomaliesSection } from './sections/RewardAnomaliesSection';
import { LaunchCoinModal } from './LaunchCoinModal';
import { useRewardRules } from './hooks/useRewardRules';
import { useCoins } from './hooks/useCoins';
import type { CreatorCoin } from './hooks/useCoins';
import { useRecentEngagements } from './hooks/useRecentEngagements';
import type { RecentEngagement } from './hooks/useRecentEngagements';
type ClickEvent = {
  stopPropagation: () => void;
};

type TabType =
  | 'feed'
  | 'home'
  | 'discover'
  | 'my-coin'
  | 'wallet'
  | 'profile'
  | 'social-insights'
  | 'reward-anomalies';

const allowedTabs: TabType[] = [
  'feed',
  'home',
  'discover',
  'my-coin',
  'wallet',
  'profile',
  'social-insights',
  'reward-anomalies',
];

export default function DashboardLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams<{ section?: string }>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [launchCoinModalOpen, setLaunchCoinModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);

  const activeTab: TabType = allowedTabs.includes((section ?? 'home') as TabType)
    ? ((section ?? 'home') as TabType)
    : 'home';

  // Only load data for tabs that need it
  const needsStats = activeTab === 'home' || activeTab === 'my-coin' || activeTab === 'wallet';
  const needsRewardRules = activeTab === 'my-coin';
  const needsCoins = activeTab === 'my-coin' || activeTab === 'social-insights';
  const needsEngagements = activeTab === 'home';

  const {
    walletBalance,
    walletCurrency,
    conversionRate,
    primaryCoinValueUsd,
    earnedCoinsTotal,
    followerCount,
    followingCount,
    isLoading: isStatsLoading,
    refresh: refreshStats,
    transactions: walletTransactions,
  } = useDashboardStats(
    needsStats ? user?.id : undefined,
    needsStats ? (user?.default_coin_symbol ?? 'FCN') : 'FCN'
  );
  const {
    rules: rewardRules,
    isLoading: isRewardRulesLoading,
    isSaving: isRewardRulesSaving,
    save: saveRewardRules,
  } = useRewardRules();
  const {
    coins,
    isLoading: isCoinsLoading,
    reload: reloadCoins,
  } = useCoins();
  const {
    engagements: recentEngagements,
    isLoading: isRecentEngagementsLoading,
    reload: reloadRecentEngagements,
  } = useRecentEngagements(needsEngagements ? 6 : 0);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    return numberFormatter.format(value);
  };

  const primaryCoinSymbol = (user?.default_coin_symbol ?? walletCurrency ?? 'FCN').toUpperCase();
  const primaryCoin = coins.find((coin: CreatorCoin) => coin.symbol === primaryCoinSymbol) ?? null;
  const primaryCoinBalance = primaryCoin?.balance ?? walletBalance;
  const poolBalanceValue = primaryCoinBalance;
  const poolBalanceDisplay =
    isStatsLoading && primaryCoinBalance === 0 ? '…' : formatNumber(primaryCoinBalance);
  const followerCountValue = followerCount ?? 0;
  const followingCountValue = followingCount ?? 0;

  const isSuperAdmin = user?.user_type === 'super_admin';

  const myCoinName = primaryCoinSymbol;

  const followerCountDisplay =
    isStatsLoading && followerCount === null ? '…' : formatNumber(followerCountValue);

  const followingCountDisplay =
    isStatsLoading && followingCount === null ? '…' : formatNumber(followingCountValue);

  const earnedCoinsValue = earnedCoinsTotal > 0 ? earnedCoinsTotal : walletBalance;
  const earnedCoinsDisplay =
    isStatsLoading && earnedCoinsTotal === 0 ? '…' : formatNumber(earnedCoinsValue);

  const earnedCoinEntries = useMemo(() => {
    if (!Array.isArray(walletTransactions)) {
      return [];
    }

    return walletTransactions
      .filter((transaction: any) => {
        const action = String(transaction?.metadata?.action ?? '').toLowerCase();
        return action === 'reward_received';
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a?.created_at ?? a?.metadata?.created_at ?? 0).getTime();
        const dateB = new Date(b?.created_at ?? b?.metadata?.created_at ?? 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 3)
      .map((transaction: any) => {
        const amount = Number(transaction?.amount ?? 0);
        const metadata = transaction?.metadata ?? {};
        const creatorName =
          metadata.distributed_by_creator_name ??
          metadata.from_display_name ??
          metadata.from_username ??
          'Creator reward';
        const coinSymbol = String(transaction?.currency ?? primaryCoinSymbol ?? 'FCN').toUpperCase();

        return {
          id: String(transaction?.id ?? `${coinSymbol}-${transaction?.reference ?? Math.random()}`),
          coinSymbol,
          amount,
          displayAmount: formatNumber(amount),
          creatorName,
          createdAt: transaction?.created_at ?? metadata.transacted_at ?? null,
        };
      });
  }, [walletTransactions, formatNumber, primaryCoinSymbol]);

  const isEarnedCoinsLoading = isStatsLoading && earnedCoinEntries.length === 0;

  const goToTab = (tab: TabType) => {
    navigate(`/dashboard/${tab}`);
  };

  const handleNavigate = (tab: TabType) => {
    goToTab(tab);
  };

  useEffect(() => {
    const currentSection = section ?? 'home';
    if (!allowedTabs.includes(currentSection as TabType)) {
      navigate('/dashboard/home', { replace: true });
    }
  }, [section, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out.');
    navigate('/auth', { replace: true });
  };

  const userInitials = useMemo(() => {
    if (user?.display_name) {
      return user.display_name
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
    }

    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }

    return 'PH';
  }, [user]);

  return (
    <div className="h-dvh flex bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-purple-100 p-6 sticky top-0 h-dvh flex-shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Phanrise
          </span>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => goToTab('feed')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => goToTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => goToTab('discover')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => goToTab('my-coin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'my-coin'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span>My Coin</span>
          </button>

          <button
            onClick={() => goToTab('wallet')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <WalletIcon className="w-5 h-5" />
            <span>Wallet</span>
          </button>

          <button
            onClick={() => goToTab('social-insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'social-insights'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Social Insights</span>
          </button>

          <button
            onClick={() => goToTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Profile & Settings</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => goToTab('reward-anomalies')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === 'reward-anomalies'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-slate-600 hover:bg-purple-50'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Reward Anomalies</span>
            </button>
          )}
        </nav>

        <Button variant="ghost" className="w-full justify-start text-slate-600 mt-auto" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          <span>Log Out</span>
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside
            className="w-64 bg-white h-full p-6 overflow-y-auto"
            onClick={(event: ClickEvent) => {
              event.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Phanrise
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="space-y-2">
              {[
                { tab: 'feed' as TabType, icon: MessageSquare, label: 'Feed' },
                { tab: 'home' as TabType, icon: Home, label: 'Home' },
                { tab: 'discover' as TabType, icon: Search, label: 'Discover' },
                { tab: 'my-coin' as TabType, icon: Coins, label: 'My Coin' },
                { tab: 'wallet' as TabType, icon: WalletIcon, label: 'Wallet' },
                { tab: 'social-insights' as TabType, icon: BarChart3, label: 'Social Insights' },
                { tab: 'profile' as TabType, icon: Settings, label: 'Profile & Settings' },
              ].map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  onClick={() => {
                    goToTab(tab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    goToTab('reward-anomalies');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === 'reward-anomalies'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Reward Anomalies</span>
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate('/admin/coin-values');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    location.pathname.startsWith('/admin/coin-values')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-slate-600 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Manage Coin Values</span>
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-dvh overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-purple-100 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-slate-900">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <Card className="p-3 border-purple-100 hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-slate-900">{earnedCoinsDisplay}</span>
                </div>
              </Card>

              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex items-center gap-2"
                  onClick={() => navigate('/admin/coin-values')}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Manage Coin Values
                </Button>
              )}

              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer uppercase overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name || user.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-medium">{userInitials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'feed' && <FeedSection />}

          {activeTab === 'home' && (
            <HomeSection
              poolBalanceDisplay={poolBalanceDisplay}
              walletCurrency={walletCurrency}
              followerCountDisplay={followerCountDisplay}
              earnedCoinsDisplay={earnedCoinsDisplay}
              followingCountDisplay={followingCountDisplay}
          recentEngagements={recentEngagements}
          isRecentEngagementsLoading={isRecentEngagementsLoading}
          earnedCoinEntries={earnedCoinEntries}
          isEarnedCoinsLoading={isEarnedCoinsLoading}
              onNavigate={(tab) => handleNavigate(tab)}
              onOpenAllocateModal={() => setAllocateModalOpen(true)}
          onRefreshEngagements={reloadRecentEngagements}
          onRefreshEarnings={refreshStats}
            />
          )}

          {activeTab === 'discover' && <DiscoverSection />}

          {activeTab === 'my-coin' && (
            <MyCoinSection
              coins={coins}
              coinsLoading={isCoinsLoading}
              primaryCoinSymbol={myCoinName}
              primaryCoinBalance={primaryCoinBalance}
              followerCountDisplay={followerCountDisplay}
              onOpenLaunchModal={() => setLaunchCoinModalOpen(true)}
              onOpenAllocateModal={() => setAllocateModalOpen(true)}
              rewardRules={rewardRules}
              onSaveRewardRules={saveRewardRules}
              isRewardRulesLoading={isRewardRulesLoading}
              isRewardRulesSaving={isRewardRulesSaving}
              conversionRate={conversionRate}
              primaryCoinValueUsd={primaryCoinValueUsd}
              onAfterTopUp={async () => {
                await Promise.all([refreshStats(), reloadCoins()]);
              }}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletSection earnedCoinsDisplay={earnedCoinsDisplay} />
          )}

          {activeTab === 'profile' && <ProfileSection />}

          {activeTab === 'social-insights' && (
            <SocialInsightsSection coins={coins} isCoinsLoading={isCoinsLoading} />
          )}

          {activeTab === 'reward-anomalies' && (
            isSuperAdmin ? (
              <RewardAnomaliesSection />
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="p-8 bg-white border-red-100 text-center max-w-md">
                  <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
                  <p className="text-slate-600">
                    This dashboard is only available to super administrators.
                  </p>
                </Card>
              </div>
            )
          )}
        </main>
      </div>

      {/* Launch Coin Modal */}
      <LaunchCoinModal
        open={launchCoinModalOpen}
        onOpenChange={setLaunchCoinModalOpen}
        onSuccess={async () => {
          setLaunchCoinModalOpen(false);
          // Refresh user data and stats
          await refreshUser();
          await refreshStats();
          await reloadCoins();
        }}
      />

      {/* Allocate Rewards Modal */}
      <Dialog open={allocateModalOpen} onOpenChange={setAllocateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Rewards</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-600">
              Allocate {walletCurrency} to Alex Rivera for their engagement on your Instagram post.
            </p>
            <div>
              <p className="text-slate-600 mb-2">Amount</p>
              <Input type="number" placeholder="15" defaultValue="15" />
            </div>
            <Card className="p-4 bg-purple-50 border-purple-100">
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining Pool</span>
                <span className="text-purple-600">
                  {Math.max(poolBalanceValue - 15, 0).toLocaleString()} {walletCurrency}
                </span>
              </div>
            </Card>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Allocate Coins
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

