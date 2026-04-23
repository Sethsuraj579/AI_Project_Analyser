import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($firstName: String, $lastName: String, $email: String, $bio: String, $phoneNumber: String, $company: String, $location: String, $website: String) {
    updateProfile(firstName: $firstName, lastName: $lastName, email: $email, bio: $bio, phoneNumber: $phoneNumber, company: $company, location: $location, website: $website) {
      success
      message
      user {
        id
        username
        email
        firstName
        lastName
        profile {
          bio
          phoneNumber
          company
          location
          website
        }
      }
    }
  }
`;

const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($emailNotifications: Boolean, $projectUpdates: Boolean) {
    updatePreferences(emailNotifications: $emailNotifications, projectUpdates: $projectUpdates) {
      success
      message
    }
  }
`;

const GET_USER_INFO = gql`
  query GetUserInfo {
    userInfo {
      id
      username
      email
      firstName
      lastName
      profile {
        bio
        phoneNumber
        company
        location
        website
      }
      preferences {
        emailNotifications
        projectUpdates
      }
    }
  }
`;

export default function ProfileSettings() {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    bio: '',
    phoneNumber: '',
    company: '',
    location: '',
    website: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    projectUpdates: true
  });
  const [message, setMessage] = useState(null);

  const { loading: queryLoading } = useQuery(GET_USER_INFO, {
    onCompleted: (result) => {
      if (result.userInfo) {
        const { userInfo } = result;
        setProfileData({
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          email: userInfo.email || '',
          username: userInfo.username || '',
          bio: userInfo.profile?.bio || '',
          phoneNumber: userInfo.profile?.phoneNumber || '',
          company: userInfo.profile?.company || '',
          location: userInfo.profile?.location || '',
          website: userInfo.profile?.website || ''
        });
        setPreferences({
          emailNotifications: userInfo.preferences?.emailNotifications ?? true,
          projectUpdates: userInfo.preferences?.projectUpdates ?? true
        });
      }
    },
    onError: () => {
      // User data might not be available, use stored email
      const storedEmail = localStorage.getItem('user_email');
      if (storedEmail) {
        setProfileData(prev => ({ ...prev, email: storedEmail }));
      }
    }
  });

  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      if (data.updateProfile.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.updateProfile.message });
      }
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
    }
  });

  const [updatePreferences, { loading: preferencesLoading }] = useMutation(UPDATE_PREFERENCES);

  const handleInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    updateProfile({
      variables: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        bio: profileData.bio,
        phoneNumber: profileData.phoneNumber,
        company: profileData.company,
        location: profileData.location,
        website: profileData.website
      }
    });
  };

  const handlePreferenceToggle = async (key) => {
    const nextPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(nextPreferences);

    try {
      const response = await updatePreferences({
        variables: {
          emailNotifications: nextPreferences.emailNotifications,
          projectUpdates: nextPreferences.projectUpdates
        }
      });

      if (!response?.data?.updatePreferences?.success) {
        setPreferences(preferences);
        setMessage({
          type: 'error',
          text: response?.data?.updatePreferences?.message || 'Failed to update preferences'
        });
      } else {
        setMessage({ type: 'success', text: 'Preferences updated successfully!' });
      }
    } catch (error) {
      setPreferences(preferences);
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Profile Information</h2>
        <p className="subtitle">Update your personal information and email address</p>

        {message && (
          <div className={`settings-info-card settings-callout ${message.type === 'error' ? 'error' : 'success'}`}>
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="settings-form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileData.username}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <span className="input-hint">Username cannot be changed</span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={profileData.company}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={profileData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="settings-btn-group">
            <button 
              type="submit" 
              className="settings-btn settings-btn-primary"
              disabled={updateLoading || queryLoading}
            >
              {updateLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="settings-btn settings-btn-secondary"
              onClick={() => window.location.reload()}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Preferences</h2>
        <p className="subtitle">Customize your experience</p>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <h4>Email Notifications</h4>
            <p>Receive email updates about your projects and analyses</p>
          </div>
          <div
            className={`toggle-switch ${preferences.emailNotifications ? 'active' : ''} ${preferencesLoading ? 'disabled' : ''}`}
            onClick={() => !preferencesLoading && handlePreferenceToggle('emailNotifications')}
            role="button"
            tabIndex={0}
            aria-label="Toggle email notifications"
            aria-pressed={preferences.emailNotifications}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !preferencesLoading) {
                e.preventDefault();
                handlePreferenceToggle('emailNotifications');
              }
            }}
          ></div>
        </div>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <h4>Project Updates</h4>
            <p>Get notified when your project analysis is complete</p>
          </div>
          <div
            className={`toggle-switch ${preferences.projectUpdates ? 'active' : ''} ${preferencesLoading ? 'disabled' : ''}`}
            onClick={() => !preferencesLoading && handlePreferenceToggle('projectUpdates')}
            role="button"
            tabIndex={0}
            aria-label="Toggle project updates"
            aria-pressed={preferences.projectUpdates}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !preferencesLoading) {
                e.preventDefault();
                handlePreferenceToggle('projectUpdates');
              }
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
