import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { AlertTriangle, CheckCircle, Gift, Loader2, Sparkles, Wallet, Banknote } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { WithdrawalModal } from '../WithdrawalModal';

type BasicChangeEvent = { target: { value: string } };
type UsernameLookupResult = { id: string; username: string; display_name?: string | null };
type WalletCoinBalance = {
  coin_symbol: string;
  balance: number;
  value_usd: number;
  fiat_value_usd: number;
  value_updated_at?: string | null;
};

type WalletSectionProps = {
  earnedCoinsDisplay: string;
};

export function WalletSection({ earnedCoinsDisplay }: WalletSectionProps) {
  const navigate = useNavigate();
  const [walletCurrency, setWalletCurrency] = useState<string>('FCN');
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [primaryCoinValueUsd, setPrimaryCoinValueUsd] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [coinBalances, setCoinBalances] = useState<WalletCoinBalance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transferUsername, setTransferUsername] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCoinSymbol, setTransferCoinSymbol] = useState('FCN');
  const [transferNote, setTransferNote] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameInfo, setUsernameInfo] = useState<UsernameLookupResult | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<any>('/v1/wallets/me');
      if (response.ok && response.data) {
        const primaryCoin = response.data.primary_coin || response.data.currency || 'FCN';
        setWalletCurrency(primaryCoin);
        const nextCoinValue = Number(response.data.primary_coin_value_usd ?? 0);
        setPrimaryCoinValueUsd(Number.isFinite(nextCoinValue) ? nextCoinValue : 0);
        const coinsPerUsd = Number(response.data.conversion_rate ?? 0);
        setConversionRate(coinsPerUsd > 0 ? coinsPerUsd : 1);
        const balances: WalletCoinBalance[] = Array.isArray(response.data.coin_balances)
          ? response.data.coin_balances.map((balance: any) => ({
              coin_symbol: String(balance.coin_symbol ?? '').toUpperCase(),
              balance: Number(balance.balance ?? 0) || 0,
              value_usd: Number(balance.value_usd ?? 0) || 0,
              fiat_value_usd: Number(balance.fiat_value_usd ?? 0) || 0,
              value_updated_at: balance.value_updated_at ?? null,
            }))
          : [];
        setCoinBalances(balances);
        setTransactions(response.data.transactions || []);
        setTransferCoinSymbol((prev) => (prev ? prev.toUpperCase() : primaryCoin));
        
        // Fetch withdrawals
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Unable to load wallet details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await apiClient.request<any>('/v1/withdrawals');
      if (response.ok && response.data) {
        setWithdrawals(response.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (coinBalances.length > 0) {
      setTransferCoinSymbol((prev) => {
        const hasPrev = coinBalances.some((balance) => balance.coin_symbol === prev);
        return hasPrev ? prev : coinBalances[0].coin_symbol;
      });
    }
  }, [coinBalances]);

  const resetTransferForm = useCallback(() => {
    setTransferUsername('');
    setTransferAmount('');
    setTransferNote('');
    setUsernameCheck('idle');
    setUsernameInfo(null);
    setUsernameError(null);
  }, []);

  useEffect(() => {
    if (!isSendDialogOpen) {
      return;
    }

    const trimmed = transferUsername.trim();

    if (!trimmed) {
      setUsernameCheck('idle');
      setUsernameInfo(null);
      setUsernameError(null);
      return;
    }

    setUsernameCheck('checking');
    setUsernameError(null);
    const currentUsername = trimmed;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await apiClient.request<UsernameLookupResult>(
          `/v1/users/lookup?username=${encodeURIComponent(currentUsername)}`,
        );

        if (transferUsername.trim() !== currentUsername) {
          return;
        }

        if (response.ok && response.data) {
          setUsernameCheck('valid');
          setUsernameInfo(response.data);
          setUsernameError(null);
        } else {
          setUsernameCheck('invalid');
          setUsernameInfo(null);
          setUsernameError(response.errors?.[0]?.detail ?? 'User not found.');
        }
      } catch (error) {
        console.error('[WalletSection] validate username', error);
        if (transferUsername.trim() !== currentUsername) {
          return;
        }

        setUsernameCheck('invalid');
        setUsernameInfo(null);
        setUsernameError('Unable to verify username right now. Please try again.');
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [transferUsername, isSendDialogOpen]);

  const handleTransfer = async () => {
    const trimmedUsername = transferUsername.trim();
    const numericAmount = Number(transferAmount);

    if (!trimmedUsername) {
      toast.error('Enter the username you want to send coins to.');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }

    if (usernameCheck !== 'valid' || !usernameInfo) {
      toast.error('Please enter a valid username before sending coins.');
      return;
    }

    setIsTransferring(true);
    try {
      const trimmedNote = transferNote.trim();
      const response = await apiClient.request('/v1/wallets/transfers', {
        method: 'POST',
        body: {
          recipient_username: trimmedUsername,
          amount: numericAmount,
          coin_symbol: transferCoinSymbol,
          note: trimmedNote || undefined,
        } as any,
      });

      if (!response.ok) {
        const detail = response.errors?.[0]?.detail ?? 'Unable to send coins right now.';
        toast.error(detail);
        return;
      }

      const recipientLabel = usernameInfo.display_name ?? usernameInfo.username ?? trimmedUsername;
      toast.success(`Sent ${numericAmount} ${transferCoinSymbol} to ${recipientLabel}.`);
      resetTransferForm();
      setIsSendDialogOpen(false);
      await fetchWallet();
    } catch (error) {
      console.error('Coin transfer failed', error);
      toast.error('Unable to send coins. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const sortedCoinBalances = useMemo(
    () => [...coinBalances].sort((a, b) => a.coin_symbol.localeCompare(b.coin_symbol)),
    [coinBalances],
  );

  const formatFiat = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      Number.isFinite(value)
        ? value.toLocaleString(undefined, {
            minimumFractionDigits: options?.minimumFractionDigits ?? 2,
            maximumFractionDigits: options?.maximumFractionDigits ?? 2,
          })
        : '—',
    [],
  );

  const formatCoinValue = useCallback(
    (value: number) =>
      Number.isFinite(value)
        ? value.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
        : '—',
    [],
  );

  const walletFiatValue = useMemo(
    () =>
      coinBalances.reduce((sum, balance) => {
        if (!Number.isFinite(balance.fiat_value_usd)) {
          return sum;
        }

        return sum + balance.fiat_value_usd;
      }, 0),
    [coinBalances],
  );

  const totalCoinSymbols = useMemo(() => coinBalances.length, [coinBalances]);
  const totalUnitsHeld = useMemo(
    () =>
      coinBalances.reduce((sum, balance) => {
        if (!Number.isFinite(balance.balance)) {
          return sum;
        }

        return sum + balance.balance;
      }, 0),
    [coinBalances],
  );

  const coinsPerUsdDisplay = useMemo(() => {
    if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
      return '—';
    }

    return conversionRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [conversionRate]);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 mb-1">Wallet Value</p>
            <p className="mb-2 text-2xl">≈ ${formatFiat(walletFiatValue)} USD</p>
            <p className="text-purple-100">
              {totalCoinSymbols} coin{totalCoinSymbols === 1 ? '' : 's'} · total units held: {totalUnitsHeld.toLocaleString()}
            </p>
            <p className="text-purple-100">
              1 {walletCurrency} ≈ ${formatCoinValue(primaryCoinValueUsd)} USD · 1 USD ≈ {coinsPerUsdDisplay}{' '}
              {walletCurrency}
            </p>
          </div>
          <Wallet className="w-16 h-16 opacity-50" />
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <Button
            className="bg-white text-purple-600 hover:bg-purple-50"
            onClick={() => navigate('/dashboard/my-coin')}
          >
            Manage Coins
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => setIsSendDialogOpen(true)}
            >
              Send Coins
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => setIsWithdrawDialogOpen(true)}
            >
              <Banknote className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white text-black">
          <DialogHeader>
            <DialogTitle>Send Coins</DialogTitle>
            <DialogDescription>Gift your coins to another user by entering their username.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-username">Recipient Username</Label>
              <Input
                id="transfer-username"
                placeholder="e.g. fan_username"
                value={transferUsername}
                onChange={(event: BasicChangeEvent) => setTransferUsername(event.target.value)}
                disabled={isTransferring}
              />
              <div className="min-h-[1.5rem] text-xs text-slate-500 flex items-center gap-2">
                {usernameCheck === 'idle' && (
                  <span>Enter the username of the fan or creator you want to gift.</span>
                )}
                {usernameCheck === 'checking' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                    <span className="text-purple-600">Checking username…</span>
                  </>
                )}
                {usernameCheck === 'valid' && usernameInfo && (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">
                      {usernameInfo.display_name ?? usernameInfo.username} is valid.
                    </span>
                  </>
                )}
                {usernameCheck === 'invalid' && (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-600">{usernameError ?? 'User not found.'}</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                min="0"
                step="0.01"
                value={transferAmount}
                onChange={(event: BasicChangeEvent) => setTransferAmount(event.target.value)}
                disabled={isTransferring}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-coin">Coin</Label>
              <select
                id="transfer-coin"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={transferCoinSymbol}
                onChange={(event: BasicChangeEvent) => setTransferCoinSymbol(event.target.value.toUpperCase())}
                disabled={isTransferring}
              >
                {sortedCoinBalances.length === 0 && (
                  <option value={walletCurrency}>{walletCurrency}</option>
                )}
                {sortedCoinBalances.map((balance) => (
                  <option key={balance.coin_symbol} value={balance.coin_symbol}>
                    {balance.coin_symbol} (balance: {balance.balance})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-note">Note (optional)</Label>
              <Input
                id="transfer-note"
                value={transferNote}
                onChange={(event: BasicChangeEvent) => setTransferNote(event.target.value)}
                maxLength={255}
                disabled={isTransferring}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetTransferForm();
                setIsSendDialogOpen(false);
              }}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || usernameCheck !== 'valid'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isTransferring ? 'Sending…' : 'Send Coins'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WithdrawalModal
        isOpen={isWithdrawDialogOpen}
        onClose={() => setIsWithdrawDialogOpen(false)}
        coinBalances={sortedCoinBalances}
        onWithdrawalSuccess={() => {
          fetchWallet();
          fetchWithdrawals();
        }}
      />

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="w-full grid grid-cols-3 gap-2 bg-purple-50/70 p-2 rounded-xl border border-purple-100">
          <TabsTrigger
            value="balances"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>My Coins</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-4 h-4" />
              <span>Transactions</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <Banknote className="w-4 h-4" />
              <span>Withdrawals</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4 mt-6">
          {isLoading ? (
            <Card className="p-6 border-purple-100 bg-white">
              <p className="text-slate-600">Loading wallet data...</p>
            </Card>
          ) : sortedCoinBalances.length === 0 ? (
            <Card className="p-6 border-purple-100 bg-white text-center">
              <p className="text-slate-900 font-medium mb-2">No coins yet</p>
              <p className="text-slate-600">
                Start following creators and engaging with their content to earn coins!
              </p>
            </Card>
          ) : (
            sortedCoinBalances.map(({ coin_symbol, balance, value_usd, fiat_value_usd, value_updated_at }) => {
              const lastUpdatedLabel = value_updated_at
                ? (() => {
                    const parsed = new Date(value_updated_at);
                    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString();
                  })()
                : null;

              return (
                <Card key={coin_symbol} className="p-6 border-purple-100 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{coin_symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">{coin_symbol} Coins</p>
                        <p className="text-slate-500">
                          1 {coin_symbol} ≈ ${formatCoinValue(value_usd)} USD · Wallet value ≈ ${
                            formatFiat(fiat_value_usd)
                          }
                        </p>
                        {lastUpdatedLabel && (
                          <p className="text-slate-400 text-xs">Updated {lastUpdatedLabel}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-purple-600">
                      <Sparkles className="w-6 h-6" />
                      <span className="text-2xl font-bold">{balance.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card className="p-6 border-purple-100 bg-white">
            <h4 className="text-slate-900 font-semibold mb-4">Recent Transactions</h4>
            {isLoading ? (
              <p className="text-slate-600">Loading transactions…</p>
            ) : transactions.length === 0 ? (
              <p className="text-slate-500">No recent transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => {
                  const type = String(transaction.type ?? '').toUpperCase();
                  const amount = Number(transaction.amount ?? 0);
                  const timestamp = transaction.created_at
                    ? new Date(transaction.created_at).toLocaleString()
                    : '';
                  const directionLabel =
                    type === 'CREDIT'
                      ? 'Received'
                      : type === 'DEBIT'
                      ? 'Sent'
                      : type === 'REWARD'
                      ? 'Reward'
                      : type;

                  const counterparty =
                    transaction.metadata?.to_username ??
                    transaction.metadata?.from_username ??
                    transaction.metadata?.note ??
                    '—';

                  const badgeColorClass = (() => {
                    switch (type) {
                      case 'CREDIT':
                        return 'bg-green-100 text-green-700';
                      case 'DEBIT':
                        return 'bg-amber-100 text-amber-700';
                      case 'REWARD':
                        return 'bg-purple-100 text-purple-700';
                      default:
                        return 'bg-slate-100 text-slate-600';
                    }
                  })();

                  return (
                    <div
                      key={transaction.id}
                      className="grid gap-2 rounded-md border border-slate-200 p-3 text-sm sm:grid-cols-4 sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${badgeColorClass}`}
                        >
                          {directionLabel}
                        </span>
                        <span className="font-medium text-slate-900">
                          {amount.toLocaleString()} {transaction.currency}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        With: <span className="font-medium text-slate-900">{counterparty}</span>
                      </div>
                      <div className="text-slate-600">
                        Balance → {Number(transaction.balance_after ?? 0).toLocaleString()}
                      </div>
                      <div className="text-right text-slate-500 text-xs sm:text-sm">{timestamp}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4 mt-6">
          <Card className="p-6 border-purple-100 bg-white">
            <h4 className="text-slate-900 font-semibold mb-4">Withdrawal History</h4>
            {isLoading ? (
              <p className="text-slate-600">Loading withdrawals…</p>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">No withdrawals yet</p>
                <p className="text-slate-400 text-sm">Your withdrawal history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.slice(0, 10).map((withdrawal) => {
                  const status = String(withdrawal.status ?? '').toUpperCase();
                  const amount = Number(withdrawal.final_amount ?? 0);
                  const coinAmount = Number(withdrawal.coin_amount ?? 0);
                  const timestamp = withdrawal.created_at
                    ? new Date(withdrawal.created_at).toLocaleString()
                    : '';

                  const statusColorClass = (() => {
                    switch (status) {
                      case 'SUCCESS':
                        return 'bg-green-100 text-green-700';
                      case 'PENDING':
                      case 'PROCESSING':
                        return 'bg-yellow-100 text-yellow-700';
                      case 'FAILED':
                      case 'CANCELLED':
                        return 'bg-red-100 text-red-700';
                      default:
                        return 'bg-slate-100 text-slate-600';
                    }
                  })();

                  const statusLabel = (() => {
                    switch (status) {
                      case 'SUCCESS':
                        return 'Completed';
                      case 'PENDING':
                        return 'Pending';
                      case 'PROCESSING':
                        return 'Processing';
                      case 'FAILED':
                        return 'Failed';
                      case 'CANCELLED':
                        return 'Cancelled';
                      default:
                        return status;
                    }
                  })();

                  return (
                    <div
                      key={withdrawal.id}
                      className="grid gap-2 rounded-md border border-slate-200 p-3 text-sm sm:grid-cols-4 sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusColorClass}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="font-medium text-slate-900">
                          {coinAmount.toLocaleString()} {withdrawal.coin_symbol}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        To: <span className="font-medium text-slate-900">{withdrawal.account_number}</span>
                      </div>
                      <div className="text-slate-600">
                        Amount: <span className="font-medium text-green-600">₦{amount.toLocaleString()}</span>
                      </div>
                      <div className="text-right text-slate-500 text-xs sm:text-sm">{timestamp}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

