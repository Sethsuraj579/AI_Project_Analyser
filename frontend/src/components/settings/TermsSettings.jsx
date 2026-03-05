import React from 'react';

export default function TermsSettings() {
  return (
    <div>
      <div className="settings-section">
        <h2>Terms and Conditions</h2>
        <p className="subtitle">Last updated: March 5, 2026</p>

        <div className="settings-info-card">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing and using AI Project Analyser ("the Service"), you accept and agree to be bound 
            by the terms and provision of this agreement. If you do not agree to these terms, please do not 
            use the Service.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>2. Use License</h3>
          <p>
            Permission is granted to temporarily access the Service for personal, non-commercial use only. 
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul style={{ marginLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)' }}>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>3. User Accounts</h3>
          <p>
            When you create an account with us, you must provide accurate, complete, and current information. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination 
            of your account. You are responsible for safeguarding your password and for all activities that 
            occur under your account.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>4. Code Analysis and Data</h3>
          <p>
            When you upload code for analysis, you retain all rights to your code. We analyze your code 
            to provide insights and metrics. We do not share your code with third parties. Your code 
            is processed securely and stored encrypted.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>5. Subscription and Payments</h3>
          <p>
            Some parts of the Service are billed on a subscription basis. You will be billed in advance 
            on a recurring basis. Billing cycles are set on a monthly or annual basis. At the end of each 
            billing cycle, your subscription will automatically renew unless you cancel it.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>6. Termination</h3>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach the Terms. Upon 
            termination, your right to use the Service will immediately cease.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>7. Limitation of Liability</h3>
          <p>
            In no event shall AI Project Analyser, nor its directors, employees, partners, agents, 
            suppliers, or affiliates, be liable for any indirect, incidental, special, consequential 
            or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>8. Changes to Terms</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
            If a revision is material, we will try to provide at least 30 days' notice prior to any new 
            terms taking effect.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>9. Contact Information</h3>
          <p>
            If you have any questions about these Terms, please contact us at legal@aiprojectanalyser.com
          </p>
        </div>
      </div>
    </div>
  );
}
