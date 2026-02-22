# Razorpay API Setup Guide

## 📋 Step-by-Step Guide to Get Razorpay API Keys

### **Step 1: Create a Razorpay Account**

1. Go to https://razorpay.com
2. Click **"Sign Up"** in the top right
3. Choose **"Business"** as account type
4. Fill in your details:
   - Business name
   - Email address
   - Mobile number
   - Password
5. Click **"Create Account"**
6. Verify your email by clicking the link sent to your inbox

---

### **Step 2: Complete Account Verification**

1. After email verification, log in to https://dashboard.razorpay.com
2. Complete KYC (Know Your Customer) verification:
   - PAN number (or equivalent)
   - Business address
   - Bank account details
3. Upload required documents
4. Wait for verification (usually 24-48 hours)

**Note**: You can use API keys in **test mode** before verification is complete.

---

### **Step 3: Access API Keys**

#### **For Test Keys (Development)**

1. Log in to https://dashboard.razorpay.com
2. Go to **Settings** → **API Keys**
3. You'll see two tabs:
   - **Live Keys** (for production)
   - **Test Keys** (for development) ✅ **Use this for now**
4. Click on **Test Keys** tab
5. You'll see two keys:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this private!)

**Example Test Keys:**
```
Key ID:     rzp_test_1234567890abcd
Key Secret: abcd1234567890efgh1234
```

#### **For Live Keys (Production)**

1. Same location: **Settings** → **API Keys**
2. Click **Live Keys** tab
3. Copy your:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret**

**⚠️ Important**: Never share Key Secret publicly!

---

### **Step 4: Get Webhook Secret**

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **"Add New Webhook"**
3. Enter webhook URL: `https://yourdomain.com/api/razorpay-webhook/`
   - For testing locally: `http://localhost:8000/api/razorpay-webhook/`
4. Select events to listen to:
   - ✅ `payment.authorized`
   - ✅ `payment.failed`
   - ✅ `payment.captured`
   - ✅ `subscription.activated`
   - ✅ `subscription.pending`
   - ✅ `subscription.halted`
   - ✅ `subscription.cancelled`
   - ✅ `subscription.completed`
   - ✅ `subscription.updated`
5. Click **"Create Webhook"**
6. Copy the **Webhook Secret** (shown on the webhook details page)

---

### **Step 5: Configure Your Application**

Update `backend/.env` file with your Razorpay keys:

```env
# Razorpay Payment Integration
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=abcd1234567890efgh1234
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**For Production** (later):
```env
# Razorpay Payment Integration (LIVE)
RAZORPAY_KEY_ID=rzp_live_1234567890abcd
RAZORPAY_KEY_SECRET=abcd1234567890efgh1234_live
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
```

---

## 🧪 Testing Razorpay Integration

### **Test Cards for Development**

Use these card numbers to test payments:

**Successful Payment:**
```
Card Number: 4111111111111111
Expiry:      Any future date (e.g., 12/25)
CVV:         Any 3 digits (e.g., 123)
Name:        Any name
```

**Failed Payment (to test error handling):**
```
Card Number: 4000000000000002
Expiry:      Any future date
CVV:         Any 3 digits
Name:        Any name
```

**3D Secure Payment (requires OTP):**
```
Card Number: 4012888888881881
Expiry:      Any future date
CVV:         Any 3 digits
OTP:         123456 (any 6 digits)
```

### **Test Your Integration**

1. Start Django server:
```bash
cd backend
python manage.py runserver
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

3. Go to http://localhost:5173/pricing
4. Click on a plan to create payment order
5. Use test card above
6. Check:
   - Payment page loads ✅
   - Payment processes ✅
   - Success/failure message shows ✅
   - Webhook received ✅

---

## 📊 Razorpay Dashboard Overview

Once logged in at https://dashboard.razorpay.com, you'll see:

### **Home Dashboard**
- Account balance
- Recent transactions
- Quick stats

### **Payments Section**
- View all payments
- Filter by date/status
- Download invoices

### **Customers Section**
- Manage customer data
- View payment history

### **Subscriptions Section**
- Manage subscription plans
- Track active subscriptions
- View recurring payments

### **Settings**
- **API Keys** - Your authentication credentials
- **Webhooks** - Configure event notifications
- **Invoice Settings** - Customize invoice templates
- **Account Settings** - Business details

---

