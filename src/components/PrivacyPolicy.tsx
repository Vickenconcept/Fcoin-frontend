import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">1. Introduction</h2>
              <p className="text-slate-700 leading-relaxed">
                This privacy policy applies to the <strong>Phanrise</strong> mobile and web application built by Phanrise. 
                We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your information.
              </p>
              <p className="text-slate-700 leading-relaxed">
                By using Phanrise, you agree to the collection and use of information in accordance with this policy. 
                If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">2.1 Social Media Platform Data</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                When you connect your social media accounts (Facebook, Instagram, TikTok, or YouTube) to Phanrise, we collect information through their respective APIs:
              </p>
              
              <h4 className="text-lg font-semibold text-slate-800 mb-2 mt-4">Facebook and Instagram (Meta Platforms)</h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                When you connect your Facebook or Instagram accounts, we collect the following information through Meta's APIs:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li><strong>Basic Profile Information:</strong> Your Instagram username, profile picture, and basic account details (via instagram_basic permission)</li>
                <li><strong>Page Information:</strong> Pages you manage, page names, and page IDs (via pages_show_list permission)</li>
                <li><strong>Engagement Data:</strong> Likes, comments, shares, and views on your posts (via pages_read_engagement permission)</li>
                <li><strong>Content Data:</strong> Posts, comments, and public content from pages you manage (via pages_read_user_content permission)</li>
                <li><strong>Insights Data:</strong> Analytics and engagement metrics for your Instagram account and pages (via instagram_manage_insights permission)</li>
              </ul>

              <h4 className="text-lg font-semibold text-slate-800 mb-2 mt-4">YouTube (Google)</h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                When you connect your YouTube account, we collect the following information through Google's YouTube Data API:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li><strong>Channel Information:</strong> Your YouTube channel name, channel ID, profile picture, and subscriber count</li>
                <li><strong>Video Data:</strong> Public video information including titles, descriptions, view counts, and publication dates</li>
                <li><strong>Engagement Data:</strong> Likes, comments, and view counts on your videos</li>
                <li><strong>Analytics Data:</strong> Video performance metrics and engagement statistics</li>
                <li><strong>Playlist Information:</strong> Public playlists and their contents</li>
              </ul>

              <h4 className="text-lg font-semibold text-slate-800 mb-2 mt-4">TikTok</h4>
              <p className="text-slate-700 leading-relaxed mb-3">
                When you connect your TikTok account, we collect the following information through TikTok's API:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Profile Information:</strong> Your TikTok username, display name, profile picture, and follower count</li>
                <li><strong>Video Data:</strong> Public video information including captions, view counts, like counts, and comment counts</li>
                <li><strong>Engagement Data:</strong> Likes, comments, shares, and views on your TikTok videos</li>
                <li><strong>Analytics Data:</strong> Video performance metrics and engagement statistics</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.2 Account Information</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                We collect information you provide when creating your Phanrise account:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Email address</li>
                <li>Username</li>
                <li>Profile information</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">2.3 Usage Data</h3>
              <p className="text-slate-700 leading-relaxed">
                We automatically collect information about how you interact with Phanrise, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Device information (device type, operating system, browser type)</li>
                <li>IP address</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Service Delivery:</strong> To provide and maintain Phanrise services, including tracking engagement and distributing rewards</li>
                <li><strong>Engagement Tracking:</strong> To monitor and attribute likes, comments, shares, and views to registered users in our app</li>
                <li><strong>Reward Distribution:</strong> To calculate and distribute coins to users based on their engagement with creator content</li>
                <li><strong>Account Management:</strong> To manage your account, process transactions, and provide customer support</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and improve our services</li>
                <li><strong>Communication:</strong> To send you important updates, notifications, and respond to your inquiries</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">4. Data Storage and Security</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Data is stored on secure servers with encryption in transit and at rest</li>
                <li>Access to your data is restricted to authorized personnel only</li>
                <li>We use secure authentication methods and regularly update our security practices</li>
                <li>Social media platform data (Facebook, Instagram, TikTok, YouTube) is stored only as necessary to provide our services</li>
                <li>We retain your data only for as long as necessary to fulfill the purposes outlined in this policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform (payment processors, hosting services, analytics providers)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (see section 7 below)</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                <li><strong>Disconnect Accounts:</strong> Disconnect your Facebook, Instagram, TikTok, or YouTube accounts at any time through your account settings</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at the email address provided in section 9.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">7. How to Delete Your Data</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You can request deletion of your data in the following ways:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Through the App:</strong> Go to your account settings and select "Delete Account" to permanently delete your account and associated data</li>
                <li><strong>By Email:</strong> Send a deletion request to <a href="mailto:privacy@phanrise.app" className="text-purple-600 hover:underline">privacy@phanrise.app</a> with the subject line "Data Deletion Request"</li>
                <li><strong>Disconnect Social Accounts:</strong> You can disconnect your Facebook, Instagram, TikTok, or YouTube accounts at any time, which will stop new data collection from those platforms</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Upon receiving a valid deletion request, we will delete your personal information within 30 days, except where we are required to retain it for legal or legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">8. Third-Party Services</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Phanrise integrates with the following third-party services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Meta (Facebook/Instagram):</strong> For social media integration and engagement tracking. Their privacy policy applies to data collected through their platforms.</li>
                <li><strong>Google (YouTube):</strong> For YouTube channel integration and engagement tracking. Google's privacy policy (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">https://policies.google.com/privacy</a>) applies to data collected through YouTube's API.</li>
                <li><strong>TikTok:</strong> For TikTok account integration and engagement tracking. TikTok's privacy policy applies to data collected through their API.</li>
                <li><strong>Payment Processors:</strong> For processing payments. Payment information is handled by these third parties and subject to their privacy policies.</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                We encourage you to review the privacy policies of these third-party services to understand how they handle your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">9. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
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
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-slate-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">11. Children's Privacy</h2>
              <p className="text-slate-700 leading-relaxed">
                Phanrise is not intended for users under the age of 13. <strong>We do not collect data from users under 13.</strong> We do not knowingly collect personal information from children under 13. 
                If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">12. International Users</h2>
              <p className="text-slate-700 leading-relaxed">
                If you are accessing Phanrise from outside the United States, please note that your information may be transferred to, stored, and processed in the United States. 
                By using our services, you consent to the transfer of your information to our facilities and those third parties with whom we share it as described in this policy.
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

