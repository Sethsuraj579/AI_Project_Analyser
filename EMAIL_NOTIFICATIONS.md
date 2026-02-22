# Email Notifications for Registration & Login

## 📧 Overview

Your system now automatically sends email notifications to users when they:

1. **Register** - Welcome email with account details
2. **Login** - Login notification with timestamp and security warning
3. **Google OAuth** - Welcome email for new Google users

These emails provide security notifications and help users keep track of account activity.

---

## 📬 Email Notifications

### **1. Registration Welcome Email**

**When Sent**: Upon successful registration (after OTP verification)

**Email Content**:
```
Subject: Welcome to AI Project Analyser! 🎉

Hello [USERNAME],

Welcome to AI Project Analyser! Your account has been created successfully.

Account Details:
- Username: [USERNAME]
- Email: [EMAIL]
- Plan: Free (Unlimited projects, 10 analyses per month)

You can now log in at: http://localhost:5173

If you didn't create this account, please contact our support team.

Best regards,
AI Project Analyser Team
```

**What It Contains**:
- ✅ Personalized greeting
- ✅ Account confirmation
- ✅ Plan information
- ✅ Login link
- ✅ Security notice

---

### **2. Login Notification Email**

**When Sent**: Every time a user successfully logs in 

**Email Content**:
```
Subject: Login Notification - AI Project Analyser

Hello [USERNAME],

You have successfully logged in to your AI Project Analyser account.

Login Details:
- Username: [USERNAME]
- Email: [EMAIL]
- Time: [DATETIME]

If this wasn't you, please change your password immediately at:
http://localhost:5173

Best regards,
AI Project Analyser Team
```

**What It Contains**:
- ✅ Login confirmation
- ✅ Username and email
- ✅ Exact login timestamp
- ✅ Security warning
- ✅ Password change link

---

### **3. Google Registration Welcome Email**

**When Sent**: Upon successful Google OAuth registration (after OTP verification)

**Email Content**: Same as #1 - Registration Welcome Email, but auto-generates username from Google profile.

---

## 🔧 Implementation Details

### **Backend Changes**

