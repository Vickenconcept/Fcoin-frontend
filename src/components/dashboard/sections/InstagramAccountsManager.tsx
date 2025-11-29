import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { SocialAccount } from '../hooks/useSocialAccounts';

type InstagramAccountsManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SocialAccount[];
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: (accountId: string) => void;
};

export function InstagramAccountsManager({
  open,
  onOpenChange,
  accounts,
  isConnecting,
  onConnect,
  onDisconnect,
}: InstagramAccountsManagerProps) {
  const handleDisconnect = (accountId: string) => {
    onDisconnect(accountId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle>Manage Instagram Accounts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-slate-900 font-semibold">Connected Accounts</h4>
              <p className="text-sm text-slate-500">
                Each Instagram account should be linked to a Facebook Page you manage.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isConnecting}
              onClick={onConnect}
            >
              {isConnecting ? 'Connecting…' : 'Connect Account'}
            </Button>
          </div>

          <ScrollArea className="max-h-72 pr-1">
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/40 p-6 text-center text-sm text-slate-600">
                  No Instagram accounts connected yet. Connect one to start syncing posts.
                </div>
              ) : (
                accounts.map((account) => {
                  const usernameLabel = account.provider_username
                    ? `${account.provider_username.startsWith('@') ? '' : '@'}${account.provider_username}`
                    : account.provider_user_id;

                  return (
                    <div
                      key={account.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-orange-100 bg-white p-4"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {account.provider_picture_url && (
                          <img
                            src={account.provider_picture_url}
                            alt={account.provider_username || 'Instagram'}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            onError={(e: { currentTarget: HTMLImageElement }) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-slate-900 font-medium truncate">{usernameLabel}</p>
                            <Badge className="bg-orange-100 text-orange-600 border-orange-200 flex-shrink-0">Instagram</Badge>
                          </div>
                        <p className="text-xs text-slate-500">
                          Account ID:{' '}
                          <span className="font-mono text-slate-700">{account.provider_user_id ?? '—'}</span>
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
                            {account.last_synced_at ? new Date(account.last_synced_at).toLocaleString() : '—'}
                          </span>
                        </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
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