## 🔐 Security Best Practices

✅ **Do's**:
- ✅ Keep Key Secret private - never commit to Git
- ✅ Use environment variables for keys
- ✅ Rotate keys periodically
- ✅ Use Test mode for development
- ✅ Sign all webhook requests with secret
- ✅ Validate webhook signatures server-side

❌ **Don'ts**:
- ❌ Don't hardcode keys in code
- ❌ Don't share Key Secret via email/chat
- ❌ Don't use live keys for testing
- ❌ Don't expose keys in client-side code
- ❌ Don't log sensitive key data

---

## 🔗 Razorpay Integration in Your App

Your AI Project Analyser already has Razorpay integration set up:

### **Backend Setup** (Already configured)
- Location: [analyser/razorpay_utils.py](backend/analyser/razorpay_utils.py)
- GraphQL mutations in [analyser/schema.py](backend/analyser/schema.py)
- Mutations implemented:
  - `createRazorpayOrder` - Create payment order
  - `verifyRazorpayPayment` - Verify payment
  - `createSubscription` - Create subscription plan

### **Frontend Setup** (Already configured)
- Payment form: [components/PaymentForm.jsx](frontend/src/components/PaymentForm.jsx)
- Pricing page: [pages/Pricing.jsx](frontend/src/pages/Pricing.jsx)
- Uses Razorpay Checkout library

### **Database Models** (Already set up)
- `Payment` - Stores payment transactions
- `Invoice` - Stores payment invoices
- `Plan` - Subscription plans
- `UserSubscription` - User subscription status

---

## 📝 Configuration Checklist

- [ ] Create Razorpay account at https://razorpay.com
- [ ] Complete email verification
- [ ] Generate Test API Keys
- [ ] Copy `RAZORPAY_KEY_ID` to `.env`
- [ ] Copy `RAZORPAY_KEY_SECRET` to `.env`
- [ ] Create webhook at https://dashboard.razorpay.com
- [ ] Copy `RAZORPAY_WEBHOOK_SECRET` to `.env`
- [ ] Test with test card numbers
- [ ] Verify payments appear in dashboard
- [ ] Check subscription plans in Razorpay dashboard

---

## 🚀 Next Steps After Setup

1. **Update Backend .env**:
   ```bash
   # Add to backend/.env
   RAZORPAY_KEY_ID=your_test_key_id
   RAZORPAY_KEY_SECRET=your_test_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

2. **Restart Django Server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **Test Payment Flow**:
   - Go to http://localhost:5173/pricing
   - Click upgrade button
   - Enter test card details
   - Complete payment

4. **View Transaction in Dashboard**:
   - Go to https://dashboard.razorpay.com
   - Check Payments section
   - Verify transaction details

---

## 📚 Useful Links

- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **API Documentation**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/payments/test-cases/
- **Webhooks Guide**: https://razorpay.com/docs/webhooks/
- **Subscription Plans**: https://razorpay.com/docs/subscriptions/

---

## ❓ Common Issues

### **"Invalid Key ID" Error**
- **Cause**: Wrong key ID format or incomplete setup
- **Fix**: Double-check key starts with `rzp_test_` or `rzp_live_`

### **Payment Page Doesn't Load**
- **Cause**: Key ID/Secret not in `.env`
- **Fix**: Restart Django server after updating `.env`

### **Webhook Not Triggering**
- **Cause**: Webhook URL incorrect or not accessible
- **Fix**: Use `ngrok` to tunnel localhost for testing

### **"Unauthorized" Errors**
- **Cause**: Key Secret is wrong or expired
- **Fix**: Generate new keys in dashboard

### **Live Mode Not Working**
- **Cause**: Not verified/no payment method added
- **Fix**: Complete KYC verification first, switch to Test mode for now

---

## 💡 Development vs Production

### **Development (Test Mode)**
- Use `rzp_test_` keys
- Use test card numbers
- No real money charged
- Perfect for testing

### **Production (Live Mode)**
- Use `rzp_live_` keys
- Real payments processed
- Requires KYC verification
- Enable only after testing complete

---

## 📞 Support

- **Razorpay Support**: https://razorpay.com/contact/
- **Documentation**: https://razorpay.com/docs/
- **Status Page**: https://status.razorpay.com/

---

**Last Updated**: February 22, 2026  
**Status**: ✅ Complete Setup Guide
