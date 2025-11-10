import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Gift, Sparkles, Wallet, Plus } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { TopUpModal } from '../TopUpModal';

type WalletSectionProps = {
  earnedCoinsDisplay: string;
};

export function WalletSection({ earnedCoinsDisplay }: WalletSectionProps) {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletCurrency, setWalletCurrency] = useState<string>('FCN');
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<any>('/v1/wallets/me');
      if (response.ok && response.data) {
        setWalletBalance(response.data.balance || 0);
        setWalletCurrency(response.data.currency || 'FCN');
        setConversionRate(response.data.conversion_rate || 1);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Handle payment redirects (success/cancel from Stripe)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your wallet has been credited.');
      // Refresh wallet data
      fetchWallet();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      toast.error('Payment was cancelled.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchWallet]);

  // Group transactions by currency (creator's coin symbol)
  const transactionsByCurrency = transactions.reduce((acc, tx) => {
    const currency = tx.currency || 'FCN';
    if (!acc[currency]) {
      acc[currency] = [];
    }
    acc[currency].push(tx);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate total per currency
  const currencyTotals = Object.entries(transactionsByCurrency).map((entry) => {
    const [currency, txs] = entry as [string, any[]];
    const total = txs
      .filter((tx: any) => tx.type === 'CREDIT' || tx.type === 'TOPUP')
      .reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount) || 0), 0);
    return { currency, total, transactions: txs };
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 border-purple-100 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 mb-1">Wallet Balance</p>
            <p className="mb-2 text-2xl">{walletBalance.toLocaleString()} {walletCurrency}</p>
            <p className="text-purple-100">Conversion Rate: 1 USD = {conversionRate} coins</p>
          </div>
          <Wallet className="w-16 h-16 opacity-50" />
        </div>
        <Button
          className="mt-4 bg-white text-purple-600 hover:bg-purple-50"
          onClick={() => setTopUpModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Coins
        </Button>
      </Card>

      <Tabs defaultValue="coins" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="coins">My Coins</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="space-y-4 mt-6">
          {isLoading ? (
            <Card className="p-6 border-purple-100">
              <p className="text-slate-600">Loading wallet data...</p>
            </Card>
          ) : currencyTotals.length === 0 ? (
            <Card className="p-6 border-purple-100 text-center">
              <p className="text-slate-900 font-medium mb-2">No coins yet</p>
              <p className="text-slate-600">Start following creators and engaging with their content to earn coins!</p>
            </Card>
          ) : (
            currencyTotals.map(({ currency, total }) => (
              <Card key={currency} className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{currency.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">{currency} Coins</p>
                      <p className="text-slate-500">From {currency} creator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-2xl font-bold">{total.toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View Transaction History
                </Button>
              </Card>
            ))
          )}
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

      {/* Top Up Modal */}
      <TopUpModal
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        onSuccess={() => {
          setTopUpModalOpen(false);
          fetchWallet();
        }}
        conversionRate={conversionRate}
        walletCurrency={walletCurrency}
      />
    </div>
  );
}

