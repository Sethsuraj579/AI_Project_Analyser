# Email & Authentication Setup Guide

## 🛑 **Issue Identified**

Your Google login and registration are not sending emails because:

1. **Email Configuration Missing**: The `.env` file doesn't have email SMTP settings configured
2. **DEBUG Mode**: Currently, Django is in DEBUG mode, which uses a console email backend that only prints emails to the terminal instead of actually sending them

## ✅ **Solution: Configure Email Sending**

### Option 1: Using Gmail (Recommended for Development)

1. **Enable 2-Step Verification on your Google Account**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification if not already enabled

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character App Password (e.g., `abcd efgh ijkl mnop`)

3. **Update your `.env` file**

   Open `backend/.env` and update these lines:

   ```env
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=abcdefghijklmnop  # Your 16-char App Password (no spaces)
   DEFAULT_FROM_EMAIL=AI Project Analyser <your_email@gmail.com>
   ```

   **⚠️ Important**: 
   - Replace `your_email@gmail.com` with your actual Gmail address
   - Replace `abcdefghijklmnop` with your actual App Password (remove spaces)
   - Use the App Password, NOT your regular Gmail password

### Option 2: Using Other Email Providers

#### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@outlook.com
EMAIL_HOST_PASSWORD=your_password_here
DEFAULT_FROM_EMAIL=AI Project Analyser <your_email@outlook.com>
```

#### **SendGrid**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=AI Project Analyser <verified_sender@yourdomain.com>
```

#### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_HOST_USER=postmaster@your_mailgun_domain
EMAIL_HOST_PASSWORD=your_mailgun_smtp_password
DEFAULT_FROM_EMAIL=AI Project Analyser <noreply@your_mailgun_domain>
```

## 🔧 **Testing Email Sending**

### 1. Keep DEBUG Mode for Testing (Console Output)

If you want to see emails in the console during development (without actual sending):
- Keep `DJANGO_DEBUG=True` in your `.env`
- Emails will appear in the terminal where Django is running
- Check the terminal output after clicking "Send OTP"

### 2. Test Actual Email Sending

To test actual email sending:

1. **Temporarily disable DEBUG mode**:
   ```env
   DJANGO_DEBUG=False
   ```

2. **Restart the Django server**:
   ```powershell
   cd backend
   C:/Users/seths/OneDrive/Desktop/AI_project_analyser/backend/venv/Scripts/python.exe manage.py runserver
   ```

3. **Try registering with your email**:
   - Go to http://localhost:5173/
   - Click "Register"
   - Enter your details
   - Click "Send OTP"
   - Check your email inbox (and spam folder!)

4. **Re-enable DEBUG mode after testing**:
   ```env
   DJANGO_DEBUG=True
   ```

### 3. Test with Django Shell

You can also test email sending directly:

```powershell
cd backend
C:/Users/seths/OneDrive/Desktop/AI_project_analyser/backend/venv/Scripts/python.exe manage.py shell
```

Then in the Python shell:
```python
from django.core.mail import send_mail

send_mail(
    'Test Email',
    'This is a test email from AI Project Analyser',
    'your_email@gmail.com',  # From address
    ['recipient@example.com'],  # To address
    fail_silently=False,
)
```

## 🔐 **Google OAuth Setup**

Your Google OAuth Client ID is already configured. However, ensure:

1. **Frontend has the correct Client ID**:
   - Check `frontend/.env`:
     ```env
     VITE_GOOGLE_CLIENT_ID=110191981529-sjlv8e0t4ld7sbu2q9v40curdlbbvcjm.apps.googleusercontent.com
     ```

2. **Authorized JavaScript origins** (in Google Cloud Console):
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `http://127.0.0.1:5173`

3. **Authorized redirect URIs**:
   - `http://localhost:5173`
   - `http://localhost:3000`

4. **Google Sign-In Library** is loaded in `frontend/index.html`:
   ```html
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```

## 🐛 **Troubleshooting**

### Email not sending?

1. **Check email credentials**:
   - Verify EMAIL_HOST_USER is correct
   - Verify EMAIL_HOST_PASSWORD is the App Password (for Gmail)
   - Remove any spaces from the App Password

2. **Check firewall/antivirus**:
   - Some firewalls block SMTP port 587
   - Try port 465 with SSL instead

3. **Check Django logs**:
   - Look at the terminal where Django is running
   - You should see "OTP email sent to..." messages
   - If you see errors, they'll appear here

4. **Gmail specific**:
   - Ensure "Less secure app access" is OFF (you're using App Password)
   - Check "Recent security activity" in your Google Account

### Google OAuth not working?

1. **Check browser console** (F12):
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify Google library is loaded**:
   - Open browser console
   - Type: `google` - should return an object

3. **Check backend logs**:
   - Look for "Google OAuth is not configured on the server" errors
   - Look for "New Google user registered" success messages

4. **Token verification errors**:
   - Ensure system time is correct (important for JWT)
   - Check that GOOGLE_OAUTH_CLIENT_ID matches between backend and frontend

## 📝 **Current Configuration Status**

✅ **Backend**:
- Django 4.2.28 installed
- GraphQL schema with `sendOtp`, `registerUser`, `googleAuth` mutations configured
- Email configuration template added to `.env`

✅ **Frontend**:
- React with Apollo Client configured
- Google Sign-In Button component present
- All mutations (SEND_OTP, REGISTER_USER, GOOGLE_AUTH) properly defined

⚠️ **Action Required**:
- Add your actual email credentials to `backend/.env`
- Test email sending
- Restart Django server after updating `.env`

## 🚀 **Quick Start (After Configuration)**

1. **Update email credentials** in `backend/.env`

2. **Restart Django backend**:
   ```powershell
   cd backend
   C:/Users/seths/OneDrive/Desktop/AI_project_analyser/backend/venv/Scripts/python.exe manage.py runserver
   ```

3. **Start frontend** (if not running):
   ```powershell
   cd frontend
   npm run dev
   ```

4. **Test Registration**:
   - Go to http://localhost:5173
   - Click "Register"
   - Fill in details
   - Click "Send OTP"
   - Check your email (or console if DEBUG=True)
   - Enter OTP and register

5. **Test Google Sign-In**:
   - Click "Sign in with Google"
   - Select your Google account
   - Should automatically log you in

---

## 📌 **Summary**

**The main issue**: Email SMTP credentials are not configured in your `.env` file.

**The fix**: Add your Gmail address and App Password to `backend/.env` as shown above.

**After fix**: Restart the Django server and test registration with OTP email sending.

**Need help?** Check the Django terminal output for specific error messages.
