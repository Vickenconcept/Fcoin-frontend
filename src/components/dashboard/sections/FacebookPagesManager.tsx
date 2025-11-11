import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFacebookPages } from '../hooks/useFacebookPages';

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
    loadPages,
    loadAvailablePages,
    connectPage,
    disconnectPage,
  } = useFacebookPages();

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

  const handleOpenChange = (value: boolean) => {
    if (!isSaving) {
      onOpenChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
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
                  pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between rounded-lg border border-purple-100 p-4"
                    >
                      <div>
                        <p className="text-slate-900">{page.name ?? page.page_id}</p>
                        <p className="text-sm text-slate-500">
                          {page.category ?? 'No category'} · Connected{' '}
                          {page.connected_at ? new Date(page.connected_at).toLocaleString() : '—'}
                        </p>
                        {page.sync_status && (
                          <Badge className="mt-2 bg-purple-100 text-purple-600 border-purple-200">
                            {page.sync_status}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => disconnectPage(page.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))
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
                  availablePages.map((page) => (
                    <div
                      key={page.page_id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                    >
                      <div>
                        <p className="text-slate-900">{page.name ?? page.page_id}</p>
                        <p className="text-sm text-slate-500">{page.category ?? 'No category'}</p>
                      </div>
                      {page.connected ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={() => connectPage(page.page_id)}
                        >
                          Connect Page
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

