import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Gift, Sparkles, Wallet } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

type WalletSectionProps = {
  earnedCoinsDisplay: string;
};

export function WalletSection({ earnedCoinsDisplay }: WalletSectionProps) {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletCurrency, setWalletCurrency] = useState<string>('FCN');
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [coinBalances, setCoinBalances] = useState<Array<{ coin_symbol: string; balance: number }>>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.request<any>('/v1/wallets/me');
      if (response.ok && response.data) {
        setWalletBalance(response.data.balance || 0);
        setWalletCurrency(response.data.primary_coin || response.data.currency || 'FCN');
        setConversionRate(response.data.conversion_rate || 1);
        setCoinBalances(response.data.coin_balances || []);
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

  const sortedCoinBalances = [...coinBalances].sort((a, b) => a.coin_symbol.localeCompare(b.coin_symbol));

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
          onClick={() => navigate('/dashboard/my-coin')}
        >
          Manage Coins
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
          ) : sortedCoinBalances.length === 0 ? (
            <Card className="p-6 border-purple-100 text-center">
              <p className="text-slate-900 font-medium mb-2">No coins yet</p>
              <p className="text-slate-600">Start following creators and engaging with their content to earn coins!</p>
            </Card>
          ) : (
            sortedCoinBalances.map(({ coin_symbol, balance }) => (
              <Card key={coin_symbol} className="p-6 border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{coin_symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">{coin_symbol} Coins</p>
                      <p className="text-slate-500">Balance held in your wallet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-2xl font-bold">{balance.toLocaleString()}</span>
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
    </div>
  );
}

