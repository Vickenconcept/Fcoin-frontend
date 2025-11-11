import React, { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

interface LaunchCoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LaunchCoinModal({ open, onOpenChange, onSuccess }: LaunchCoinModalProps) {
  const { refreshUser } = useAuth();
  const [coinSymbol, setCoinSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!coinSymbol.trim()) {
      toast.error('Please enter a coin symbol');
      return;
    }

    // Validate coin symbol format (uppercase letters and numbers only, max 10 chars)
    const symbolRegex = /^[A-Z0-9]{1,10}$/;
    if (!symbolRegex.test(coinSymbol.toUpperCase())) {
      toast.error('Coin symbol must be 1-10 uppercase letters and numbers only');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.request('/v1/coins/create', {
        method: 'POST',
        body: { coin_symbol: coinSymbol.toUpperCase() } as any,
      });

      if (response.ok) {
        toast.success('Coin created successfully!');
        await refreshUser();
        setCoinSymbol('');
        onSuccess();
      } else {
        const errorMessage = response.errors?.[0]?.detail || 'Failed to create coin';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error creating coin:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Create Your Coin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="text-slate-600 mb-2 block">Coin Symbol</label>
            <Input
              placeholder="e.g., SARAH, DAVID, MYCOIN (1-10 characters, uppercase)"
              value={coinSymbol}
              onChange={(e) => setCoinSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={10}
              disabled={isLoading}
            />
            <p className="text-sm text-slate-500 mt-1">
              Choose a unique symbol for your coin (e.g., SARAH, DPARK). Only uppercase letters and numbers.
            </p>
          </div>

          <Card className="p-4 bg-purple-50 border-purple-100">
            <p className="text-slate-600 mb-1">Important</p>
            <p className="text-slate-900 text-sm">
              • Coin symbols must be unique across all users
              <br />
              • Once created, your coin symbol cannot be changed
              <br />
              • Your coin symbol will be used to track distributions
            </p>
          </Card>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={isLoading || !coinSymbol.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Coin'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
