# Google + OTP Authentication Implementation Guide

## 📋 Overview

Your authentication system now supports a **secure Google + OTP flow**:

1. **User clicks "Sign in/up with Google"**
2. **Google OAuth verifies the user's identity**
3. **An OTP code is sent to their verified Google email**
4. **User enters the OTP to complete login/registration**
5. **JWT token is issued and user is logged in**

This provides **dual-factor authentication** for maximum security while keeping the experience simple.

---

## 🔧 Implementation Details

### Backend Changes

#### **Modified Mutation: `googleAuth`**
- **Location**: [schema.py](backend/analyser/schema.py#L854)
- **Old behavior**: Returns JWT token immediately ❌
- **New behavior**: Sends OTP email, returns email address (no token yet) ✅
- **Fields returned**:
  - `success: Boolean` - OTP sent successfully
  - `message: String` - "Verification code sent to your email..."
  - `email: String` - Email address where OTP was sent
  - `isNewUser: Boolean` - Whether this is a new user

#### **New Mutation: `verifyGoogleOtp`**
- **Location**: [schema.py](backend/analyser/schema.py#L960)
- **Purpose**: Verify the OTP and issue JWT token
- **Input**:
  - `email: String!` - User's email
  - `otpCode: String!` - 6-digit OTP from email
- **Output**:
  - `success: Boolean` - OTP verified
  - `message: String` - Success/error message
  - `token: String` - JWT token for authentication

#### **GraphQL Mutations**
```graphql
# Step 1: Start Google auth (sends OTP)
mutation GoogleAuth($googleToken: String!) {
  googleAuth(googleToken: $googleToken) {
    success
    message
    email
    isNewUser
  }
}

# Step 2: Verify OTP (get JWT token)
mutation VerifyGoogleOTP($email: String!, $otpCode: String!) {
  verifyGoogleOtp(email: $email, otpCode: $otpCode) {
    success
    message
    token
  }
}
```

### Frontend Changes

#### **Updated Components**

1. **[Login.jsx](frontend/src/pages/Login.jsx)**
   - Added `googleOtpStep` state to track OTP verification
   - Shows OTP input form after Google auth succeeds
   - Calls `verifyGoogleOtp` mutation to complete login
   - Auto-formats OTP input (numeric only, max 6 digits)

2. **[Register.jsx](frontend/src/pages/Register.jsx)**
   - Three-step flow: (1) Register form, (2) Email+password OTP, (3) Google OTP
   - Handles both registration paths with OTP verification
   - Shows different button text based on step

#### **Updated GraphQL Queries**
- [queries.jsx](frontend/src/graphql/queries.jsx)
  - Modified `GOOGLE_AUTH` to include `email` field
  - Added new `VERIFY_GOOGLE_OTP` mutation

---

## 🚀 User Flows

### **Flow 1: Google Login with OTP Verification**

```
User opens Login page
    ↓
Clicks "Sign in with Google"
    ↓
Google Sign-In dialog opens
    ↓
User selects Google account
    ↓
googleAuth mutation runs
    ↓
✉️ OTP sent to Google email
    ↓
UI shows OTP input screen
    ↓
User enters 6-digit code
    ↓
verifyGoogleOtp mutation runs
    ↓
✅ User logged in with JWT token
```

### **Flow 2: Google Registration with OTP Verification**

```
User opens Register page
    ↓
Clicks "Sign up with Google"
    ↓
Google Sign-In dialog opens
    ↓
User selects Google account
    ↓
System creates new user account (or finds existing)
    ↓
googleAuth mutation runs
    ↓
✉️ OTP sent to Google email
    ↓
UI shows OTP input screen
    ↓
User enters 6-digit code
    ↓
verifyGoogleOtp mutation runs
    ↓
✅ New user registered and logged in with JWT token
```

### **Flow 3: Traditional Email + Password Registration (Still Works)**

```
User opens Register page
    ↓
Enters username, email, password
    ↓
Clicks "Send Verification Code"
    ↓
sendOtp mutation runs
    ↓
✉️ OTP sent to email
    ↓
User enters 6-digit code
    ↓
registerUser mutation runs
    ↓
✅ User registered and logged in with JWT token
```

---

## 🎯 Key Features

✅ **Security**
- OTP codes expire in 10 minutes
- Google OAuth verifies identity server-side
- Invalid OTP codes are rejected
- Each OTP code is single-use

✅ **User Experience**
- Simple 2-step process
- Auto-formatted OTP input (digits only)
- Clear error messages
- Resend options for email flow
- Back buttons to change method

✅ **Developer-Friendly**
- Reuses existing `EmailOTP` model
- No database migrations needed
- Clean GraphQL schema
- Proper error handling

---

## 📚 API Documentation

### **googleAuth Mutation**

```graphql
mutation GoogleAuth($googleToken: String!) {
  googleAuth(googleToken: $googleToken) {
    success: Boolean!
    message: String!
    email: String
    isNewUser: Boolean!
  }
}
```

**Response Examples:**

✅ Success (OTP sent):
```json
{
  "data": {
    "googleAuth": {
      "success": true,
      "message": "Verification code sent to your email. Please check your inbox.",
      "email": "user@gmail.com",
      "isNewUser": true
    }
  }
}
```

❌ Error (Invalid token):
```json
{
  "data": {
    "googleAuth": {
      "success": false,
      "message": "Invalid Google token.",
      "email": null,
      "isNewUser": false
    }
  }
}
```

---

### **verifyGoogleOtp Mutation**

```graphql
mutation VerifyGoogleOTP($email: String!, $otpCode: String!) {
  verifyGoogleOtp(email: $email, otpCode: $otpCode) {
    success: Boolean!
    message: String!
    token: String
  }
}
```

**Response Examples:**

✅ Success (OTP verified):
```json
{
  "data": {
    "verifyGoogleOtp": {
      "success": true,
      "message": "Email verified successfully! You are now logged in.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

❌ Error (Invalid OTP):
```json
{
  "data": {
    "verifyGoogleOtp": {
      "success": false,
      "message": "Invalid or expired verification code.",
      "token": null
    }
  }
}
```

---

## 🧪 Testing

### **Manual Testing Steps**

#### Test 1: Register with Google + OTP

1. Go to http://localhost:5173/register
2. Click **"Sign up with Google"**
3. Select a Gmail account
4. You should see: **"Verification code sent to your email..."** (Step 3 form)
5. Check your email inbox for the OTP code (or check backend console if DEBUG=True)
6. Enter the 6-digit code
7. Click **"Verify & Create"**
8. Should redirected home (logged in) ✅

#### Test 2: Login with Google + OTP

1. Go to http://localhost:5173/ (login page)
2. Click **"Sign in with Google"**
3. Select the same Gmail account
4. You should see: **"Verification code sent to your email..."** (OTP form)
5. Check your email for OTP code
6. Enter the 6-digit code
7. Click **"Verify & Sign In"**
8. Should be redirected home (logged in) ✅

#### Test 3: Test OTP Expiration

1. Start the Google login flow
2. Wait 10+ minutes without entering OTP
3. Try to enter the old OTP code
4. Should see: **"Invalid or expired verification code."** ❌

#### Test 4: Traditional Email Registration Still Works

1. Go to http://localhost:5173/register
2. Fill in username, email, password
3. Click **"Send Verification Code"**
4. Enter OTP from email
5. Should complete registration ✅

---

## 🔌 Integration with Existing Code

### **Login Component State**
```javascript
const [googleOtpStep, setGoogleOtpStep] = useState(false);
const [googleEmail, setGoogleEmail] = useState('');
const [googleOtp, setGoogleOtp] = useState('');
```

### **Register Component State**
```javascript
const [step, setStep] = useState(1); // 1=form, 2=email+password OTP, 3=Google OTP
const [googleEmail, setGoogleEmail] = useState('');
const [googleOtp, setGoogleOtp] = useState('');
const [googleIsNewUser, setGoogleIsNewUser] = useState(false);
```

### **Mutation Usage**
```javascript
const [googleAuth, { loading: googleLoading }] = useMutation(GOOGLE_AUTH);
const [verifyGoogleOtp, { loading: verifyingOtp }] = useMutation(VERIFY_GOOGLE_OTP);
```

---

## ⚡ Performance Considerations

- **Email sending**: OTP sent via configured SMTP (Gmail, SendGrid, etc.)
- **Database queries**: Minimal - only 1-2 queries per auth flow
- **OTP storage**: Uses `EmailOTP` model with auto-expiration
- **Token generation**: Uses existing `get_token()` from `graphql_jwt`

---

## 🐛 Troubleshooting

### **OTP not received in email**

1. **Check email configuration** in `backend/.env`:
   ```env
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   ```

2. **Check spam folder** - email might be filtered

3. **Check backend logs** - Django prints OTP in console if email fails
   ```
   WARNING Email send failed (...). OTP for user@gmail.com: 123456
   ```

4. **Verify SMTP credentials** work:
   ```powershell
   python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail('Test', 'Test message', 'from@gmail.com', ['to@gmail.com'])
   ```

### **Google OTP button not working**

1. **Check Google library loaded**:
   - Open browser DevTools (F12)
   - Type `google` in console
   - Should return an object (not error)

2. **Check CORS settings** in `backend/.env`:
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:5173,...
   ```

3. **Check Google Client ID**:
   - Verify same ID in frontend `.env` and Google Cloud Console
   - Verify localhost:5173 is in authorized JavaScript origins

### **"User not found" error**

This happens if:
- Google auth created user, but OTP verification happens on different session
- Database sync issue with multiple replicas

**Solution**: Have user try again from Google login start

---

## 📝 Database Schema

Uses existing `EmailOTP` model (no changes needed):

```python
class EmailOTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # 10 minutes
    is_verified = models.BooleanField(default=False)
```

---

## 🚀 Deployment Checklist

- [ ] Email SMTP credentials configured in production `.env`
- [ ] `DJANGO_DEBUG=False` in production
- [ ] Google Client ID verified for production domain
- [ ] CORS_ALLOWED_ORIGINS includes production frontend URL
- [ ] JWT token expiration settings appropriate
- [ ] Email sending tested in production
- [ ] Error logging configured (Sentry, etc.)

---

## 📖 Related Files

- Backend Schema: [analyser/schema.py](backend/analyser/schema.py)
- Models: [analyser/models.py](backend/analyser/models.py)
- Login UI: [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)
- Register UI: [frontend/src/pages/Register.jsx](frontend/src/pages/Register.jsx)
- GraphQL: [frontend/src/graphql/queries.jsx](frontend/src/graphql/queries.jsx)

---

## 🎓 Learning Resources

- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- OTP best practices: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- GraphQL JWT: https://django-graphql-jwt.domake.io/

---

## ✨ Features in This Implementation

✅ Server-side Google token verification (secure)  
✅ 6-digit OTP with 10-minute expiration  
✅ Single-use OTP codes  
✅ Automatic secondary user creation on first auth  
✅ Free plan assignment for new users  
✅ Proper error messages  
✅ Resend OTP functionality (email flow)  
✅ JWT token generation after verification  
✅ Works for both new registration and existing login  

---

## 🤝 Support

If users encounter issues:
1. Check backend logs for OTP issues
2. Verify email configuration
3. Ensure Google OAuth credentials are correct
4. Check browser console for JavaScript errors

---

**Last Updated**: February 22, 2026
**Status**: ✅ Ready to Use
