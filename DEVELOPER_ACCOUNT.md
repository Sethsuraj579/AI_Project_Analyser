# 🔐 Developer Account - Testing Credentials

## Account Details

| Field | Value |
|-------|-------|
| **Username** | `developer` |
| **Email** | `developer@aianalyser.dev` |
| **Password** | `Dev@12345` |
| **Account Type** | Superuser + Staff |
| **Subscription** | PREMIUM (Unlimited) |

---

## 🌐 Access URLs

### Frontend Application
```
http://localhost:5173
```
Login with developer credentials to test all user features.

### GraphQL Playground
```
http://localhost:8000/graphql
```
Test GraphQL queries and mutations directly.

### Django Admin Panel
```
http://localhost:8000/admin
```
Full database access, user management, and system administration.

---

## ✅ What's Included

### 🔓 **Unlimited Access**
- ✅ Unlimited projects
- ✅ Unlimited analyses
- ✅ All premium features unlocked
- ✅ No rate limits
- ✅ Full API access

### 📁 **Sample Projects**
Three demo projects created automatically:
1. **Sample React App** - Frontend testing
2. **Sample Django API** - Backend testing
3. **Sample Node.js Server** - JavaScript testing

### 👤 **User Profile Set Up**
- Bio: "Developer account for testing all features"
- Company: "AI Analyser Dev Team"
- Location: "Development Environment"
- All preferences configured

### 🔔 **Notifications Enabled**
- Email notifications: ON
- Project updates: ON
- Dark theme: ON
- Desktop notifications: ON

---

## 🧪 Testing Capabilities

### Pages to Test
- [x] **Authentication**
  - Login page
  - Registration flow
  - Password reset
  - Email OTP verification

- [x] **Dashboard**
  - Project overview
  - Recent analyses
  - Statistics cards

- [x] **Projects**
  - Create new project
  - View project list
  - Project details
  - Edit/Delete projects

- [x] **Analysis**
  - Run analysis
  - View results
  - Download reports
  - Analysis history

- [x] **Subscription & Payments**
  - View pricing plans
  - Upgrade/downgrade
  - Payment processing (Razorpay)
  - Invoice generation

- [x] **User Settings**
  - Profile management
  - Change password
  - Notification preferences
  - Account settings

- [x] **Admin Panel**
  - User management
  - Plan configuration
  - Payment records
  - System logs

### Features to Test
- ✅ GraphQL mutations and queries
- ✅ File upload/download
- ✅ Real-time updates
- ✅ Email notifications
- ✅ Payment gateway integration
- ✅ Error handling
- ✅ Access control/permissions
- ✅ Search and filters
- ✅ Pagination
- ✅ Forms validation

---

## 🔄 Quick Commands

### Recreate Developer Account
```bash
cd backend
python manage.py create_developer
```

### Create with Custom Details
```bash
python manage.py create_developer \
  --username admin \
  --email admin@example.com \
  --password Admin@123 \
  --plan premium
```

### Reset Database & Recreate
```bash
# Warning: This deletes all data!
rm db.sqlite3
python manage.py migrate
python manage.py seed_plans
python manage.py create_developer
```

### Check Account in Django Shell
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
dev = User.objects.get(username='developer')
print(f"User: {dev.username}")
print(f"Email: {dev.email}")
print(f"Superuser: {dev.is_superuser}")
print(f"Staff: {dev.is_staff}")
print(f"Subscription: {dev.subscription.plan.name}")
print(f"Projects: {dev.projects.count()}")
```

---

## 🐛 Troubleshooting

### Can't Login?
1. Verify credentials: `developer` / `Dev@12345`
2. Check if user exists in admin panel
3. Reset password via admin panel or recreate account

### No Sample Projects?
```bash
python manage.py create_developer
```
This will create missing projects without affecting existing account.

### Need Different Plan?
```bash
python manage.py create_developer --plan basic
# or
python manage.py create_developer --plan free
```

### Admin Panel Not Working?
Check `is_staff` and `is_superuser` flags:
```python
from django.contrib.auth.models import User
user = User.objects.get(username='developer')
user.is_staff = True
user.is_superuser = True
user.save()
```

---

## 📝 Testing Checklist

Use this checklist when testing features:

### Authentication Flow
- [ ] Register new user
- [ ] Login with developer account
- [ ] Logout and login again
- [ ] Test "forgot password"
- [ ] Verify email OTP

### Project Management
- [ ] Create new project
- [ ] View all projects
- [ ] Update project details
- [ ] Delete project
- [ ] View project history

### Analysis Features
- [ ] Trigger analysis
- [ ] View analysis progress
- [ ] Check completed analysis results
- [ ] Download PDF report
- [ ] View metric details

### Payment & Subscription
- [ ] View pricing plans
- [ ] Initiate upgrade
- [ ] Test Razorpay checkout
- [ ] Verify payment webhook
- [ ] Check subscription status
- [ ] View invoices

### User Settings
- [ ] Update profile
- [ ] Change password
- [ ] Toggle preferences
- [ ] Test notifications
- [ ] Verify email changes

### Admin Functions
- [ ] Access admin panel
- [ ] View all users
- [ ] Check payment records
- [ ] Manage plans
- [ ] View system logs

---

**Last Updated**: March 9, 2026  
**Command**: `python manage.py create_developer`  
**Status**: ✅ Active and Ready for Testing
