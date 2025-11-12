import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

type AdminCoin = {
  id: string;
  symbol: string;
  name: string | null;
  description: string | null;
  value_usd: number;
  value_updated_at?: string | null;
  creator?: {
    id: string;
    username: string;
    display_name?: string | null;
  } | null;
};

type NumberInputEvent = { target: { value: string } };

const MIN_VALUE = 0.0000000001;

export default function AdminCoinValuesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = useMemo(() => user?.user_type === 'super_admin', [user?.user_type]);

  const [coins, setCoins] = useState<AdminCoin[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const formatValue = (value: number) =>
    Number.isFinite(value)
      ? value.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
      : '—';

  const loadCoins = async (options: { silent?: boolean } = {}) => {
    if (!isSuperAdmin) {
      return;
    }

    if (!options.silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setPermissionError(null);

    try {
      const response = await apiClient.request<{ coins: AdminCoin[] }>('/v1/admin/coins');

      if (response.status === 403) {
        setPermissionError('You do not have permission to manage coin values.');
        setCoins([]);
        setFormValues({});
        return;
      }

      if (!response.ok || !response.data?.coins) {
        const detail = response.errors?.[0]?.detail ?? 'Unable to load coins.';
        toast.error(detail);
        return;
      }

      const nextCoins = response.data.coins;
      setCoins(nextCoins);
      setFormValues(
        nextCoins.reduce<Record<string, string>>((acc, coin) => {
          acc[coin.id] = coin.value_usd?.toString() ?? '';
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error('[AdminCoinValuesPage] loadCoins error', error);
      toast.error('Failed to load coin values. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    loadCoins().catch((error) => {
      console.error(error);
    });
  }, [isSuperAdmin]);

  const handleValueChange = (coinId: string) => (event: NumberInputEvent) => {
    const nextValue = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [coinId]: nextValue,
    }));
  };

  const handleSave = async (coin: AdminCoin) => {
    const input = formValues[coin.id];
    const parsed = Number(input);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Enter a positive value greater than zero.');
      return;
    }

    setSavingId(coin.id);
    try {
      const response = await apiClient.request(`/v1/coins/${coin.id}/value`, {
        method: 'PATCH',
        body: {
          value_usd: parsed,
        } as any,
      });

      if (!response.ok || !response.data) {
        const detail = response.errors?.[0]?.detail ?? 'Unable to update coin value.';
        toast.error(detail);
        return;
      }

      setCoins((prev) =>
        prev.map((item) =>
          item.id === coin.id
            ? {
                ...item,
                value_usd: parsed,
                value_updated_at: response.data.value_updated_at,
              }
            : item,
        ),
      );

      toast.success(`${coin.symbol} value updated.`);
    } catch (error) {
      console.error('[AdminCoinValuesPage] handleSave error', error);
      toast.error('Failed to update coin value. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleReset = (coin: AdminCoin) => {
    setFormValues((prev) => ({
      ...prev,
      [coin.id]: coin.value_usd?.toString() ?? '',
    }));
  };

  const renderCoinCard = (coin: AdminCoin) => {
    const input = formValues[coin.id] ?? '';
    const numericInput = Number(input);
    const hasChanged = input !== '' && Math.abs(numericInput - coin.value_usd) > 0;
    const invalid =
      input.trim() === '' || !Number.isFinite(numericInput) || numericInput < MIN_VALUE;
    const lastUpdatedLabel =
      coin.value_updated_at && new Date(coin.value_updated_at).toString() !== 'Invalid Date'
        ? new Date(coin.value_updated_at).toLocaleString()
        : null;

    return (
      <Card key={coin.id} className="p-6 border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{coin.symbol}</h3>
            {coin.name && <p className="text-sm text-slate-500">{coin.name}</p>}
            {coin.description && <p className="mt-1 text-sm text-slate-500">{coin.description}</p>}
          </div>
          {coin.creator && (
            <div className="text-right text-sm text-slate-500">
              <p>Creator</p>
              <p className="font-medium text-slate-700">
                {coin.creator.display_name ?? coin.creator.username}
              </p>
              <p className="text-xs text-slate-400">@{coin.creator.username}</p>
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600">Coin Value (USD)</label>
          <Input
            type="number"
            step="0.000001"
            min="0"
            value={input}
            onChange={handleValueChange(coin.id)}
            disabled={savingId === coin.id}
          />
          <p className="text-xs text-slate-500">
            Current: ${formatValue(coin.value_usd)} USD per coin
            {lastUpdatedLabel ? ` · Updated ${lastUpdatedLabel}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleSave(coin)}
            disabled={savingId === coin.id || invalid || !hasChanged}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            {savingId === coin.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Value'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleReset(coin)}
            disabled={savingId === coin.id || !hasChanged}
          >
            Reset
          </Button>
        </div>
      </Card>
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-rose-200 bg-rose-50 text-rose-800 p-6 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 mx-auto" />
          <h2 className="text-lg font-semibold">Restricted Access</h2>
          <p className="text-sm">
            You need a super admin account to manage coin values. Please contact an administrator if
            you believe this is an error.
          </p>
          <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin · Coin Values</h1>
              <p className="text-sm text-slate-500">
                Adjust the live USD value for each creator coin. Updates take effect immediately in
                wallets, top-ups, and redemptions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/home')}>
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => loadCoins({ silent: coins.length > 0 })}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {permissionError ? (
          <Card className="border-rose-200 bg-rose-50 text-rose-800 p-6">
            <p className="text-sm font-medium">{permissionError}</p>
          </Card>
        ) : isLoading && coins.length === 0 ? (
          <Card className="p-10 border-purple-100 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              <span>Loading coin data…</span>
            </div>
          </Card>
        ) : coins.length === 0 ? (
          <Card className="p-10 border-purple-100 text-center text-slate-600">
            <p>No creator coins found.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {coins.map((coin) => renderCoinCard(coin))}
          </div>
        )}
      </div>
    </div>
  );
}

