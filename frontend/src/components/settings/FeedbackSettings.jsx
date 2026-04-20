import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

const CREATE_USER_FEEDBACK = gql`
  mutation CreateUserFeedback(
    $facedError: Boolean!
    $featureUnderstandingProblem: Boolean!
    $environment: String!
    $softwareQualityRating: Int!
    $softwarePerformanceRating: Int!
    $settingsWorking: Boolean!
    $pricingWorking: Boolean!
    $analysisUnderstandable: Boolean!
    $dashboardWorking: Boolean!
    $loginGoogleWorking: Boolean!
    $comments: String
  ) {
    createUserFeedback(
      facedError: $facedError
      featureUnderstandingProblem: $featureUnderstandingProblem
      environment: $environment
      softwareQualityRating: $softwareQualityRating
      softwarePerformanceRating: $softwarePerformanceRating
      settingsWorking: $settingsWorking
      pricingWorking: $pricingWorking
      analysisUnderstandable: $analysisUnderstandable
      dashboardWorking: $dashboardWorking
      loginGoogleWorking: $loginGoogleWorking
      comments: $comments
    ) {
      success
      message
    }
  }
`;

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function yesNoToBool(value) {
  return value === 'yes';
}

export default function FeedbackSettings() {
  const [formData, setFormData] = useState({
    facedError: 'no',
    featureUnderstandingProblem: 'no',
    environment: 'pc',
    softwareQualityRating: '4',
    softwarePerformanceRating: '4',
    settingsWorking: 'yes',
    pricingWorking: 'yes',
    analysisUnderstandable: 'yes',
    dashboardWorking: 'yes',
    loginGoogleWorking: 'yes',
    comments: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [createUserFeedback, { loading }] = useMutation(CREATE_USER_FEEDBACK, {
    onCompleted: (data) => {
      if (data?.createUserFeedback?.success) {
        setSubmitted(true);
        setSubmitError('');
        setFormData({
          facedError: 'no',
          featureUnderstandingProblem: 'no',
          environment: 'pc',
          softwareQualityRating: '4',
          softwarePerformanceRating: '4',
          settingsWorking: 'yes',
          pricingWorking: 'yes',
          analysisUnderstandable: 'yes',
          dashboardWorking: 'yes',
          loginGoogleWorking: 'yes',
          comments: '',
        });
        setTimeout(() => setSubmitted(false), 5000);
        return;
      }

      setSubmitted(false);
      setSubmitError(data?.createUserFeedback?.message || 'Failed to submit feedback. Please try again.');
    },
    onError: (error) => {
      setSubmitted(false);
      setSubmitError(error.message || 'Failed to submit feedback. Please try again.');
    },
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(false);
    setSubmitError('');

    createUserFeedback({
      variables: {
        facedError: yesNoToBool(formData.facedError),
        featureUnderstandingProblem: yesNoToBool(formData.featureUnderstandingProblem),
        environment: formData.environment,
        softwareQualityRating: Number(formData.softwareQualityRating),
        softwarePerformanceRating: Number(formData.softwarePerformanceRating),
        settingsWorking: yesNoToBool(formData.settingsWorking),
        pricingWorking: yesNoToBool(formData.pricingWorking),
        analysisUnderstandable: yesNoToBool(formData.analysisUnderstandable),
        dashboardWorking: yesNoToBool(formData.dashboardWorking),
        loginGoogleWorking: yesNoToBool(formData.loginGoogleWorking),
        comments: formData.comments.trim(),
      },
    });
  };

  return (
    <div className="settings-section">
      <h2>Product Feedback</h2>
      <p className="subtitle">Share your experience so we can improve the product.</p>

      {submitted && (
        <div className="settings-info-card settings-callout success">
          <p>Thanks for your feedback. We have received your response by email.</p>
        </div>
      )}

      {submitError && (
        <div className="settings-info-card settings-callout error">
          <p>{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-form-group">
          <label htmlFor="facedError">1. Did you face any error?</label>
          <select id="facedError" name="facedError" value={formData.facedError} onChange={handleInputChange} required>
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="featureUnderstandingProblem">2. Did you have any problem understanding features?</label>
          <select
            id="featureUnderstandingProblem"
            name="featureUnderstandingProblem"
            value={formData.featureUnderstandingProblem}
            onChange={handleInputChange}
            required
          >
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="environment">3. Which environment did you use?</label>
          <select id="environment" name="environment" value={formData.environment} onChange={handleInputChange} required>
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="pc">PC</option>
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="softwareQualityRating">4. How would you rate software quality? (1-5)</label>
          <select
            id="softwareQualityRating"
            name="softwareQualityRating"
            value={formData.softwareQualityRating}
            onChange={handleInputChange}
            required
          >
            {RATING_OPTIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="softwarePerformanceRating">5. How would you rate software performance? (1-5)</label>
          <select
            id="softwarePerformanceRating"
            name="softwarePerformanceRating"
            value={formData.softwarePerformanceRating}
            onChange={handleInputChange}
            required
          >
            {RATING_OPTIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="settingsWorking">6. Are settings running well?</label>
          <select id="settingsWorking" name="settingsWorking" value={formData.settingsWorking} onChange={handleInputChange} required>
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="pricingWorking">7. Is pricing working as expected?</label>
          <select id="pricingWorking" name="pricingWorking" value={formData.pricingWorking} onChange={handleInputChange} required>
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="analysisUnderstandable">8. Was the analysis understandable?</label>
          <select
            id="analysisUnderstandable"
            name="analysisUnderstandable"
            value={formData.analysisUnderstandable}
            onChange={handleInputChange}
            required
          >
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="dashboardWorking">9. Is the dashboard working well?</label>
          <select id="dashboardWorking" name="dashboardWorking" value={formData.dashboardWorking} onChange={handleInputChange} required>
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="loginGoogleWorking">10. Are login and Google login working well?</label>
          <select
            id="loginGoogleWorking"
            name="loginGoogleWorking"
            value={formData.loginGoogleWorking}
            onChange={handleInputChange}
            required
          >
            {YES_NO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label htmlFor="comments">Additional comments (optional)</label>
          <textarea
            id="comments"
            name="comments"
            rows="5"
            value={formData.comments}
            onChange={handleInputChange}
            placeholder="Share any extra details or suggestions..."
          />
        </div>

        <div className="settings-btn-group">
          <button type="submit" className="settings-btn settings-btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
