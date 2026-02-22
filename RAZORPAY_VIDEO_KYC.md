# Razorpay Video KYC Process - Complete Guide

## ❓ What is Video KYC?

KYC = **Know Your Customer** (Government requirement)

Video KYC is Razorpay's way to verify:
- ✅ You are a real person
- ✅ Your identity is genuine
- ✅ Your business is legitimate
- ✅ You comply with government regulations

**It's a video verification process** where you show your ID and answer questions.

---

## ❌ Do You Need Video KYC NOW?

### **For Testing/Development:**
```
NO ❌ - Test keys don't need KYC
```

### **For Live/Accepting Real Payments:**
```
YES ✅ - Required to accept real money
```

---

## 📊 KYC Timeline

| Action | Test Mode | Live Mode |
|--------|-----------|-----------|
| **Get Test Keys** | ✅ Immediate | - |
| **Test Payments** | ✅ Works | - |
| **Complete KYC** | ❌ Not needed | ✅ Required |
| **Get Live Keys** | - | ✅ After KYC approved |
| **Accept Real Payments** | ❌ Cannot | ✅ After approval |

---

## 🎬 When Will Razorpay Ask for Video KYC?

You'll see a KYC request when:

1. **You try to switch to Live Mode**
   - Razorpay detects you want to accept real payments
   - Asks for KYC verification

2. **After 30-60 days of test account**
   - If planning to go live

3. **When you request to activate Live Keys**
   - Manually request activation in dashboard

---

## 📝 What Documents Do You Need for Video KYC?

### **Required:**
- ✅ Government-issued ID:
  - Aadhar Card (India)
  - PAN Card (India)
  - Passport
  - Driving License
  - Voter ID
  
- ✅ Address Proof:
  - Utility bill (electricity, water)
  - Bank statement
  - Rental agreement
  - Government letter

- ✅ PAN (if in India)
  - Required for business accounts

### **What to Prepare:**
```
1. ID document (color, clear photo)
2. Address proof (recent, less than 6 months old)
3. PAN card or equivalent
4. Your business documents (if applicable)
5. Bank account details
```

---

## 🎥 Step-by-Step Video KYC Process

### **Step 1: Start KYC**

1. Log in to https://dashboard.razorpay.com
2. Go to **Settings → Account Settings**
3. Go to **Compliance** or **KYC**
4. Click **Start KYC Verification** or **Complete KYC**

### **Step 2: Choose Verification Method**

Razorpay will offer:
- ✅ **Video KYC** (Recommended - Fastest)
- ✅ **Manual Verification** (Slower - 5-7 days)

Select **Video KYC**

### **Step 3: Provide Information**

**Personal Details:**
- Full name
- Date of birth
- Phone number
- Email address

**Business Details:**
- Business type
- Business name
- Nature of business
- Expected transaction volume

**Address Details:**
- Current address
- Pincode
- State
- Country

### **Step 4: Upload Documents**

Upload clear photos:
- ✅ ID Proof (front & back)
- ✅ Address Proof
- ✅ PAN Card
- ✅ Selfie with ID

**Quality Tips:**
- Good lighting (not dark)
- Clear images (not blurry)
- Complete document (all corners visible)
- Recent documents (less than 6 months old)

### **Step 5: Video Verification**

You'll be asked to:

1. **Show your ID**
   - Hold ID to camera
   - Show front and back
   - Razorpay verifies details match

2. **Take a Selfie**
   - Face clearly visible
   - Good lighting
   - Match with ID photo

