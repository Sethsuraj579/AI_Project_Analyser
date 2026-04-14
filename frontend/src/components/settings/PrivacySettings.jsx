import React from 'react';

export default function PrivacySettings() {
  return (
    <div>
      <div className="settings-section">
        <h2>Privacy Policy</h2>
        <p className="subtitle">Last updated: March 5, 2026</p>

        <div className="settings-info-card">
          <h3>1. Information We Collect</h3>
          <p>
            We collect information that you provide directly to us when you create an account, 
            use our services, or communicate with us. This includes:
          </p>
          <ul className="settings-list-compact">
            <li>Account information (username, email, password)</li>
            <li>Profile information (name, preferences)</li>
            <li>Project data (code files, analysis results)</li>
            <li>Usage data (how you interact with our service)</li>
            <li>Payment information (processed securely through Razorpay)</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>2. How We Use Your Information</h3>
          <p>
            We use the information we collect to:
          </p>
          <ul className="settings-list-compact">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect, prevent, and address fraud and security issues</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>3. Information Sharing and Disclosure</h3>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share 
            your information only in the following circumstances:
          </p>
          <ul className="settings-list-compact">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect and defend our rights and property</li>
            <li>With service providers who assist us in operating our platform</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>4. Data Security</h3>
          <p>
            We take reasonable measures to protect your information from unauthorized access, 
            alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="settings-list-compact">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Secure authentication mechanisms</li>
            <li>Limited access to personal information by employees</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>5. Your Code and Projects</h3>
          <p>
            Your code is your intellectual property. We analyze your code to provide insights 
            but never share it with third parties. Your code is:
          </p>
          <ul className="settings-list-compact">
            <li>Stored encrypted on our secure servers</li>
            <li>Processed only for analysis purposes</li>
            <li>Never used to train public models</li>
            <li>Deletable at any time upon request</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>6. Cookies and Tracking</h3>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and 
            hold certain information. You can instruct your browser to refuse all cookies or to 
            indicate when a cookie is being sent.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>7. Data Retention</h3>
          <p>
            We retain your personal information for as long as necessary to provide you with our 
            services and as described in this Privacy Policy. You can request deletion of your 
            account and associated data at any time.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>8. Your Rights</h3>
          <p>
            You have the right to:
          </p>
          <ul className="settings-list-compact">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Export your data</li>
          </ul>
        </div>

        <div className="settings-info-card">
          <h3>9. Children's Privacy</h3>
          <p>
            Our service is not intended for individuals under the age of 13. We do not knowingly 
            collect personal information from children under 13.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>10. Changes to This Policy</h3>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes 
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div className="settings-info-card">
          <h3>11. Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy, please contact us at 
            privacy@aiprojectanalyser.com
          </p>
        </div>
      </div>
    </div>
  );
}
