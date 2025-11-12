import * as React from 'react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { apiClient } from '../../lib/apiClient';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coinSymbol: string;
  conversionRate: number;
  coinValueUsd?: number;
  returnPath?: string;
}

type SubmitEvent = { preventDefault: () => void };
type InputChangeEvent = { target: { value: string } };

export function TopUpModal({ open, onOpenChange, coinSymbol, conversionRate, coinValueUsd = 0, returnPath }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset form when modal opens
    if (open) {
      setAmount('');
    }
  }, [open]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountValue < 1) {
      toast.error('Minimum top-up amount is $1 USD');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.request<{ checkout_url: string }>('/v1/wallets/topups', {
        method: 'POST',
        body: {
          amount: amountValue,
          coin_symbol: coinSymbol,
          return_url: returnPath ?? `${window.location.origin}${window.location.pathname}`,
        } as any,
      });

      if (response.ok && response.data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        const errorMessage = response.errors?.[0]?.detail || 'Failed to create payment';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating top-up:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const coinAmount = amount ? (parseFloat(amount) * conversionRate).toFixed(2) : '0';
  const formattedCoinValue = Number.isFinite(coinValueUsd)
    ? coinValueUsd.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
    : '—';
  const coinsPerUsdDisplay = Number.isFinite(conversionRate)
    ? conversionRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Fund {coinSymbol} Pool</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="text-slate-600 mb-2 block">Amount (USD)</label>
            <Input
              type="number"
              step="0.01"
              min="1"
              placeholder="10.00"
              value={amount}
              onChange={(event: InputChangeEvent) => setAmount(event.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-slate-500 mt-1">Minimum: $1.00 USD</p>
          </div>

          <Card className="p-4 bg-purple-50 border-purple-100">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">You will pay:</span>
                <span className="text-slate-900 font-medium">${amount || '0.00'} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">You will receive:</span>
                <span className="text-purple-600 font-medium">
                  {coinAmount} {coinSymbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Conversion rate:</span>
                <span className="text-slate-500">1 USD ≈ {coinsPerUsdDisplay} {coinSymbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Coin value:</span>
                <span className="text-slate-500">1 {coinSymbol} ≈ ${formattedCoinValue} USD</span>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading || !amount || parseFloat(amount) < 1}
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

