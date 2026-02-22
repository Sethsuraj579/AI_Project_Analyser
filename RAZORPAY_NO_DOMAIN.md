# Razorpay Setup Without a Domain Name - Development Guide

## ❓ Why Razorpay Asks for Website Info?

Razorpay asks for website information during account setup because:
- They need to verify you're a legitimate business
- They need to know where the payments will be processed
- It's part of their compliance process

**However**, you can still use Razorpay in **development/testing mode** without a real domain!

---

## ✅ **Option 1: Use Localhost for Development** (What You Should Do Now)

### **Step 1: Create Razorpay Account**

1. Go to https://razorpay.com/signup
2. Fill in the form:
   - **Email**: Your email address
   - **Business Name**: Any name (e.g., "My Test Business" or "AI Project Analyser")
   - **Phone Number**: Your phone number
   - **Password**: Your password
3. Click **Create Account**
4. Verify your email

---

### **Step 2: Complete Account Setup**

1. Log in to https://dashboard.razorpay.com
2. You'll see a setup wizard asking for:
   - **Business Type**: Select "Sole Proprietor" or "Company"
   - **Business Category**: Select "Software/IT Services"
   - **Website**: Enter `http://localhost:5173` or `http://localhost:3000`
   - **Business Address**: Enter any address

**For Website field**, you have options:

```
Option 1 (Localhost):
Website: http://localhost:5173

Option 2 (Local IP):
Website: http://192.168.x.x:5173

Option 3 (ngrok tunnel - covered below):
Website: https://abc123.ngrok.io

Option 4 (Placeholder - if field allows):
Website: http://myapp.local
```

---

### **Step 3: Get API Keys (Test Mode)**

1. After account creation, go to **Settings → API Keys**
2. You'll see two tabs:
   - **Test Keys** ← Use these for development
   - **Live Keys** (for production later)

3. Click **Test Keys** tab
4. You'll see:
   - **Key ID**: `rzp_test_xxxxx`
   - **Key Secret**: Copy this (keep it secret!)

**Important**: Test keys work without KYC verification! ✅

---

### **Step 4: Test Payments**

Use these test card numbers:
```
✅ Success:  4111111111111111
❌ Failed:   4000000000000002
🔐 3D Auth:  4012888888881881

Expiry:  Any future date (01/25, 12/26, etc.)
CVV:     Any 3 digits (123, 999, etc.)
```

---

## 🚀 **Option 2: Use Ngrok for Webhook Testing** (Advanced)

If you want to test webhooks without a real domain:

### **What is ngrok?**
- Free tool that creates a public URL for your localhost
- Allows Razorpay to send webhooks to your local machine
- Perfect for development

### **Setup Steps:**

#### **Step 1: Download ngrok**
1. Go to https://ngrok.com/download
2. Download for Windows
3. Extract and add to PATH (or use from folder)

#### **Step 2: Start ngrok**
```bash
ngrok http 8000
```

This will show:
```
ngrok by @inconshreveable

Session Status: online
Account (Plan): Free
Version: 3.x.x
Region: us (United States)

Expose locally running web server over the internet.

Web Interface: http://127.0.0.1:4040

Forwarding: https://abc123def456.ngrok.io -> http://localhost:8000
```

Copy the URL: `https://abc123def456.ngrok.io`

#### **Step 3: Use ngrok URL in Razorpay**

**For Website field** in Razorpay setup:
```
https://abc123def456.ngrok.io
```

**For Webhook URL** in Razorpay webhooks:
```
https://abc123def456.ngrok.io/api/razorpay-webhook/
```

#### **Step 4: Update Backend**

In `backend/.env`:
```env
# For webhook testing
WEBHOOK_URL=https://abc123def456.ngrok.io/api/razorpay-webhook/
```

---

## 📊 **Comparison: Different Setup Methods**

| Method | Domain Needed | Webhooks | Cost | Setup Time |
|--------|---|---|---|---|
| **Localhost (Recommended)** | ❌ No | ❌ Won't work | Free | 5 min |
| **Ngrok Tunnel** | ❌ No | ✅ Works! | Free | 10 min |
| **Free Domain (Freenom)** | ✅ Yes | ✅ Works | Free | 20 min |
| **Paid Domain** | ✅ Yes | ✅ Works | $$ | 20 min |

---

## ✅ **RECOMMENDED: Localhost Setup**

For development right now, **use localhost** because:

1. ✅ Fastest to set up
2. ✅ No domain needed
3. ✅ Test API keys work without KYC
4. ✅ Perfect for testing payment flow
5. ✅ Can upgrade to ngrok later for webhooks

