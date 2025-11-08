import { useState } from 'react';
import { 
  Sparkles, Users, Menu, X, LogOut, Home, Wallet, 
  Search, Coins, TrendingUp, Settings, Plus, Youtube,
  Instagram, Facebook, AlertCircle, ChevronRight, Gift,
  Target, Activity, Award
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface DashboardProps {
  navigate: (page: string) => void;
  onLogout: () => void;
}

type TabType = 'home' | 'discover' | 'my-coin' | 'wallet' | 'profile';

export default function Dashboard({ navigate, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [launchCoinModalOpen, setLaunchCoinModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  
  // User data
  const hasLaunchedCoin = true; // Set to false to show launch prompt
  const myCoinName = "SarahCoins";
  const myCoinSupply = 10000;
  const myCoinHolders = 234;
  const myPoolBalance = 3500;
  
  // Coins earned from others
  const earnedCoins = [
    { name: 'JessicaCoin', amount: 450, creator: 'Jessica Martinez', avatar: '👩' },
    { name: 'DavidTokens', amount: 320, creator: 'David Park', avatar: '👨' },
    { name: 'RachelRewards', amount: 180, creator: 'Rachel Kim', avatar: '👱‍♀️' },
  ];

  const totalEarnedCoins = earnedCoins.reduce((sum, coin) => sum + coin.amount, 0);

  // Following
  const following = [
    { id: 1, name: 'Jessica Martinez', username: '@jessicabeauty', avatar: '👩', coinName: 'JessicaCoin', poolStatus: 'Active', followers: 1245 },
    { id: 2, name: 'David Park', username: '@davidgaming', avatar: '👨', coinName: 'DavidTokens', poolStatus: 'Active', followers: 3890 },
    { id: 3, name: 'Rachel Kim', username: '@rachellifestyle', avatar: '👱‍♀️', coinName: 'RachelRewards', poolStatus: 'Low', followers: 2156 },
    { id: 4, name: 'Mike Johnson', username: '@miketech', avatar: '🧑', coinName: 'MikeCoins', poolStatus: 'Empty', followers: 567 },
  ];

  // My followers
  const myFollowers = [
    { id: 1, name: 'Alex Rivera', username: '@alexr', avatar: '👤', earned: 145, lastActive: '2h ago' },
    { id: 2, name: 'Jordan Lee', username: '@jordanl', avatar: '🧑', earned: 120, lastActive: '5h ago' },
    { id: 3, name: 'Taylor Swift', username: '@taylors', avatar: '👩', earned: 98, lastActive: '1d ago' },
    { id: 4, name: 'Sam Chen', username: '@samc', avatar: '👨', earned: 87, lastActive: '1d ago' },
  ];

  // Recent engagement from my social posts
  const recentEngagement = [
    { id: 1, user: 'Alex Rivera', action: 'Commented on your Instagram post', platform: 'Instagram', time: '15m ago', verified: true },
    { id: 2, user: 'Jordan Lee', action: 'Liked your YouTube video', platform: 'YouTube', time: '1h ago', verified: true },
    { id: 3, user: 'Taylor Swift', action: 'Shared your TikTok', platform: 'TikTok', time: '2h ago', verified: true },
    { id: 4, user: 'Sam Chen', action: 'Watched your full video', platform: 'YouTube', time: '3h ago', verified: true },
  ];

  // Discover users
  const discoverUsers = [
    { id: 1, name: 'Emma Davis', username: '@emmafitness', avatar: '👱‍♀️', category: 'Fitness', coinName: 'EmmaCoins', followers: 5420, poolStatus: 'Active' },
    { id: 2, name: 'Chris Martinez', username: '@chriscooking', avatar: '👨', category: 'Cooking', coinName: 'ChrisTokens', followers: 3210, poolStatus: 'Active' },
    { id: 3, name: 'Lisa Chen', username: '@lisatravel', avatar: '👩', category: 'Travel', coinName: 'LisaRewards', followers: 8930, poolStatus: 'Active' },
    { id: 4, name: 'Ryan Park', username: '@ryanmusic', avatar: '🧑', category: 'Music', coinName: 'RyanCoins', followers: 12450, poolStatus: 'Active' },
  ];

  const connectedAccounts = [
    { platform: 'YouTube', connected: true, username: '@sarahcreates', icon: Youtube, color: 'bg-red-100 text-red-600' },
    { platform: 'Instagram', connected: true, username: '@sarahcreates', icon: Instagram, color: 'bg-pink-100 text-pink-600' },
    { platform: 'TikTok', connected: false, username: null, icon: null, color: 'bg-slate-100 text-slate-600' },
    { platform: 'Facebook', connected: false, username: null, icon: Facebook, color: 'bg-blue-100 text-blue-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 border-purple-100 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p>My Coin Pool</p>
                  <Coins className="w-5 h-5" />
                </div>
                <p className="mb-1">{myPoolBalance.toLocaleString()}</p>
                <p className="text-purple-100">{myCoinName} available</p>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-600">My Followers</p>
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-slate-900 mb-1">{myCoinHolders}</p>
                <p className="text-green-600">+12 this week</p>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-600">Earned Coins</p>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-slate-900 mb-1">{totalEarnedCoins}</p>
                <p className="text-slate-500">From {earnedCoins.length} creators</p>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-600">Following</p>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-slate-900 mb-1">{following.length}</p>
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
                  {recentEngagement.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900">{item.user}</p>
                        <p className="text-slate-600">{item.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                          <span className="text-slate-500">{item.time}</span>
                          {item.verified && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => setAllocateModalOpen(true)}
                      >
                        Allocate
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Engagement
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>

              {/* My Earnings */}
              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-slate-900">Coins I've Earned</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('wallet')}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {earnedCoins.map((coin) => (
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
                  onClick={() => setActiveTab('my-coin')}
                >
                  <div className="flex items-center gap-3">
                    <Coins className="w-6 h-6" />
                    <div className="text-left">
                      <p>Fund My Pool</p>
                      <p className="text-purple-100">Add more {myCoinName}</p>
                    </div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => setActiveTab('discover')}
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
                  onClick={() => setActiveTab('profile')}
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

      case 'discover':
        return (
          <div className="space-y-6">
            <Card className="p-6 border-purple-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Input 
                    placeholder="Search creators by name or username..." 
                    className="w-full"
                  />
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {discoverUsers.map((user) => (
                <Card key={user.id} className="p-6 border-purple-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{user.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">{user.name}</p>
                      <p className="text-slate-500">{user.username}</p>
                      <Badge variant="outline" className="mt-1">{user.category}</Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">{user.poolStatus}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-slate-600">Coin</p>
                      <p className="text-slate-900">{user.coinName}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Followers</p>
                      <p className="text-slate-900">{user.followers.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Follow & Start Earning
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'my-coin':
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
                  onClick={() => setLaunchCoinModalOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
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
                          <p>{myCoinHolders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <Coins className="w-10 h-10" />
                    </div>
                  </div>
                  <Button className="bg-white text-purple-600 hover:bg-purple-50">
                    <Plus className="w-4 h-4 mr-2" />
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
                        <span className="text-slate-900">{myPoolBalance.toLocaleString()} / {myCoinSupply.toLocaleString()}</span>
                      </div>
                      <Progress value={(myPoolBalance / myCoinSupply) * 100} className="h-3" />
                    </div>
                    
                    {myPoolBalance < 1000 && (
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
                    <h3 className="text-slate-900">My Followers ({myFollowers.length})</h3>
                    <Button variant="outline" size="sm">Export Data</Button>
                  </div>
                  <div className="space-y-4">
                    {myFollowers.map((follower) => (
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
              </>
            )}
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-6">
            <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-1">Total Earned</p>
                  <p className="mb-2">{totalEarnedCoins} Coins</p>
                  <p className="text-purple-100">From {earnedCoins.length} creators</p>
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
                {earnedCoins.map((coin) => (
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

      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="p-6 border-purple-100">
              <h3 className="text-slate-900 mb-6">Profile Information</h3>
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <p className="text-slate-600 mb-1">Name</p>
                    <Input defaultValue="Sarah Johnson" />
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1">Username</p>
                    <Input defaultValue="@sarahjohnson" />
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Save Changes
              </Button>
            </Card>

            {/* Connected Social Accounts */}
            <Card className="p-6 border-purple-100">
              <h3 className="text-slate-900 mb-6">Connected Social Accounts</h3>
              <p className="text-slate-600 mb-6">
                Connect your social media accounts to track engagement and reward your followers.
              </p>
              <div className="space-y-4">
                {connectedAccounts.map((account) => (
                  <Card key={account.platform} className="p-4 border-purple-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {account.icon && (
                          <div className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center`}>
                            <account.icon className="w-6 h-6" />
                          </div>
                        )}
                        {!account.icon && (
                          <div className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center`}>
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-900">{account.platform}</p>
                          {account.connected && <p className="text-slate-500">{account.username}</p>}
                          {!account.connected && <p className="text-slate-500">Not connected</p>}
                        </div>
                      </div>
                      {account.connected ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                      ) : (
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          Connect
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            FanCoin
          </span>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('home')}
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
            onClick={() => setActiveTab('discover')}
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
            onClick={() => setActiveTab('my-coin')}
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
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-slate-600 hover:bg-purple-50'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
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

        <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={onLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          <span>Log Out</span>
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 bg-white h-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
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
                { tab: 'home', icon: Home, label: 'Home' },
                { tab: 'discover', icon: Search, label: 'Discover' },
                { tab: 'my-coin', icon: Coins, label: 'My Coin' },
                { tab: 'wallet', icon: Wallet, label: 'Wallet' },
                { tab: 'profile', icon: Settings, label: 'Profile & Settings' },
              ].map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab as TabType); setSidebarOpen(false); }}
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
      <div className="flex-1 flex flex-col min-h-screen">
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
                  <span className="text-slate-900">{totalEarnedCoins}</span>
                </div>
              </Card>

              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white">SJ</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8">
          {renderContent()}
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

      {/* Allocate Coins Modal */}
      <Dialog open={allocateModalOpen} onOpenChange={setAllocateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Rewards</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-600">
              Allocate {myCoinName} to Alex Rivera for their engagement on your Instagram post.
            </p>
            <div>
              <p className="text-slate-600 mb-2">Amount</p>
              <Input type="number" placeholder="15" defaultValue="15" />
            </div>
            <Card className="p-4 bg-purple-50 border-purple-100">
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining Pool</span>
                <span className="text-purple-600">{myPoolBalance - 15} {myCoinName}</span>
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
