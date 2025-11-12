import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { SocialAccount } from '../hooks/useSocialAccounts';

type TikTokAccountsManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SocialAccount[];
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: (accountId: string) => void;
};

export function TikTokAccountsManager({
  open,
  onOpenChange,
  accounts,
  isConnecting,
  onConnect,
  onDisconnect,
}: TikTokAccountsManagerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle>Manage TikTok Accounts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-slate-900 font-semibold">Creator Accounts</h4>
              <p className="text-sm text-slate-500">
                Add or remove TikTok creator accounts you want to sync.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600"
              disabled={isConnecting}
              onClick={onConnect}
            >
              {isConnecting ? 'Connecting…' : 'Connect Creator'}
            </Button>
          </div>

          <ScrollArea className="max-h-72 pr-1">
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50/40 p-6 text-center text-sm text-slate-600">
                  No TikTok creator accounts connected yet.
                </div>
              ) : (
                accounts.map((account) => {
                  const usernameLabel = account.provider_username
                    ? `${account.provider_username.startsWith('@') ? '' : '@'}${account.provider_username}`
                    : account.provider_user_id;

                  return (
                    <div
                      key={account.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-sky-100 bg-white p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 font-medium">{usernameLabel}</p>
                          <Badge className="bg-sky-100 text-sky-600 border-sky-200">Creator</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Account ID:{' '}
                          <span className="font-mono text-slate-700">
                            {account.provider_user_id ?? '—'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Connected:{' '}
                          <span className="text-slate-700">
                            {account.connected_at ? new Date(account.connected_at).toLocaleString() : '—'}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Last synced:{' '}
                          <span className="text-slate-700">
                            {account.last_synced_at
                              ? new Date(account.last_synced_at).toLocaleString()
                              : '—'}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDisconnect(account.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