### **Quick Setup:**

```
1. Go to https://razorpay.com/signup
2. Fill in account details
3. For Website: Enter http://localhost:5173
4. Get Test API Keys
5. Add to backend/.env and frontend/.env
6. Done! ✅
```

---

## 🔄 **Production Path (Later)**

When you're ready to go live:

1. **Get a real domain** (or use free options below)
2. **Deploy your application**
3. **Update Razorpay settings** with real domain
4. **Switch to Live Keys** in Razorpay
5. **Complete KYC verification** in Razorpay
6. **Start accepting real payments**

---

## 🆓 **Free Domain Options** (If Needed)

### **Option 1: Freenom (Completely Free)**
- Go to https://www.freenom.com
- Get free domains: `.tk`, `.ml`, `.ga`, `.cf`
- Example: `myapp.tk`
- Set up DNS to point to your server
- Use in Razorpay

### **Option 2: Subdomain Service (Free)**
- https://no-ip.com (free dynamic DNS)
- https://duckdns.org (free DuckDNS)
- Create subdomain like `myapp.duckdns.org`
- Point to your server IP

### **Option 3: GitHub Pages (Static Only)**
- Free hosting for static sites
- Not suitable for backend API

---

## 📋 **Step-by-Step: What to Fill in Razorpay**

### **During Signup:**
```
Email: your_email@gmail.com ✅ (required)
Business Name: MyCompany or Your Name ✅ (required)
Phone: Your phone number ✅ (required)
Password: Your password ✅ (required)
```

### **During Setup Wizard:**
```
Business Type: Sole Proprietor (easiest option) ✅
Business Category: Software/IT Services ✅
Website: http://localhost:5173 ✅ (for now)
Business Address: Any address ✅ (for testing)
```

### **After Account Created:**
```
Settings → API Keys → Test Keys ✅ (Get here!)
Settings → Webhooks → (Setup later if needed)
```

---

## ✨ **Timeline**

### **NOW (Today) - Development:**
- Create Razorpay account
- Get Test API Keys
- Use `http://localhost:5173` as website
- Test with test card numbers
- No KYC needed! ✅

### **LATER (When Ready) - Production:**
- Get a real domain (paid or free)
- Deploy your application
- Switch to Live Keys
- Complete KYC verification
- Accept real payments

---

## ⚠️ **Important Notes**

**DO NOT**:
- ❌ Don't use live keys for testing
- ❌ Don't use real payment cards for testing
- ❌ Don't deploy without verifying payment flow

**DO**:
- ✅ Use Test keys for development
- ✅ Use test card numbers (provided by Razorpay)
- ✅ Test locally first before deploying
- ✅ Use ngrok if you need to test webhooks

---

## 🎯 **Your Action Plan**

1. **Right Now:**
   - [ ] Go to https://razorpay.com/signup
   - [ ] Create account with your email
   - [ ] During setup, enter `http://localhost:5173` as website
   - [ ] Get Test API Keys
   - [ ] Add keys to `.env` files
   - [ ] Test with test cards

2. **Later (After Testing Works):**
   - [ ] Get a real domain (if needed)
   - [ ] Deploy to server
   - [ ] Switch to Live Keys
   - [ ] Complete KYC in Razorpay
   - [ ] Accept real payments

---

## 📞 **What If Razorpay Asks for More Info?**

**Common Questions:**

**Q: Do I need a registered business?**  
A: No, test mode works without. For live, you might need.

**Q: Can I use a fake address?**  
A: For testing, yes. For live, use real address (compliance).

**Q: What if payment processing is declined?**  
A: In test mode, use provided test cards. For live, ensure KYC is complete.

**Q: Can I change domain later?**  
A: Yes! Update in Razorpay Settings → Account Settings.

---

## ✅ **Checklist: Ready to Test?**

- [ ] Razorpay account created
- [ ] Test API Keys obtained
- [ ] `RAZORPAY_KEY_ID` added to backend/.env
- [ ] `RAZORPAY_KEY_SECRET` added to backend/.env
- [ ] `VITE_RAZORPAY_KEY_ID` added to frontend/.env
- [ ] Django server running (`python manage.py runserver`)
- [ ] Frontend running (`npm run dev`)
- [ ] Go to http://localhost:5173/pricing
- [ ] Click upgrade button
- [ ] Use test card: `4111111111111111`
- [ ] Payment should work! ✅

---

**You're ready! Start with localhost and upgrade to a real domain when you launch! 🚀**
