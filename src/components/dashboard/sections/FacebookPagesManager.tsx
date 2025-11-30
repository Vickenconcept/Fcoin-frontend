import React, { useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFacebookPages } from '../hooks/useFacebookPages';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type FacebookPagesManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FacebookPagesManager({ open, onOpenChange }: FacebookPagesManagerProps) {
  const {
    pages,
    availablePages,
    isLoading,
    isLoadingAvailable,
    isSaving,
    isUpdating,
    loadPages,
    loadAvailablePages,
    connectPage,
    claimOwnership,
    disconnectPage,
  } = useFacebookPages();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadPages().catch((error) => {
        console.error('[FacebookPagesManager] loadPages', error);
      });
      loadAvailablePages().catch((error) => {
        console.error('[FacebookPagesManager] loadAvailablePages', error);
      });
    }
  }, [open, loadPages, loadAvailablePages]);

  const handleConnect = useCallback(
    async (pageId: string) => {
      try {
        await connectPage(pageId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already connected')) {
          toast.error('This Facebook profile is already connected to another Phanrise account.');
        }
        throw error;
      }
    },
    [connectPage],
  );

  const handleClaim = useCallback(
    async (pageId: string) => {
      try {
        await claimOwnership(pageId);
      } catch (error) {
        throw error;
      }
    },
    [claimOwnership],
  );

  const handleOpenChange = (value: boolean) => {
    if (isSaving) {
      return;
    }

    if (!value) {
      loadPages().catch((error) => {
        console.error('[FacebookPagesManager] reload pages on close', error);
      });
    }

    onOpenChange(value);
  };

  const claimableLookup = useMemo(() => {
    return availablePages.reduce<Record<string, boolean>>((acc, page) => {
      if (page.can_claim) {
        acc[page.page_id] = true;
      }
      return acc;
    }, {});
  }, [availablePages]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle>Manage Facebook Pages</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900">Connected Pages</h4>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={() =>
                  loadPages().catch((error) => {
                    console.error('[FacebookPagesManager] reload pages', error);
                  })
                }
              >
                Refresh
              </Button>
            </div>
            <ScrollArea className="mt-4 max-h-60 pr-2">
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-slate-500">Loading connected pages…</p>
                ) : pages.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No Facebook Pages connected yet. Connect one from the list below.
                  </p>
                ) : (
                  pages.map((page) => {
                    const isOwner = page.role === 'owner' || page.owner_user_id === user?.id;
                    const canClaim = !isOwner && claimableLookup[page.page_id];

                    return (
                      <div
                        key={page.id}
                        className="flex items-start justify-between gap-4 rounded-lg border border-purple-100 p-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-900 font-medium">
                              {page.name ?? page.page_id}
                            </p>
                            {page.role && (
                              <Badge
                                className={
                                  page.role === 'owner'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                }
                              >
                                {page.role === 'owner' ? 'Owner' : 'Collaborator'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {page.category ?? 'No category'} · Connected{' '}
                            {page.connected_at ? new Date(page.connected_at).toLocaleString() : '—'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Reward Coin:{' '}
                            <span className="font-medium text-slate-700">
                              {page.reward_coin_symbol ?? 'Not set'}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Owner:{' '}
                            <span className="font-medium text-slate-700">
                              {isOwner
                                ? 'You'
                                : page.owner_display_name ?? 'Another team member'}
                            </span>
                          </p>
                          {page.sync_status && (
                            <Badge className="mt-2 bg-purple-100 text-purple-600 border-purple-200">
                              {page.sync_status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {canClaim && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={isSaving}
                              onClick={() => claimOwnership(page.id)}
                            >
                              Claim Ownership
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSaving || isUpdating}
                            onClick={() => disconnectPage(page.id)}
                          >
                            {isOwner ? 'Disconnect' : 'Leave Page'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </section>
          <Separator />
          <section>
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900">Pages from Facebook</h4>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoadingAvailable}
                onClick={() =>
                  loadAvailablePages().catch((error) => {
                    console.error('[FacebookPagesManager] reload available pages', error);
                  })
                }
              >
                {isLoadingAvailable ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
            <ScrollArea className="mt-4 max-h-60 pr-2">
              <div className="space-y-4">
                {isLoadingAvailable ? (
                  <p className="text-sm text-slate-500">Fetching Facebook Pages…</p>
                ) : availablePages.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No Facebook Pages returned for your profile. Ensure you manage a Page and have
                    granted the necessary permissions.
                  </p>
                ) : (
                  availablePages.map((page) => {
                    const isConnected = page.connected;
                    const canClaim = !!page.social_page_id && !!page.can_claim;

                    return (
                      <div
                        key={page.page_id}
                        className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4"
                      >
                        <div>
                          <p className="text-slate-900 font-medium">{page.name ?? page.page_id}</p>
                          <p className="text-sm text-slate-500">{page.category ?? 'No category'}</p>
                          {page.owner_display_name && (
                            <p className="text-xs text-slate-500 mt-1">
                              Owner: <span className="font-medium text-slate-700">{page.owner_display_name}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Connected
                            </Badge>
                          ) : null}
                          {!isConnected && (
                            <Button
                              size="sm"
                              disabled={isSaving}
                              onClick={() => handleConnect(page.page_id)}
                              className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                              Connect Page
                            </Button>
                          )}
                          {isConnected && canClaim && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={isSaving}
                              onClick={() => handleClaim(page.social_page_id!)}
                            >
                              Claim Ownership
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

