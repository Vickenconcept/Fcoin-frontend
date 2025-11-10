import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const demoConnectedAccounts = [
  { platform: 'YouTube', connected: true, username: '@sarahcreates', icon: Youtube, color: 'bg-red-100 text-red-600' },
  { platform: 'Instagram', connected: true, username: '@sarahcreates', icon: Instagram, color: 'bg-pink-100 text-pink-600' },
  { platform: 'TikTok', connected: false, username: null, icon: null, color: 'bg-slate-100 text-slate-600' },
  { platform: 'Facebook', connected: false, username: null, icon: Facebook, color: 'bg-blue-100 text-blue-600' },
];

export function ProfileSection() {
  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card className="p-6 border-purple-100">
        <h3 className="text-slate-900 mb-6">Profile Information</h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-slate-600 mb-1">Name</p>
              <Input defaultValue="Sarah Johnson" />
            </div>
            <div>
              <p className="text-slate-600 mb-1">Username</p>
              <Input defaultValue="@sarahjohnson" />
            </div>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          Save Changes
        </Button>
      </Card>

      {/* Connected Social Accounts */}
      <Card className="p-6 border-purple-100">
        <h3 className="text-slate-900 mb-6">Connected Social Accounts</h3>
        <p className="text-slate-600 mb-6">
          Connect your social media accounts to track engagement and reward your followers.
        </p>
        <div className="space-y-4">
          {demoConnectedAccounts.map((account) => (
            <Card key={account.platform} className="p-4 border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {account.icon ? (
                    <div className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center`}>
                      <account.icon className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 ${account.color} rounded-xl flex items-center justify-center`}>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-900">{account.platform}</p>
                    {account.connected ? (
                      <p className="text-slate-500">{account.username}</p>
                    ) : (
                      <p className="text-slate-500">Not connected</p>
                    )}
                  </div>
                </div>
                {account.connected ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                ) : (
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

