# Payment Integration Setup Guide

## Required Tools & Services

### 1. **Stripe** (Recommended - Best for Subscriptions)
**Why**: Best-in-class SaaS subscriptions, webhooks, recurring billing
- **Cost**: 2.9% + $0.30 per transaction
- **Features**: 
  - Recurring billing (monthly auto-charge)
  - Invoice management
  - Webhook support
  - PCI compliance
  - Global payment methods

**Sign up**: https://dashboard.stripe.com/register

### 2. Alternative: PayPal
- Simpler setup but less flexible for recurring billing
- Higher fees: 3.49% + $0.49 per transaction

### 3. Alternative: Razorpay (Best for India/Asia)
- Lower fees, good for international
- More complex integration

---

## Stripe Setup (Step-by-Step)

### Step 1: Get Stripe Keys
```
1. Go to: https://dashboard.stripe.com
2. Sign up with email
3. Navigate to: Developers → API Keys
4. Copy:
   - Publishable Key: pk_test_xxxxx
   - Secret Key: sk_test_xxxxx
5. Add to .env:
   STRIPE_PUBLIC_KEY=pk_test_xxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Step 2: Install Python Package
```bash
pip install stripe django-extensions
```

### Step 3: Create Payment Models
Already included in the code below

### Step 4: Set Up Webhooks
```bash
# Install Stripe CLI for local testing
# https://stripe.com/docs/stripe-cli

stripe listen --forward-to localhost:8000/webhook/stripe/
```

---

## Implementation Files Created

### Backend Setup Files:
1. **analyser/models.py** - Add Payment & Subscription models
2. **analyser/schema.py** - Add GraphQL mutations for payments
3. **analyser/views.py** - Webhook handler
4. **analyser/urls.py** - Webhook URL routing
5. **.env** - Stripe keys

### Frontend Setup Files:
1. **PaymentForm.jsx** - Stripe card input component
2. **CheckoutPage.jsx** - Payment page
3. **InvoiceList.jsx** - View past invoices

---

## Stripe Payment Flow

```
User Selects Plan
      ↓
Stripe Payment Dialog Opens
      ↓
User Enters Card Details
      ↓
Stripe Creates Payment Intent
      ↓
Backend Creates Subscription
      ↓
Webhook Confirms Payment
      ↓
User Gets Access to Premium Features
```

---

## Database Schema

### Payment Model
```python
class Payment(models.Model):
    user = ForeignKey(User)
    plan = ForeignKey(Plan)
    amount = DecimalField
    stripe_payment_intent_id = CharField
    status = CharField(choices=['pending', 'succeeded', 'failed', 'canceled'])
    created_at = DateTimeField
    metadata = JSONField
```

### Invoice Model
```python
class Invoice(models.Model):
    user = ForeignKey(User)
    subscription = ForeignKey(UserSubscription)
    amount = DecimalField
    stripe_invoice_id = CharField
    status = CharField(choices=['draft', 'open', 'paid', 'void', 'uncollectible'])
    paid_at = DateTimeField
    due_date = DateField
```

---

## Key Stripe Concepts

### Payment Intent
- ONE-TIME payment for upgrading plan
- Created on frontend, confirmed on backend

### Subscription
- RECURRING charge (monthly/yearly)
- Automatic renewal at set intervals
- Can be canceled anytime

### Webhook
- Stripe notifies your server of payment events
- Handles: `payment_intent.succeeded`, `customer.subscription.updated`, etc.

---

## Testing with Stripe Test Card

```
Card Number:     4242 4242 4242 4242
Expiry:          12 / 25
CVC:             123
Name:            Any Name
```

---

## Security Checklist

✅ Never expose Secret Key in frontend
✅ Always verify webhook signatures
✅ Use HTTPS for payment pages
✅ Store PCI-sensitive data in Stripe only
✅ Validate all payment amounts on backend

---

## Cost Breakdown Example

**User upgrades to Basic Plan ($29/month)**

| Component | Cost |
|-----------|------|
| Stripe fee (2.9% + $0.30) | $1.14 |
| Your revenue | $27.86 |

**Annual revenue from 100 Basic subscribers**: ~$3,343

---

## Next Steps

1. ✅ Create Stripe account
2. ✅ Get test keys
3. ✅ Install stripe package
4. ✅ Add payment models & migrations
5. ✅ Create payment API endpoints
6. ✅ Set up webhook handler
7. ✅ Create frontend payment form
8. ✅ Test with Stripe test card
9. ✅ Switch to live keys for production

---

## Files to Implement (In This Guide)

See the next sections for complete code implementations for:
- Backend payment integration
- Frontend payment form
- Webhook handling
- Invoice management
