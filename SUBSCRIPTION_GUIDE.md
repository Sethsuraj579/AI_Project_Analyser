# Subscription & Pricing Plans System

## Overview
Your AI Project Analyser now includes a comprehensive subscription system with three tiers: **Free**, **Basic**, and **Premium**.

## Plans

### 🟢 FREE Plan
- **Cost**: $0/month
- **Projects**: 5 maximum
- **Analyses**: Unlimited
- **Features**:
  - Up to 5 projects
  - Basic analysis
  - Email support
  - Standard metrics

### 🔵 BASIC Plan
- **Cost**: $29/month
- **Projects**: 20 maximum
- **Analyses**: Unlimited
- **Duration**: 30-day billing cycle
- **Features**:
  - Up to 20 projects
  - Unlimited analyses
  - 30-day project reports
  - Priority email support
  - Advanced metrics
  - Trend analysis
  - Custom thresholds

### 🟡 PREMIUM Plan
- **Cost**: $99/month
- **Projects**: Unlimited
- **Analyses**: Unlimited
- **Duration**: Monthly subscription
- **Features**:
  - Unlimited projects
  - Unlimited analyses
  - Unlimited reports
  - 24/7 priority support
  - All metrics & features
  - API access
  - Custom integrations
  - Dedicated account manager
  - Advanced analytics
  - Webhooks

## Implementation Details

### Database Schema

#### Plan Model
```python
class Plan(models.Model):
    name = CharField(choices=['free', 'basic', 'premium'])
    description = CharField(max_length=255)
    max_projects = IntegerField(-1 for unlimited)
    max_analyses_per_month = IntegerField(-1 for unlimited)
    price_per_month = DecimalField
    features = JSONField(list of feature strings)
```

#### UserSubscription Model
```python
class UserSubscription(models.Model):
    user = OneToOneField(User)
    plan = ForeignKey(Plan)
    subscribed_at = DateTimeField
    renews_at = DateTimeField (null for premium)
    projects_used = IntegerField
    analyses_used = IntegerField
    is_active = BooleanField
```

### Key Methods

#### UserSubscription.can_create_project()
- Checks if user can create another project
- Returns False if: no active plan, subscription expired, or project limit reached
- Returns True if: unlimited projects OR projects_used < max_projects

#### UserSubscription.can_run_analysis()
- Checks if user can run another analysis
- Validates monthly limit based on current billing period

#### UserSubscription.is_plan_expired()
- Returns True if subscription renewal date has passed (for Basic plan)
- Premium has no renewal date (perpetual)

## GraphQL API

### Queries

#### Get All Plans
```graphql
query {
  allPlans {
    id
    name
    description
    maxProjects
    maxAnalysesPerMonth
    pricePerMonth
    features
  }
}
```

#### Get Current User Subscription
```graphql
query {
  mySubscription {
    id
    plan {
      name
      maxProjects
      maxAnalysesPerMonth
    }
    projectsUsed
    analysesUsed
    renewsAt
    isPlanExpired
    canCreateProject
    canRunAnalysis
  }
}
```

### Mutations

#### Upgrade Plan
```graphql
mutation {
  upgradePlan(planName: "basic") {
    subscription {
      id
      plan {
        name
      }
      projectsUsed
      analysesUsed
    }
    success
    message
  }
}
```

Effect:
- Change user's plan to selected plan
- Reset usage counters to 0
- Set `renews_at` to 30 days from now (for Basic)
- Set `renews_at` to null (for Premium - no renewal)

#### Reset Plan Usage
```graphql
mutation {
  resetPlanUsage {
    subscription {
      id
      projectsUsed
      analysesUsed
      renewsAt
    }
    success
    message
  }
}
```

Effect:
- Reset `projects_used` and `analyses_used` to 0
- Update `renews_at` for next 30-day cycle (Basic only)

## Frontend Components

### PricingPlans.jsx
Displays all available plans with:
- Plan description and price
- Project/analysis limits
- Feature list
- "Select Plan" button
- Visual highlighting of current active plan
- Responsive grid layout

**Props**:
- `onSelectPlan` (callback): Called when user selects a plan
- `currentPlan` (string): Highlight current plan name

### SubscriptionStatus.jsx
Shows user's current subscription:
- Current plan badge
- Projects used vs limit (with progress bar)
- Analyses used vs limit (with progress bar)
- Renewal date for Basic plan
- Warning if subscription expired
- Link to pricing page

**Automatic Updates**:
- Polls subscription data every 60 seconds
- Shows real-time usage updates

### Pricing Page
Located at `/pricing`:
- Displays SubscriptionStatus component
- Shows PricingPlans component
- Allows users to upgrade their plan
- Back button to return to projects

## Automatic Behaviors

### On User Registration
- New user automatically assigned **FREE** plan
- UserSubscription created with `is_active=True`

### On User Login (Google OAuth)
- If new Google user: assigned FREE plan
- If existing user: uses their current plan

### Project Creation
- User can only create project if `can_create_project()` returns True
- `projects_used` counter incremented
- Error message if limit reached

### Plan Expiration (Basic Plan)
- When `renews_at` date passes, user cannot create projects
- Can be renewed by clicking link or upgrading plan
- `reset_plan_usage` mutation resets counters

## Future Enhancements

1. **Payment Processing Integration**
   - Stripe/PayPal integration
   - Automatic billing cycles
   - Invoice generation

2. **Admin Dashboard**
   - View all subscriptions
   - Manage plan details
   - Revenue reports

3. **Usage Alerts**
   - Email notifications at 80% usage
   - Upgrade reminders before expiration

4. **Custom Plans**
   - Allow admins to create custom tiers
   - Team/organizational accounts

5. **Trial Period**
   - 14-day free trial for Basic/Premium
   - Automatic downgrade to Free after trial

## Testing

Run the seed command to create plans:
```bash
python manage.py seed_plans
```

View all plans in Django admin:
```
http://localhost:8000/admin/analyser/plan/
```

Query plans via GraphQL:
```bash
# At /graphql/ endpoint
query {
  allPlans { id name pricePerMonth }
}
```
