import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Coins,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from './hooks/useDashboardStats';
import { HomeSection } from './sections/HomeSection';
import { DiscoverSection } from './sections/DiscoverSection';
import { MyCoinSection } from './sections/MyCoinSection';
import { WalletSection } from './sections/WalletSection';
import { ProfileSection } from './sections/ProfileSection';

type TabType = 'home' | 'discover' | 'my-coin' | 'wallet' | 'profile';

const allowedTabs: TabType[] = ['home', 'discover', 'my-coin', 'wallet', 'profile'];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams<{ section?: string }>();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [launchCoinModalOpen, setLaunchCoinModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);

  const {
    walletBalance,
    walletCurrency,
    earnedCoinsTotal,
    followerCount,
    followingCount,
    isLoading: isStatsLoading,
  } = useDashboardStats(user?.id, user?.default_coin_symbol ?? 'FCN');

  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    return numberFormatter.format(value);
  };

  const poolBalanceValue = walletBalance;
  const poolBalanceDisplay = isStatsLoading && walletBalance === 0 ? '…' : formatNumber(walletBalance);

  const followerCountValue = followerCount ?? 0;
  const followingCountValue = followingCount ?? 0;

  const hasLaunchedCoin = true;
  const myCoinSupply = 10000;
  const myCoinName = user?.default_coin_symbol ?? walletCurrency;

  const followerCountDisplay =
    isStatsLoading && followerCount === null ? '…' : formatNumber(followerCountValue);

  const followingCountDisplay =
    isStatsLoading && followingCount === null ? '…' : formatNumber(followingCountValue);

  const earnedCoinsValue = earnedCoinsTotal > 0 ? earnedCoinsTotal : walletBalance;
  const earnedCoinsDisplay =
    isStatsLoading && earnedCoinsTotal === 0 ? '…' : formatNumber(earnedCoinsValue);

  const poolProgressValue = myCoinSupply > 0 ? Math.min((poolBalanceValue / myCoinSupply) * 100, 100) : 0;

  const activeTab: TabType = allowedTabs.includes((section ?? 'home') as TabType)
    ? ((section ?? 'home') as TabType)
    : 'home';

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

    return 'FC';
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
            FanCoin
          </span>
        </div>

        <nav className="space-y-2 flex-1">
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
        </nav>

        <Button variant="ghost" className="w-full justify-start text-slate-600 mt-auto" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          <span>Log Out</span>
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 bg-white h-full p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  FanCoin
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="space-y-2">
              {[
                { tab: 'home' as TabType, icon: Home, label: 'Home' },
                { tab: 'discover' as TabType, icon: Search, label: 'Discover' },
                { tab: 'my-coin' as TabType, icon: Coins, label: 'My Coin' },
                { tab: 'wallet' as TabType, icon: WalletIcon, label: 'Wallet' },
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

              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer uppercase">
                <span className="text-white font-medium">{userInitials}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeSection
              poolBalanceDisplay={poolBalanceDisplay}
              walletCurrency={walletCurrency}
              followerCountDisplay={followerCountDisplay}
              earnedCoinsDisplay={earnedCoinsDisplay}
              followingCountDisplay={followingCountDisplay}
              onNavigate={(tab) => handleNavigate(tab)}
              onOpenAllocateModal={() => setAllocateModalOpen(true)}
            />
          )}

          {activeTab === 'discover' && <DiscoverSection />}

          {activeTab === 'my-coin' && (
            <MyCoinSection
              hasLaunchedCoin={hasLaunchedCoin}
              myCoinName={myCoinName}
              myCoinSupply={myCoinSupply}
              followerCountDisplay={followerCountDisplay}
              poolBalanceDisplay={poolBalanceDisplay}
              poolProgressValue={poolProgressValue}
              walletCurrency={walletCurrency}
              poolBalanceValue={poolBalanceValue}
              onOpenLaunchModal={() => setLaunchCoinModalOpen(true)}
              onOpenAllocateModal={() => setAllocateModalOpen(true)}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletSection earnedCoinsDisplay={earnedCoinsDisplay} />
          )}

          {activeTab === 'profile' && <ProfileSection />}
        </main>
      </div>

      {/* Launch Coin Modal */}
      <Dialog open={launchCoinModalOpen} onOpenChange={setLaunchCoinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Your Coin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-slate-600 mb-2">Coin Name</p>
              <Input placeholder="e.g., SarahCoins, DavidTokens..." />
            </div>
            <div>
              <p className="text-slate-600 mb-2">Initial Supply</p>
              <Input type="number" placeholder="10000" />
            </div>
            <Card className="p-4 bg-purple-50 border-purple-100">
              <p className="text-slate-600 mb-2">Launch Fee</p>
              <p className="text-slate-900">$50 (one-time)</p>
            </Card>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Launch My Coin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