#### **Modified `RegisterUser` Mutation**
- **Location**: [schema.py](backend/analyser/schema.py#L526)
- Sends welcome email after successful user creation
- Email includes plan details and setup instructions
- Handles email failures gracefully (logs warning but doesn't fail registration)

#### **New `LoginUser` Mutation**
- **Location**: [schema.py](backend/analyser/schema.py#L1020)
- Custom login mutation (replaces generic GraphQL JWT)
- Sends login notification email
- Includes timestamp and security message
- Email failures don't block login (`fail_silently=True`)

#### **Updated `GoogleAuth` Mutation**
- Sends welcome email after OTP verification
- Includes Google user's name in email greeting

### **Frontend Changes**

#### **Updated [Login.jsx](frontend/src/pages/Login.jsx)**
- Changed to use `LOGIN_USER` mutation instead of `TOKEN_AUTH`
- Handles success/error responses from custom login mutation
- Shows appropriate messages to user

#### **Updated [queries.jsx](frontend/src/graphql/queries.jsx)**
- Added new `LOGIN_USER` mutation
- Keeps `TOKEN_AUTH` as fallback for other uses

---

## 🔌 GraphQL Mutations

### **LOGIN_USER Mutation**

```graphql
mutation LoginUser($username: String!, $password: String!) {
  loginUser(username: $username, password: $password) {
    success: Boolean!
    message: String!
    token: String
  }
}
```

**Example Usage**:
```javascript
const [loginUser, { loading }] = useMutation(LOGIN_USER);

// Call mutation
loginUser({
  variables: { 
    username: "john_doe", 
    password: "mypassword123" 
  }
});
```

**Response Examples**:

✅ Success:
```json
{
  "data": {
    "loginUser": {
      "success": true,
      "message": "Login successful!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

❌ Error:
```json
{
  "data": {
    "loginUser": {
      "success": false,
      "message": "Invalid username or password.",
      "token": null
    }
  }
}
```

---

## 📊 Email Flow Diagram

```
                    REGISTRATION FLOW
                          |
                          v
        User fills registration form
                          |
                          v
        Enter OTP from email verification
                          |
                          v
                   Register Mutation
                          |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   Create User       Assign Free Plan    Send Welcome Email
                                              |
                                              v
                                        Email Sent ✅
                                              |
                                              v
                                      Generate JWT Token
                                              |
                                              v
                                         User Logged In


                        LOGIN FLOW
                          |
                          v
        User enters username & password
                          |
                          v
                    Login Mutation
                          |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   Authenticate       Generate JWT      Send Login Email
                        Token                  |
                          |                    v
                          |               Email Sent ✅
                          |                    |
        +-------------------+-------------------+
                          |
                          v
                     User Logged In
```

---

## 🔐 Email Security

### **Sending Mechanism**
- Uses configured SMTP (Gmail, SendGrid, etc.)
- Secure TLS encryption (port 587)
- From address: Configured in `DEFAULT_FROM_EMAIL`

### **Content Security**
- No sensitive data sent (passwords never in email)
- Timestamp helps detect unauthorized logins
- Security notices encourage password changes

### **Error Handling**
- Registration: Email failure logged, but registration succeeds
- Login: Email failure doesn't block login
- All errors logged for debugging

---

## 📧 Email Configuration

### **Required Environment Variables**

In `backend/.env`:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
DEFAULT_FROM_EMAIL=AI Project Analyser <your_email@gmail.com>
```

### **Gmail Setup** (Recommended)

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password
4. Paste into `EMAIL_HOST_PASSWORD` in `.env`

### **Other Providers**

**Outlook/Hotmail**:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@outlook.com
EMAIL_HOST_PASSWORD=your_password
```

**SendGrid**:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
```

---

## 🧪 Testing Email Notifications

### **Test 1: Registration Email**

```bash
# Terminal 1: Start Django server
cd backend
python manage.py runserver

# Terminal 2: Start GraphQL test
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { registerUser(username:\"testuser\", email:\"test@gmail.com\", password:\"password123\", otpCode:\"000000\") { success message token } }"
  }'
```

**Check**:
- Backend console shows: "Welcome email sent to testuser..."
- Email inbox has welcome message
- Or in DEBUG mode: Email printed to console

### **Test 2: Login Email**

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { loginUser(username:\"testuser\", password:\"password123\") { success message token } }"
  }'
```

**Check**:
- Backend console shows: "Login notification email sent to..."
- Email inbox has login notification
- Email timestamp matches login time

### **Test 3: Debug Mode (Console Output)**

If using DEBUG=True, emails print to console instead of sending:

```
[INFO] Welcome email sent to newuser (newuser@example.com)
[INFO] Login notification email sent to: john_doe (john@example.com)
```

---

## 📱 User Experience

### **During Registration**
1. User fills form and clicks "Send Verification Code"
2. Receives OTP via email
3. Enters OTP and clicks "Verify & Create Account"
4. System creates account, sends welcome email
5. User redirected to dashboard ✅
6. Welcome email arrives in inbox

### **During Login**
1. User enters username/password
2. Clicks "Sign In"
3. System authenticates and sends login email
4. User redirected to dashboard ✅
5. Login notification arrives in inbox

---

## 🎯 Security Benefits

✅ **Notification of Account Activity**
- Users see all login attempts
- Can detect unauthorized access

✅ **Account Confirmation**
- Welcome email confirms account was created
- Helps users know feature is working

✅ **Audit Trail**
- Email timestamps prove login activity
- Useful for security investigations

✅ **Fraud Detection**
- Login from unexpected location/time?
- Email notification alerts user
- User can change password immediately

---

## 📝 Customization

### **Changing Email Templates**

Edit in `backend/analyser/schema.py`:

**RegisterUser**:
```python
send_mail(
    subject="Your Custom Title",
    message=f"""Custom email body here
    Username: {username}
    Email: {email}
    """,
    # ... rest of send_mail call
)
```

**LoginUser**:
```python
send_mail(
    subject="Custom Login Subject",
    message=f"""Custom login message
    Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    """,
    # ... rest of send_mail call
)
```

### **Changing From Address**

In `backend/.env`:
```env
DEFAULT_FROM_EMAIL=Your Company <noreply@company.com>
```

### **Adding Email Verification**

To verify emails before allowing login:
1. Create `email_verified` field in User model
2. Set to `False` on registration
3. Send verification link in welcome email
4. Mark as verified when link clicked

---

## 🚀 Deployment Checklist

- [ ] Email SMTP credentials configured
- [ ] `DJANGO_DEBUG=False` in production
- [ ] `DEFAULT_FROM_EMAIL` set to valid company email
- [ ] Email sending tested before deployment
- [ ] Error logging configured for email failures
- [ ] Email templates reviewed for branding

---

## 📚 Related Code

- Backend Mutations: [schema.py](backend/analyser/schema.py)
  - `RegisterUser` (line 526)
  - `LoginUser` (line 1020)
  - `GoogleAuth` (line 880)
- Frontend Login: [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)
- GraphQL Queries: [frontend/src/graphql/queries.jsx](frontend/src/graphql/queries.jsx)
- Settings: [project_analyser/settings.py](backend/project_analyser/settings.py) (lines 129-140)

---

## 🎓 Key Points

✨ **No Database Changes** - Uses existing Django User model

✨ **Non-Blocking** - Email failures don't affect registration/login

✨ **Secure** - Uses SMTP TLS, no passwords in emails

✨ **User-Friendly** - Clear, informative messages

✨ **Production-Ready** - Proper error handling and logging

---

## ❓ FAQ

**Q: What if email sending fails?**  
A: Registration/login still succeeds. Error is logged for debugging.

**Q: Can I customize email templates?**  
A: Yes, edit the `send_mail()` calls in schema.py. Consider using templates for larger projects.

**Q: Does DEBUG=True affect emails?**  
A: Yes. In DEBUG=True, emails print to console. In DEBUG=False, emails actually send.

**Q: How do I test without real email?**  
A: Set `EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend'` in settings.py

**Q: Can I send HTML emails?**  
A: Yes, use `send_mail(..., message_html=..., html_message=...)` instead of plain text.

**Q: How to prevent email spam?**  
A: Only send login emails during business hours, or add frequency limits.

---

**Last Updated**: February 22, 2026  
**Status**: ✅ Ready to Use
