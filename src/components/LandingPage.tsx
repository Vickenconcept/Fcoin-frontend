import { Sparkles, TrendingUp, Users, Zap, Youtube, Instagram, Facebook, Coins, Target, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface LandingPageProps {
  navigate: (page: string) => void;
}

export default function LandingPage({ navigate }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FanCoin
            </span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('auth')}>
              Log In
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => navigate('auth')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
            <Sparkles className="w-3 h-3 mr-1" />
            Launch Your Own Reward Coin
          </Badge>
          
          <h1 className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Reward Your Supporters With Your Own Coin
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-600">
            Launch your branded coin, connect your social media, and automatically reward followers who engage with your content across platforms. Track real engagement, build loyalty, create value.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[200px]"
              onClick={() => navigate('auth')}
            >
              <Coins className="w-5 h-5 mr-2" />
              Launch Your Coin
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-purple-200 hover:bg-purple-50 min-w-[200px]"
              onClick={() => navigate('auth')}
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Supporter
            </Button>
          </div>

          {/* Supported Platforms */}
          <div className="pt-12 space-y-4">
            <p className="text-slate-500">Track Engagement Across Platforms</p>
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-red-600" />
                </div>
                <span>YouTube</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
                <span>Instagram</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                <span>Facebook</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <span>TikTok</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white/50 backdrop-blur-sm rounded-3xl my-12">
        <div className="text-center space-y-4 mb-16">
          <h2 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-slate-600">Simple process for creators and supporters</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-3 text-purple-900">1. Launch Your Coin</h3>
            <p className="text-slate-600">
              Create your branded coin (e.g., "JessicaCoin", "DavidTokens"). Pay a one-time launch fee and fund your reward pool.
            </p>
          </Card>

          <Card className="p-8 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-3 text-purple-900">2. Connect & Track</h3>
            <p className="text-slate-600">
              Link your social media accounts. When your followers (registered in the app) engage on those platforms, we track it.
            </p>
          </Card>

          <Card className="p-8 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-3 text-purple-900">3. Reward Automatically</h3>
            <p className="text-slate-600">
              Allocate your coins to followers who liked, commented, shared, or watched. Build a loyal community that grows with you.
            </p>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Why Launch Your Coin?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 border-purple-100">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-purple-900 mb-2">Your Brand, Your Coin</h3>
                <p className="text-slate-600">
                  Create a unique coin with your name. Build scarcity, exclusivity, and brand value.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-purple-100">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-purple-900 mb-2">Only Registered Followers Earn</h3>
                <p className="text-slate-600">
                  Fans must follow you in the app to earn your coins. This creates a loyal, trackable community.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-purple-100">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-purple-900 mb-2">Real Engagement Tracking</h3>
                <p className="text-slate-600">
                  We monitor likes, comments, shares, and views on your external social posts and attribute them to app users.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-purple-100">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-purple-900 mb-2">You Control Distribution</h3>
                <p className="text-slate-600">
                  Decide how many coins to allocate per action. Reward your top supporters or spread evenly.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Example Coins */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Example Creator Coins
          </h2>
          <p className="text-slate-600">See what others have launched</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-slate-900">JessicaCoin</p>
                <p className="text-slate-500">Beauty Creator</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Supply</span>
                <span className="text-purple-600">10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Holders</span>
                <span className="text-purple-600">1,245</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pool Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Follow & Earn
            </Button>
          </Card>

          <Card className="p-6 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-slate-900">DavidTokens</p>
                <p className="text-slate-500">Gaming Streamer</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Supply</span>
                <span className="text-purple-600">25,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Holders</span>
                <span className="text-purple-600">3,890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pool Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Follow & Earn
            </Button>
          </Card>

          <Card className="p-6 border-purple-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-slate-900">RachelRewards</p>
                <p className="text-slate-500">Lifestyle Blogger</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Supply</span>
                <span className="text-purple-600">15,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Holders</span>
                <span className="text-purple-600">2,156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pool Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Follow & Earn
            </Button>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="p-12 bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-center">
          <h2 className="text-white mb-4">Ready to Launch Your Coin?</h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Create your branded coin, reward real engagement, and build a community that values your content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-purple-50"
              onClick={() => navigate('auth')}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
            >
              Watch Demo
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-purple-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  FanCoin
                </span>
              </div>
              <p className="text-slate-600">
                Launch your coin. Reward real engagement. Build loyal communities.
              </p>
            </div>
            
            <div>
              <p className="text-slate-900 mb-4">Product</p>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-purple-600">Features</a></li>
                <li><a href="#" className="hover:text-purple-600">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-600">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <p className="text-slate-900 mb-4">Company</p>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-purple-600">About</a></li>
                <li><a href="#" className="hover:text-purple-600">Blog</a></li>
                <li><a href="#" className="hover:text-purple-600">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <p className="text-slate-900 mb-4">Legal</p>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-purple-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-600">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-purple-100 mt-12 pt-8 text-center text-slate-600">
            <p>© 2025 FanCoin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
