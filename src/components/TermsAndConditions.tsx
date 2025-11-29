import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export default function TermsAndConditions() {
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
              FanCoin
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
            Terms and Conditions
          </h1>
          
          <p className="text-slate-600 mb-8">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-700 leading-relaxed">
                By accessing and using the <strong>FanCoin</strong> mobile and web application ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                FanCoin is a platform that allows creators to launch branded coins and reward their supporters based on engagement with their social media content. 
                The Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Creation and management of branded coins</li>
                <li>Integration with social media platforms (Facebook, Instagram, YouTube, TikTok)</li>
                <li>Tracking of engagement metrics (likes, comments, shares, views)</li>
                <li>Distribution of coins to registered supporters based on engagement</li>
                <li>Wallet and transaction management</li>
                <li>Withdrawal and payment processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.1 Account Creation</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                To use FanCoin, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Be at least 13 years of age (or the age of majority in your jurisdiction)</li>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your information to keep it accurate, current, and complete</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">3.2 Account Responsibilities</h3>
              <p className="text-slate-700 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">4. Creator Responsibilities</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you are a creator using FanCoin to launch your coin:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>You must pay the required launch fee and fund your reward pool before your coin becomes active</li>
                <li>You are responsible for setting appropriate coin distribution rates</li>
                <li>You must ensure you have the right to connect and use the social media accounts you link to FanCoin</li>
                <li>You grant FanCoin permission to access and track engagement on your connected social media accounts</li>
                <li>You understand that coins are distributed automatically based on tracked engagement</li>
                <li>You are responsible for maintaining sufficient funds in your reward pool</li>
                <li>You agree not to manipulate or artificially inflate engagement metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">5. Supporter Responsibilities</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you are a supporter earning coins:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>You must be a registered user and follow the creator in the FanCoin app to earn coins</li>
                <li>Coins are earned based on verified engagement (likes, comments, shares, views) on creator content</li>
                <li>Engagement must occur on the creator's connected social media accounts</li>
                <li>You agree not to use automated tools, bots, or other methods to artificially inflate engagement</li>
                <li>You understand that coin distribution is subject to the creator's settings and available reward pool</li>
                <li>You are responsible for the security of your wallet and account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">6. Payments and Fees</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">6.1 Creator Fees</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Creators are required to pay:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>A one-time launch fee to create their branded coin</li>
                <li>Funds to their reward pool, which are used to distribute coins to supporters</li>
                <li>Any applicable transaction fees for withdrawals or transfers</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">6.2 Withdrawals</h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Supporters may withdraw their coins subject to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Minimum withdrawal amounts as set by FanCoin</li>
                <li>Verification requirements for security purposes</li>
                <li>Processing fees as disclosed at the time of withdrawal</li>
                <li>Processing times as specified in the withdrawal interface</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-6">6.3 Refunds</h3>
              <p className="text-slate-700 leading-relaxed">
                Launch fees and reward pool funding are generally non-refundable. Refunds may be considered on a case-by-case basis at FanCoin's sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">7. Social Media Integration</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                By connecting your social media accounts to FanCoin, you:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Grant FanCoin permission to access your social media accounts through the respective platform APIs</li>
                <li>Authorize FanCoin to read engagement data, insights, and public content as necessary to provide the Service</li>
                <li>Agree to comply with the terms of service of the social media platforms you connect</li>
                <li>Understand that FanCoin's access is subject to the permissions granted by the social media platform</li>
                <li>May disconnect your accounts at any time through your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">8. Prohibited Activities</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Use automated tools, bots, scripts, or other methods to artificially inflate engagement metrics</li>
                <li>Create multiple accounts to manipulate coin distribution</li>
                <li>Engage in any fraudulent, deceptive, or illegal activities</li>
                <li>Attempt to reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use the Service to violate any laws or regulations</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
                <li>Collect or harvest information about other users without their consent</li>
                <li>Use the Service to transmit any viruses, malware, or other harmful code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">9. Intellectual Property</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by FanCoin and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-slate-700 leading-relaxed">
                You retain ownership of any content you create or upload to the Service. By using the Service, you grant FanCoin a license to use, display, and distribute your content as necessary to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">10. Disclaimers</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Any warranty that the Service will be uninterrupted, secure, or error-free</li>
                <li>Any warranty regarding the accuracy, reliability, or quality of engagement tracking</li>
                <li>Any warranty that social media platform APIs will be continuously available or accessible</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                FanCoin does not guarantee that engagement tracking will be 100% accurate or that all engagement will be detected and rewarded.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FANCOIN SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Damages resulting from your use or inability to use the Service</li>
                <li>Damages resulting from errors, omissions, or inaccuracies in the Service</li>
                <li>Damages resulting from unauthorized access to or alteration of your data</li>
                <li>Damages resulting from social media platform API changes or discontinuation</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                In no event shall FanCoin's total liability exceed the amount you paid to FanCoin in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">12. Indemnification</h2>
              <p className="text-slate-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless FanCoin and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your use of the Service, your violation of these Terms, or your violation of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">13. Termination</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Breach of these Terms and Conditions</li>
                <li>Fraudulent or illegal activity</li>
                <li>Violation of any applicable laws or regulations</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Upon termination, your right to use the Service will immediately cease. You may also terminate your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">14. Changes to Terms</h2>
              <p className="text-slate-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. 
                What constitutes a material change will be determined at our sole discretion. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">15. Governing Law</h2>
              <p className="text-slate-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FanCoin operates, without regard to its conflict of law provisions. 
                Any disputes arising from these Terms or the Service shall be resolved in the appropriate courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">16. Contact Information</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                <p className="text-slate-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:legal@fancoin.app" className="text-purple-600 hover:underline">legal@fancoin.app</a>
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Support Email:</strong> <a href="mailto:support@fancoin.app" className="text-purple-600 hover:underline">support@fancoin.app</a>
                </p>
                <p className="text-slate-700">
                  <strong>App Name:</strong> FanCoin
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">17. Severability</h2>
              <p className="text-slate-700 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-purple-900 mb-4">18. Entire Agreement</h2>
              <p className="text-slate-700 leading-relaxed">
                These Terms constitute the entire agreement between you and FanCoin regarding the use of the Service and supersede all prior agreements and understandings.
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