3. **Answer Questions** (depends on Razorpay's process)
   - What is your business?
   - Where are you located?
   - What payments do you expect?
   - Simple verification questions

4. **Sign Consent Form**
   - Agree to terms
   - Confirm information is correct

**Duration: 5-10 minutes total**

---

## 🕐 Timeline After Video KYC

### **Instant (0-5 minutes):**
- ✅ Video submission complete
- ✅ You see "Submitted for verification"

### **Quick Review (1-2 hours):**
- Razorpay reviews video automatically
- Usually approved if quality is good

### **Manual Review (4-24 hours):**
- If automatic review needs human check
- Team reviews documents

### **Approval (usually same day):**
- ✅ KYC status: Approved
- ✅ You can now activate Live Keys
- ✅ Start accepting real payments

### **What If Rejected (Rare):**
- ❌ Re-submit with clearer documents
- ❌ Provide additional information
- ❌ Try again with better quality images

---

## ✅ After Video KYC is Approved

### **What Changes?**

**Before KYC:**
```
Test Keys: Active ✅
Live Keys: Inactive ❌ (grayed out)
```

**After KYC Approved:**
```
Test Keys: Still active ✅
Live Keys: Now active ✅ (can enable)
```

### **Next Steps:**

1. **Switch to Live Keys**
   - Settings → API Keys → Live Keys
   - Click "Use Live Keys"

2. **Update Your Code**

   **Backend (.env):**
   ```env
   RAZORPAY_KEY_ID=rzp_live_your_production_key
   RAZORPAY_KEY_SECRET=rzp_live_your_production_secret
   RAZORPAY_WEBHOOK_SECRET=live_webhook_secret
   ```

   **Frontend (.env):**
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_live_your_production_key
   ```

3. **Update Webhook URL**
   - Change from localhost to real domain
   - Settings → Webhooks
   - Update URL: `https://yourdomain.com/api/razorpay-webhook/`

4. **Deploy to Production**
   - Push code with live keys
   - Deploy to your real server
   - Update CORS for your real domain

5. **Start Accepting Payments**
   - Now you can accept real payments! 💰
   - Test with real card first (small amount)
   - Monitor transactions

---

## 📊 Complete Timeline from Now to Live

```
TODAY
│
├─ Create Razorpay Account (Test)
│  └─ Get Test Keys ✅
│
├─ Test Payments (1-2 weeks)
│  └─ Payment flow works ✅
│
├─ Deploy to Real Server (1-2 weeks)
│  └─ Domain + SSL ready ✅
│
├─ Request Live Keys
│  └─ Razorpay asks for KYC
│
├─ Complete Video KYC (30 min)
│  └─ Submit documents & video
│
├─ Wait for Approval (4-24 hours)
│  └─ Usually same day
│
├─ Switch to Live Keys
│  └─ Update code with live keys
│
└─ Accept Real Payments! 💰
   └─ Your app is live!
```

---

## ⚠️ Important: During Video KYC

### **DO:**
- ✅ Show ID clearly (all text readable)
- ✅ Use good lighting (natural light best)
- ✅ Clear camera (clean lens)
- ✅ Speak clearly (mic works)
- ✅ Fill forms truthfully
- ✅ Use recent documents
- ✅ Be natural in selfie
- ✅ Read questions carefully
- ✅ Speak in clear voice

### **DON'T:**
- ❌ Use fake documents
- ❌ Show blurry/old photos
- ❌ Wear sunglasses/hat
- ❌ Have bad lighting
- ❌ Rush through process
- ❌ Provide false information
- ❌ Hide parts of ID
- ❌ Use old addresses
- ❌ Use VPN (may cause issues)

---

## 🎯 Common Issues & Solutions

### **Issue 1: Video Rejected - Poor Quality**
**Solution:**
- Retake in better lighting
- Use good camera (phone front camera is fine)
- Ensure text on ID is readable
- Resubmit

### **Issue 2: Names Don't Match**
**Solution:**
- Ensure name on ID exactly matches form
- If recently married, provide proof
- Complete KYC shows correct name

### **Issue 3: Address Proof Expired**
**Solution:**
- Use document less than 6 months old
- Get new utility bill/bank statement
- Resubmit with valid proof

### **Issue 4: Multiple Rejections**
**Solution:**
- Contact Razorpay support
- Provide additional documents
- Call Razorpay helpline for guidance

### **Issue 5: KYC Takes Too Long**
**Solution:**
- Normal: 4-24 hours
- If longer, email support
- Razorpay team will help

---

## 📞 Razorpay Support

If video KYC fails or takes too long:

**Email Support:**
```
support@razorpay.com
```

**Live Chat:**
```
Dashboard → Help → Chat with support
```

**Phone (India):**
```
1-888-825-3636 (US)
+91-9999-123-123 (India)
```

---

## 🗓️ Your Timeline: When Should You Do This?

### **Right Now (This Week):**
- [ ] Create Razorpay account
- [ ] Get test keys
- [ ] Start testing payments
- [ ] Use localhost (no KYC needed)

### **In 1-2 Weeks:**
- [ ] Finish testing all features
- [ ] Prepare for production deployment

### **When Ready to Deploy (2-4 Weeks):**
- [ ] Get a real domain
- [ ] Set up SSL/HTTPS
- [ ] Deploy your app
- [ ] Prepare documents for KYC

### **Before Going Live (After Deployment):**
- [ ] Complete Video KYC
- [ ] Get approval (usually same day)
- [ ] Switch to Live Keys
- [ ] Update webhook URL
- [ ] Start accepting real payments

---

## ✅ Checklist: Before Video KYC

- [ ] Documents ready:
  - [ ] Government ID (clear photo)
  - [ ] Address proof (recent)
  - [ ] PAN card (if India)
  - [ ] Selfie with ID

- [ ] Environment ready:
  - [ ] Good lighting
  - [ ] Quiet room
  - [ ] Working microphone
  - [ ] Working camera
  - [ ] Good internet

- [ ] Information ready:
  - [ ] Business name
  - [ ] Business type
  - [ ] Expected monthly volume
  - [ ] Your address
  - [ ] Your phone number

- [ ] Code ready:
  - [ ] Production domain ready
  - [ ] SSL certificate installed
  - [ ] App deployed to real server
  - [ ] Webhook URL configured

---

## 🎯 Bottom Line

**Video KYC:**
- ❌ NOT needed for testing (right now)
- ✅ Only needed when going live
- ⏱️ Takes 30 minutes to complete
- ⏱️ Approval in 4-24 hours (usually same day)
- 💰 Enables real payments

**Your Current Status:**
```
Today: Test with localhost (no KYC)
Later: Complete KYC before going live (needed once)
```

---

## 🚀 Action Plan

1. **Now (Week 1)**
   - Test with localhost + test keys
   - No KYC needed ✅

2. **Week 2-3**
   - Finish app development
   - Prepare for deployment

3. **Week 4**
   - Deploy to real server
   - Request live keys
   - Complete Video KYC

4. **Week 4-5**
   - Wait for approval (usually 1 day)
   - Update to live keys

5. **Week 5 Onwards**
   - Accept real payments! 💰

---

**You don't need to worry about Video KYC right now!** Focus on testing with localhost first. When you're ready to deploy and accept real payments, complete the 30-minute KYC process. Easy! 🎉
