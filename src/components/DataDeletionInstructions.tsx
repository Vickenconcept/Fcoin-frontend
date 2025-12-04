import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Trash2, Mail, Settings } from 'lucide-react';
import { Button } from './ui/button';

export default function DataDeletionInstructions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Phanrise
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Data Deletion Instructions
            </h1>
          </div>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">How to Delete Your Data</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                At Phanrise, we respect your right to control your personal data. You can delete your account and all associated data at any time using the methods below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Method 1: Delete Account Through the App</h2>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-100 mb-4">
                <div className="flex items-start gap-3 mb-4">
                  <Settings className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Steps to Delete Your Account:</h3>
                    <ol className="list-decimal pl-6 space-y-2 text-slate-700">
                      <li>Log in to your Phanrise account</li>
                      <li>Navigate to your Profile Settings</li>
                      <li>Scroll to the bottom of the settings page</li>
                      <li>Click on "Delete Account" or "Delete My Data"</li>
                      <li>Confirm your deletion request</li>
                      <li>Your account and all associated data will be permanently deleted within 30 days</li>
                    </ol>
                  </div>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <strong>Note:</strong> Once you delete your account, all of your data including your profile, social media connections, coins, rewards, and engagement history will be permanently removed and cannot be recovered.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Method 2: Request Deletion by Email</h2>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 mb-4">
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Email Deletion Request:</h3>
                    <p className="text-slate-700 leading-relaxed mb-3">
                      If you prefer to request account deletion via email, please send a request to:
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-slate-900 font-medium mb-1">Email Address:</p>
                      <a 
                        href="mailto:privacy@phanrise.app?subject=Data%20Deletion%20Request"
                        className="text-blue-600 hover:text-blue-800 underline text-lg"
                      >
                        privacy@phanrise.app
                      </a>
                    </div>
                    <p className="text-slate-700 leading-relaxed mt-3">
                      <strong>Please include the following information in your email:</strong>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                      <li>Subject line: "Data Deletion Request"</li>
                      <li>Your registered email address</li>
                      <li>Your username (if available)</li>
                      <li>Confirmation that you want to delete your account and all associated data</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">
                We will process your deletion request within 30 days of receipt. You will receive a confirmation email once your data has been deleted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">What Data Will Be Deleted?</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                When you delete your account, the following data will be permanently removed:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li><strong>Account Information:</strong> Email address, username, display name, profile picture, bio, and other profile data</li>
                <li><strong>Social Media Connections:</strong> All connected Facebook, Instagram, TikTok, and YouTube accounts and their associated data</li>
                <li><strong>Content:</strong> All posts, comments, likes, shares, and other content you've created</li>
                <li><strong>Coins and Rewards:</strong> Your coin balance, reward history, and transaction records</li>
                <li><strong>Engagement Data:</strong> All tracked engagement metrics and analytics</li>
                <li><strong>Preferences:</strong> Notification preferences, account settings, and other user preferences</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-900 text-sm">
                  <strong>Important:</strong> Some data may be retained for legal or legitimate business purposes (e.g., transaction records required for tax compliance) for a limited period as required by law. However, this data will not be used for any other purpose and will be deleted when legally permissible.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Disconnect Social Media Accounts</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you only want to remove data from a specific social media platform without deleting your entire Phanrise account, you can disconnect individual accounts:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-slate-700 mb-4">
                <li>Go to your Profile Settings</li>
                <li>Navigate to "Connected Social Accounts"</li>
                <li>Click "Disconnect" next to the account you want to remove</li>
                <li>Confirm the disconnection</li>
              </ol>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>When you disconnect a social media account:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>All data associated with that social media account will be deleted from Phanrise</li>
                <li>This includes posts, engagement metrics, and any other data synced from that platform</li>
                <li>New data collection from that platform will stop</li>
                <li>Your Phanrise account and data from other connected platforms will remain active</li>
              </ul>
              <p className="text-slate-700 leading-relaxed">
                This allows you to remove data from a specific platform while keeping your Phanrise account and data from other platforms intact.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Facebook Data Deletion</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you have connected your Facebook account to Phanrise and want to delete data associated with your Facebook account:
              </p>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Option 1: Through Phanrise</h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Follow the steps in "Method 1" or "Method 2" above to delete your entire Phanrise account, which will include all Facebook data.
                </p>
                
                <h3 className="text-lg font-semibold text-blue-900 mb-3 mt-4">Option 2: Through Facebook</h3>
                <p className="text-slate-700 leading-relaxed mb-3">
                  You can also request data deletion directly through Facebook:
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-slate-700">
                  <li>Go to your Facebook Settings</li>
                  <li>Navigate to "Apps and Websites"</li>
                  <li>Find "Phanrise" in your connected apps</li>
                  <li>Click "Remove" to disconnect the app</li>
                  <li>To delete data, you can also visit: <a href="https://www.facebook.com/help/contact/571927962448522" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook Data Deletion Request</a></li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Processing Time</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Account deletion requests are typically processed within 30 days. During this period:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Your account will be deactivated immediately upon request</li>
                <li>Data will be permanently deleted within 30 days</li>
                <li>You will receive a confirmation email once deletion is complete</li>
                <li>Some data may be retained longer if required by law (e.g., financial records)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Contact Us</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you have any questions about data deletion or need assistance, please contact us:
              </p>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                <p className="text-slate-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:privacy@phanrise.app" className="text-purple-600 hover:underline">privacy@phanrise.app</a>
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Support Email:</strong> <a href="mailto:support@phanrise.app" className="text-purple-600 hover:underline">support@phanrise.app</a>
                </p>
                <p className="text-slate-700">
                  <strong>App Name:</strong> Phanrise
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">Your Rights</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Under data protection laws, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Request access to your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (as described above)</li>
                <li>Request data portability (receive a copy of your data)</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at <a href="mailto:privacy@phanrise.app" className="text-purple-600 hover:underline">privacy@phanrise.app</a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-purple-100">
            <Button 
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

