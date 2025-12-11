import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Sparkles, ArrowRight, Check, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type Step = 'signup' | 'onboarding-connect' | 'onboarding-coin';

type FormState = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthFlow() {
  const routerNavigate = useNavigate();
  const { register, login } = useAuth();
  const [step, setStep] = useState<Step>('signup');
  const [isLogin, setIsLogin] = useState(false);
  const [form, setForm] = useState<FormState>({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(
    () =>
      isSubmitting ||
      (!isLogin &&
        (!form.username.trim() ||
          !form.email.trim() ||
          !form.password ||
          !form.confirmPassword ||
          form.password !== form.confirmPassword)),
    [form, isLogin, isSubmitting],
  );

  const resetFeedback = () => {
    // using toasts now; no local state required
  };

  const handleFieldChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submitSignup = async () => {
    resetFeedback();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        username: form.username.trim(),
        display_name: form.displayName.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
      });

      if (response.ok) {
        toast.success('Account created! Let’s finish setting things up.');
        setStep('onboarding-connect');
      } else {
        const apiErrors = response.errors?.map((error) => error.detail || error.title).filter(Boolean);
        if (apiErrors?.length) {
          apiErrors.forEach((message) => toast.error(message ?? 'Unable to create account.'));
        } else {
          toast.error('We could not create your account. Please try again.');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Check your connection and try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = async () => {
    resetFeedback();
    setIsSubmitting(true);

    try {
      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      if (response.ok) {
        toast.success('Welcome back! Redirecting to your dashboard.');
        routerNavigate('/dashboard/home', { replace: true });
      } else {
        const apiErrors = response.errors?.map((error) => error.detail || error.title).filter(Boolean);
        if (apiErrors?.length) {
          apiErrors.forEach((message) => toast.error(message ?? 'Invalid email or password.'));
        } else {
          toast.error('Invalid email or password.');
        }
      }
    } catch (error) {
      toast.error('Unable to log in. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLogin) {
      void submitLogin();
    } else {
      void submitSignup();
    }
  };

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    resetFeedback();
  };

  const handleAuthComplete = () => {
    toast.success('Setup complete! Redirecting to your dashboard.');
    routerNavigate('/dashboard/home', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => routerNavigate('/')}>
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
                {isLogin ? 'Welcome Back' : 'Join Phanrise'}
              </h2>
              <p className="text-slate-600">
                {isLogin ? 'Log in to your account' : 'Create your account to get started'}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    className="mt-1"
                    value={form.displayName}
                    onChange={handleFieldChange('displayName')}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {!isLogin && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="@johndoe"
                    className="mt-1"
                    value={form.username}
                    onChange={handleFieldChange('username')}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1"
                  value={form.email}
                  onChange={handleFieldChange('email')}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="mt-1"
                  value={form.password}
                  onChange={handleFieldChange('password')}
                  disabled={isSubmitting}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1"
                    value={form.confirmPassword}
                    onChange={handleFieldChange('confirmPassword')}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? 'Please wait…' : isLogin ? 'Log In' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  className="text-slate-600 hover:text-purple-600"
                  onClick={handleToggleMode}
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
                  onClick={handleAuthComplete}
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
