import { useState } from 'react';
import { Sparkles, ArrowRight, Check, Youtube, Instagram, Facebook, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AuthFlowProps {
  onAuthComplete: () => void;
  navigate: (page: string) => void;
}

type Step = 'signup' | 'onboarding-connect' | 'onboarding-coin';

export default function AuthFlow({ onAuthComplete, navigate }: AuthFlowProps) {
  const [step, setStep] = useState<Step>('signup');
  const [isLogin, setIsLogin] = useState(false);

  const handleSignup = () => {
    setStep('onboarding-connect');
  };

  const handleLogin = () => {
    onAuthComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => navigate('landing')}>
          ← Back to Home
        </Button>
      </div>

      <div className="w-full max-w-6xl">
        {/* Signup/Login Form */}
        {step === 'signup' && (
          <Card className="max-w-md mx-auto p-8 border-purple-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <h2 className="text-slate-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Join FanCoin'}
              </h2>
              <p className="text-slate-600">
                {isLogin ? 'Log in to your account' : 'Create your account to get started'}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}>
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" className="mt-1" />
                </div>
              )}

              {!isLogin && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="@johndoe" className="mt-1" />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="mt-1" />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="mt-1" />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" className="mt-1" />
                </div>
              )}

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isLogin ? 'Log In' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  className="text-slate-600 hover:text-purple-600"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Onboarding Step 1 - Connect Social */}
        {step === 'onboarding-connect' && (
          <Card className="max-w-2xl mx-auto p-8 border-purple-100">
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center">1</div>
                <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center">2</div>
              </div>
              <h2 className="text-slate-900 mb-2">Connect Your Social Accounts</h2>
              <p className="text-slate-600">
                Link your platforms so we can track engagement from your followers
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-slate-900">YouTube</p>
                      <p className="text-slate-500">Connect your channel</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-slate-900">Instagram</p>
                      <p className="text-slate-500">Connect your profile</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-900">TikTok</p>
                      <p className="text-slate-500">Connect your account</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-900">Facebook</p>
                      <p className="text-slate-500">Connect your page</p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect
                  </Button>
                </div>
              </Card>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep('onboarding-coin')}
              >
                Skip for Now
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => setStep('onboarding-coin')}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Onboarding Step 2 - Launch Coin (Optional) */}
        {step === 'onboarding-coin' && (
          <Card className="max-w-2xl mx-auto p-8 border-purple-100">
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">✓</div>
                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center">2</div>
              </div>
              <h2 className="text-slate-900 mb-2">Want to Launch Your Coin?</h2>
              <p className="text-slate-600">
                Create your branded coin to reward followers, or skip and start earning from others first
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-8 border-purple-100 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coins className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-slate-900 mb-3">Launch My Coin</h3>
                <ul className="space-y-3 text-left mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Create branded coin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Reward your followers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">$50 launch fee</span>
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Launch Now
                </Button>
              </Card>

              <Card className="p-8 border-purple-100 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-slate-900 mb-3">Start Earning First</h3>
                <ul className="space-y-3 text-left mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Follow creators you love</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Earn coins for engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">Launch coin later</span>
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onAuthComplete}
                >
                  Skip & Explore
                </Button>
              </Card>
            </div>

            <div className="text-center text-slate-500">
              <p>You can launch your coin anytime from your dashboard</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
