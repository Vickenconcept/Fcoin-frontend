import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { SearchableSelect } from '../ui/searchable-select';
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft, Banknote, Globe, DollarSign } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

type BasicChangeEvent = { target: { value: string } };

type WalletCoinBalance = {
  coin_symbol: string;
  balance: number;
  value_usd: number;
  fiat_value_usd: number;
};

type Bank = {
  code: string;
  name: string;
};

type BankOption = {
  value: string;
  label: string;
};

type WithdrawalCalculation = {
  coin_amount: number;
  coin_symbol: string;
  usd_amount: number;
  ngn_amount: number;
  fee_amount: number;
  final_amount: number;
  exchange_rate: number;
  is_valid: boolean;
  min_withdrawal_usd: number;
  min_final_ngn: number;
  constraint_message: string;
};

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinBalances: WalletCoinBalance[];
  onWithdrawalSuccess: () => void;
}

export function WithdrawalModal({ isOpen, onClose, coinBalances, onWithdrawalSuccess }: WithdrawalModalProps) {
  const [step, setStep] = useState<'currency' | 'amount' | 'bank' | 'confirm'>('currency');
  const [selectedCurrency, setSelectedCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [coinSymbol, setCoinSymbol] = useState('FCN');
  const [coinAmount, setCoinAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [withdrawalCalculation, setWithdrawalCalculation] = useState<WithdrawalCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [withdrawalLimits, setWithdrawalLimits] = useState<{
    minUsd: number;
    minNgn: number;
    exchangeRate: number;
  } | null>(null);

  // Fetch config and banks when modal opens
  useEffect(() => {
    if (isOpen) {
      if (banks.length === 0) {
        fetchBanks();
      }
      if (!withdrawalLimits) {
        fetchWithdrawalConfig();
      }
    }
  }, [isOpen]);

  // Set default coin symbol from available balances
  useEffect(() => {
    if (coinBalances.length > 0 && !coinSymbol) {
      setCoinSymbol(coinBalances[0].coin_symbol);
    }
  }, [coinBalances]);

  // Real-time validation (no API calls)
  useEffect(() => {
    const errors = validateWithdrawal();
    setValidationErrors(errors);
    
    // Only calculate if no validation errors
    if (errors.length === 0 && coinAmount && parseFloat(coinAmount) > 0) {
      // Debounce the API calculation by 800ms
      const timeoutId = setTimeout(() => {
        calculateWithdrawal();
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setWithdrawalCalculation(null);
    }
  }, [coinAmount, coinSymbol, coinBalances]);

  const fetchWithdrawalConfig = async () => {
    try {
      const response = await apiClient.request<any>('/v1/withdrawals/config');
      if (response.ok && response.data && response.data.limits) {
        const limits = response.data.limits;
        const exchangeRate = response.data.exchange_rate?.usd_to_ngn || 1450;
        
        setWithdrawalLimits({
          minUsd: Number(limits.minimum_usd) || 0.50,
          minNgn: Number(limits.minimum_final_ngn) || 100.00,
          exchangeRate: Number(exchangeRate) || 1450,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal config:', error);
      // Set fallback values with proper types
      setWithdrawalLimits({
        minUsd: 0.50,
        minNgn: 100.00,
        exchangeRate: 1450,
      });
    }
  };

  const fetchBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await apiClient.request<{ banks: Bank[] }>('/v1/withdrawals/banks');
      if (response.ok && response.data) {
        setBanks(response.data.banks);
      } else {
        toast.error('Failed to load banks');
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      toast.error('Failed to load banks');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Validation chain - check each condition in order
  const validateWithdrawal = (): string[] => {
    const errors: string[] = [];
    
    try {
      const amount = parseFloat(coinAmount);
      
      // 1. Check if coin is selected and has value
      if (!coinSymbol) {
        errors.push('Please select a coin to withdraw');
        return errors; // Stop here if no coin selected
      }

      const selectedCoin = coinBalances.find(balance => balance.coin_symbol === coinSymbol);
      if (!selectedCoin) {
        errors.push('Selected coin not found in your wallet');
        return errors;
      }

      if (selectedCoin.value_usd <= 0) {
        errors.push('Selected coin has no USD value set');
        return errors;
      }

      // 2. Check if amount is valid
      if (!coinAmount || coinAmount.trim() === '') {
        errors.push('Please enter withdrawal amount');
        return errors;
      }

      if (isNaN(amount) || amount <= 0) {
        errors.push('Please enter a valid amount greater than 0');
        return errors;
      }

      // 3. Check if user has sufficient balance
      if (amount > selectedCoin.balance) {
        errors.push(`Insufficient balance. Available: ${selectedCoin.balance.toLocaleString()} ${coinSymbol}`);
        return errors;
      }

      // 4. Check minimum withdrawal using real config
      if (withdrawalLimits && typeof withdrawalLimits.minUsd === 'number' && typeof withdrawalLimits.minNgn === 'number') {
        const estimatedUsd = amount * selectedCoin.value_usd;
        
        // Check USD minimum
        if (estimatedUsd < withdrawalLimits.minUsd) {
          errors.push(`Minimum withdrawal is $${withdrawalLimits.minUsd.toFixed(2)} USD equivalent`);
          return errors;
        }
        
        // Check NGN minimum (rough estimate for UX)
        const estimatedNgn = estimatedUsd * withdrawalLimits.exchangeRate * 0.95; // Rough estimate after fees
        if (estimatedNgn < withdrawalLimits.minNgn) {
          errors.push(`Minimum final amount is approximately ₦${Math.round(withdrawalLimits.minNgn).toLocaleString()} (after fees)`);
          return errors;
        }
      }

      return errors; // No errors
    } catch (error) {
      console.error('Validation error:', error);
      return ['Validation error. Please try again.'];
    }
  };

  const calculateWithdrawal = async () => {
    if (!coinAmount || parseFloat(coinAmount) <= 0) return;

    setIsCalculating(true);
    setValidationErrors([]);
    
    try {
      const response = await apiClient.request<WithdrawalCalculation>('/v1/withdrawals/calculate', {
        method: 'POST',
        body: JSON.stringify({
          coin_symbol: coinSymbol,
          coin_amount: parseFloat(coinAmount),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok && response.data) {
        setWithdrawalCalculation(response.data);
        if (!response.data.is_valid && response.data.constraint_message) {
          setValidationErrors([response.data.constraint_message]);
        }
      } else {
        setValidationErrors(['Failed to calculate withdrawal. Please try again.']);
      }
    } catch (error) {
      console.error('Failed to calculate withdrawal:', error);
      setValidationErrors(['Network error. Please check your connection.']);
    } finally {
      setIsCalculating(false);
    }
  };

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode) return;
    
    setIsVerifying(true);
    try {
      const response = await apiClient.request<{ account_name: string }>('/v1/withdrawals/verify-account', {
        method: 'POST',
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok && response.data) {
        setAccountName(response.data.account_name);
        toast.success(`Account verified: ${response.data.account_name}`);
      } else {
        toast.error(response.errors?.[0]?.detail || 'Account verification failed');
        setAccountName('');
      }
    } catch (error) {
      console.error('Account verification failed:', error);
      toast.error('Failed to verify account');
      setAccountName('');
    } finally {
      setIsVerifying(false);
    }
  };

  const processWithdrawal = async () => {
    if (!withdrawalCalculation || !accountName) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.request('/v1/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          coin_symbol: coinSymbol,
          coin_amount: parseFloat(coinAmount),
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        toast.success('Withdrawal processed successfully! Funds will be sent to your account shortly.');
        onWithdrawalSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(response.errors?.[0]?.detail || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal processing failed:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('currency');
    setSelectedCurrency('NGN');
    setCoinAmount('');
    setBankCode('');
    setAccountNumber('');
    setAccountName('');
    setWithdrawalCalculation(null);
  };

  const handleClose = () => {
    if (!isProcessing && !isVerifying) {
      resetForm();
      onClose();
    }
  };

  const selectedCoinBalance = coinBalances.find(balance => balance.coin_symbol === coinSymbol);
  const selectedBank = banks.find(bank => bank.code === bankCode);

  // Convert banks to options for SearchableSelect
  const bankOptions: BankOption[] = banks.map(bank => ({
    value: bank.code,
    label: bank.name,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-green-600" />
            {step === 'currency' ? 'Choose Withdrawal Currency' : 'Withdraw to Bank Account'}
          </DialogTitle>
          <DialogDescription>
            {step === 'currency' 
              ? 'Select your preferred withdrawal currency and method'
              : selectedCurrency === 'NGN' 
                ? 'Convert your coins to Naira and withdraw instantly to your Nigerian bank account'
                : 'Convert your coins to USD and withdraw to your bank account'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'currency' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Withdrawal Method</h3>
              <p className="text-sm text-gray-500">Choose how you'd like to receive your funds</p>
            </div>

            <div className="grid gap-4">
              {/* Nigerian Naira Option */}
              <button
                onClick={() => {
                  setSelectedCurrency('NGN');
                  setStep('amount');
                }}
                className="relative p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 mb-1">Nigerian Naira (₦)</h4>
                    <p className="text-sm text-gray-600 mb-2">Withdraw to Nigerian bank accounts</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Instant transfer
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        All Nigerian banks
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Low fees
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
              </button>

              {/* US Dollar Option */}
              <button
                onClick={() => {
                  toast('USD withdrawals coming soon! We\'re working on global bank transfers.', {
                    icon: 'ℹ️',
                  });
                }}
                className="relative p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group opacity-75"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 mb-1">US Dollar ($)</h4>
                    <p className="text-sm text-gray-600 mb-2">Withdraw to international bank accounts</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Global bank transfers</span>
                      <span>•</span>
                      <span>Multiple countries</span>
                      <span>•</span>
                      <span>Competitive rates</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Banknote className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">More currencies coming soon</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    We're expanding to support EUR, GBP, and other major currencies. 
                    <span className="text-green-600 font-medium"> Stay tuned!</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'amount' && (
          <div className="space-y-4">
            {/* Currency Selection Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Withdrawing to: {selectedCurrency === 'NGN' ? 'Nigerian Naira (₦)' : 'US Dollar ($)'}
                </span>
                <button
                  onClick={() => setStep('currency')}
                  className="ml-auto text-xs text-green-600 hover:text-green-700 underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="coin-select">Select Coin</Label>
              <select
                id="coin-select"
                value={coinSymbol}
                onChange={(e: any) => setCoinSymbol(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isCalculating}
              >
                {coinBalances.map((balance) => (
                  <option key={balance.coin_symbol} value={balance.coin_symbol}>
                    {balance.coin_symbol} (Balance: {balance.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="amount-input">Amount to Withdraw</Label>
              <Input
                id="amount-input"
                type="number"
                value={coinAmount}
                onChange={(e: BasicChangeEvent) => setCoinAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.0001"
                disabled={isCalculating}
                className={validationErrors.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {selectedCoinBalance && (
                <p className="text-sm text-gray-500 mt-1">
                  Available: {selectedCoinBalance.balance.toLocaleString()} {coinSymbol}
                </p>
              )}
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {isCalculating && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </div>
            )}

            {withdrawalCalculation && (
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <h4 className="font-medium text-gray-900">Withdrawal Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Coin Amount:</span>
                    <span>{withdrawalCalculation.coin_amount} {withdrawalCalculation.coin_symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>USD Value:</span>
                    <span>${withdrawalCalculation.usd_amount.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{selectedCurrency} Amount:</span>
                    <span>
                      {selectedCurrency === 'NGN' 
                        ? `₦${withdrawalCalculation.ngn_amount.toLocaleString()}`
                        : `$${withdrawalCalculation.usd_amount.toFixed(2)}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Fees:</span>
                    <span>
                      {selectedCurrency === 'NGN' 
                        ? `₦${withdrawalCalculation.fee_amount.toLocaleString()}`
                        : `$${(withdrawalCalculation.fee_amount / withdrawalCalculation.exchange_rate).toFixed(2)}`
                      }
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-green-600">
                    <span>You'll Receive:</span>
                    <span>
                      {selectedCurrency === 'NGN' 
                        ? `₦${withdrawalCalculation.final_amount.toLocaleString()}`
                        : `$${(withdrawalCalculation.final_amount / withdrawalCalculation.exchange_rate).toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>
                {!withdrawalCalculation.is_valid && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                    <p className="text-red-700 text-sm">
                      Minimum withdrawal amount is ₦{withdrawalCalculation.min_final_ngn.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={() => setStep('bank')} 
              disabled={validationErrors.length > 0 || !withdrawalCalculation?.is_valid || isCalculating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {validationErrors.length > 0 ? 'Fix errors to continue' : 'Continue to Bank Details'}
            </Button>
          </div>
        )}

        {step === 'bank' && (
          <div className="space-y-4">
            {/* Currency Selection Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {selectedCurrency === 'NGN' ? 'Nigerian Bank Transfer' : 'International Bank Transfer'}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="bank-select">
                {selectedCurrency === 'NGN' ? 'Select Nigerian Bank' : 'Select Bank'}
              </Label>
              {isLoadingBanks ? (
                <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  <span className="text-gray-600">Loading banks...</span>
                </div>
              ) : (
                <SearchableSelect
                  options={bankOptions}
                  value={bankCode}
                  onChange={(value) => {
                    setBankCode(value);
                    setAccountName(''); // Reset account name when bank changes
                  }}
                  placeholder="Search and select your bank"
                  disabled={isVerifying}
                  className="mt-1"
                />
              )}
            </div>

            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e: BasicChangeEvent) => {
                  setAccountNumber(e.target.value);
                  setAccountName(''); // Reset account name when number changes
                }}
                placeholder="Enter 10-digit account number"
                maxLength={10}
                disabled={isVerifying}
              />
            </div>

            <Button 
              onClick={verifyAccount}
              disabled={!bankCode || accountNumber.length !== 10 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying Account...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>

            {accountName && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-green-800 font-medium">Account Verified</p>
                </div>
                <p className="text-green-700 text-sm mt-1">{accountName}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('amount')} 
                className="flex-1"
                disabled={isVerifying}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm')} 
                disabled={!accountName || isVerifying}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && withdrawalCalculation && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3 text-gray-900">Withdrawal Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{coinAmount} {coinSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span className="font-medium">{selectedBank?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account:</span>
                  <span className="font-medium">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Name:</span>
                  <span className="font-medium">{accountName}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-green-600">
                  <span>You'll Receive:</span>
                  <span>₦{withdrawalCalculation.final_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-800 text-sm">
                <strong>Processing Time:</strong> Instant to 30 minutes
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('bank')} 
                className="flex-1"
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={processWithdrawal}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
